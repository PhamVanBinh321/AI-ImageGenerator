import express from 'express';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import User from '../models/User.js';
import ChatSession from '../models/ChatSession.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Tất cả routes đều cần adminMiddleware
router.use(adminMiddleware);

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Users statistics
        const totalUsers = await User.countDocuments();
        const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
        const newUsersWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });
        const newUsersMonth = await User.countDocuments({ createdAt: { $gte: monthAgo } });

        // Sessions statistics
        const totalSessions = await ChatSession.countDocuments();
        const newSessionsToday = await ChatSession.countDocuments({ createdAt: { $gte: today } });
        const newSessionsWeek = await ChatSession.countDocuments({ createdAt: { $gte: weekAgo } });
        const newSessionsMonth = await ChatSession.countDocuments({ createdAt: { $gte: monthAgo } });

        // Transactions statistics
        const totalTransactions = await Transaction.countDocuments();
        const transactionsByStatus = await Transaction.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const statusCounts = {
            pending: 0,
            completed: 0,
            failed: 0,
            cancelled: 0
        };
        transactionsByStatus.forEach(item => {
            statusCounts[item._id] = item.count;
        });

        // Revenue statistics
        const revenueResult = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // Credits statistics
        const creditsResult = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            { $group: { 
                _id: null, 
                totalCredits: { $sum: '$credits' },
                totalBonusCredits: { $sum: '$bonusCredits' }
            } }
        ]);
        const totalCreditsIssued = (creditsResult[0]?.totalCredits || 0) + (creditsResult[0]?.totalBonusCredits || 0);

        // Credits used (tính từ messages có imageUrls)
        const sessionsWithImages = await ChatSession.aggregate([
            { $unwind: '$messages' },
            { $match: { 'messages.imageUrls': { $exists: true, $ne: [] } } },
            { $group: { _id: null, count: { $sum: { $size: '$messages.imageUrls' } } } }
        ]);
        const totalCreditsUsed = sessionsWithImages[0]?.count || 0;

        // Feedback statistics
        const feedbackResult = await ChatSession.aggregate([
            { $unwind: '$messages' },
            { $match: { 'messages.feedback': { $exists: true } } },
            { $group: {
                _id: '$messages.feedback.type',
                count: { $sum: 1 }
            } }
        ]);
        const feedbackStats = {
            like: 0,
            dislike: 0,
            report: 0
        };
        feedbackResult.forEach(item => {
            if (item._id === 'like') feedbackStats.like = item.count;
            if (item._id === 'dislike') feedbackStats.dislike = item.count;
        });
        const reportedCount = await ChatSession.countDocuments({
            'messages.feedback.reported': true
        });
        feedbackStats.report = reportedCount;

        res.json({
            users: {
                total: totalUsers,
                newToday: newUsersToday,
                newWeek: newUsersWeek,
                newMonth: newUsersMonth
            },
            sessions: {
                total: totalSessions,
                newToday: newSessionsToday,
                newWeek: newSessionsWeek,
                newMonth: newSessionsMonth
            },
            transactions: {
                total: totalTransactions,
                byStatus: statusCounts
            },
            revenue: {
                total: totalRevenue
            },
            credits: {
                issued: totalCreditsIssued,
                used: totalCreditsUsed,
                remaining: totalCreditsIssued - totalCreditsUsed
            },
            feedback: feedbackStats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

router.get('/dashboard/charts', async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Revenue over time
        const revenueData = await Transaction.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // New users over time
        const usersData = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Transactions by status
        const transactionsByStatus = await Transaction.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            revenue: revenueData,
            users: usersData,
            transactionsByStatus: transactionsByStatus
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// ==================== USERS ====================
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', minCredits, maxCredits, startDate, endDate } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Limit max 100 per page
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query = {};
        if (search) {
            query.email = { $regex: search, $options: 'i' };
        }
        if (minCredits || maxCredits) {
            query.credits = {};
            if (minCredits) query.credits.$gte = parseInt(minCredits);
            if (maxCredits) query.credits.$lte = parseInt(maxCredits);
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Get total count
        const total = await User.countDocuments(query);

        // Get users with pagination
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(); // Use lean() for better performance

        // Get user IDs for stats aggregation
        const userIds = users.map(user => user._id);

        // Get all stats in parallel using aggregation
        const [sessionStats, transactionStats, totalSpentStats] = await Promise.all([
            // Session counts
            ChatSession.aggregate([
                { $match: { user: { $in: userIds } } },
                { $group: { _id: '$user', count: { $sum: 1 } } }
            ]),
            // Transaction counts
            Transaction.aggregate([
                { $match: { user: { $in: userIds } } },
                { $group: { _id: '$user', count: { $sum: 1 } } }
            ]),
            // Total spent (only completed transactions)
            Transaction.aggregate([
                { $match: { user: { $in: userIds }, status: 'completed' } },
                { $group: { _id: '$user', total: { $sum: '$amount' } } }
            ])
        ]);

        // Create maps for quick lookup
        const sessionCountMap = new Map(sessionStats.map(item => [item._id.toString(), item.count]));
        const transactionCountMap = new Map(transactionStats.map(item => [item._id.toString(), item.count]));
        const totalSpentMap = new Map(totalSpentStats.map(item => [item._id.toString(), item.total]));

        // Combine users with stats
        const usersWithStats = users.map(user => ({
            ...user,
            sessionCount: sessionCountMap.get(user._id.toString()) || 0,
            transactionCount: transactionCountMap.get(user._id.toString()) || 0,
            totalSpent: totalSpentMap.get(user._id.toString()) || 0
        }));

        res.json({
            users: usersWithStats,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        // Validate MongoDB ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const sessions = await ChatSession.find({ user: user._id })
            .sort({ updatedAt: -1 })
            .limit(10);

        const transactions = await Transaction.find({ user: user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            user,
            recentSessions: sessions,
            recentTransactions: transactions
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

router.patch('/users/:id', async (req, res) => {
    try {
        // Validate MongoDB ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        
        const { credits } = req.body;
        if (credits !== undefined && typeof credits !== 'number') {
            return res.status(400).json({ error: 'Credits must be a number' });
        }
        
        if (credits !== undefined && credits < 0) {
            return res.status(400).json({ error: 'Credits cannot be negative' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { credits } },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        // Validate MongoDB ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Optionally delete related data
        await ChatSession.deleteMany({ user: user._id });
        // Transactions should probably be kept for records

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

router.post('/users/bulk', async (req, res) => {
    try {
        const { userIds, operation, credits } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'userIds must be a non-empty array' });
        }

        // Validate all userIds are valid ObjectIds
        const invalidIds = userIds.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
            return res.status(400).json({ error: 'Invalid user ID format in userIds array' });
        }

        if (!['add', 'subtract', 'delete'].includes(operation)) {
            return res.status(400).json({ error: 'Operation must be add, subtract, or delete' });
        }

        if (operation !== 'delete' && (typeof credits !== 'number' || credits <= 0)) {
            return res.status(400).json({ error: 'Credits must be a positive number' });
        }

        if (operation === 'delete') {
            await User.deleteMany({ _id: { $in: userIds } });
            await ChatSession.deleteMany({ user: { $in: userIds } });
            return res.json({ message: `${userIds.length} users deleted successfully` });
        }

        const updateOperation = operation === 'add' 
            ? { $inc: { credits } }
            : { $inc: { credits: -credits } };

        const result = await User.updateMany(
            { _id: { $in: userIds } },
            updateOperation
        );

        res.json({ 
            message: `${result.modifiedCount} users updated successfully`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error in bulk user operation:', error);
        res.status(500).json({ error: 'Failed to perform bulk operation' });
    }
});

// ==================== SESSIONS ====================
router.get('/sessions', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', userId, startDate, endDate, hasImages } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const query = {};
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        if (userId) {
            query.user = userId;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        if (hasImages === 'true') {
            query['messages.imageUrls'] = { $exists: true, $ne: [] };
        }

        const sessions = await ChatSession.find(query)
            .populate('user', 'email')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const sessionsWithStats = sessions.map(session => ({
            ...session.toObject(),
            messagesCount: session.messages.length,
            hasImages: session.messages.some(m => m.imageUrls && m.imageUrls.length > 0)
        }));

        const total = await ChatSession.countDocuments(query);

        res.json({
            sessions: sessionsWithStats,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

router.get('/sessions/:id', async (req, res) => {
    try {
        // Validate MongoDB ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid session ID format' });
        }
        
        const session = await ChatSession.findById(req.params.id)
            .populate('user', 'email credits');

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        console.error('Error fetching session details:', error);
        res.status(500).json({ error: 'Failed to fetch session details' });
    }
});

router.delete('/sessions/:id', async (req, res) => {
    try {
        // Validate MongoDB ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid session ID format' });
        }
        
        const session = await ChatSession.findByIdAndDelete(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

// ==================== TRANSACTIONS ====================
router.get('/transactions', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', status, startDate, endDate, minAmount, maxAmount, packageId } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const query = {};
        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { orderId: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            query.status = status;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = parseFloat(minAmount);
            if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
        }
        if (packageId) {
            query.packageId = packageId;
        }

        const transactions = await Transaction.find(query)
            .populate('user', 'email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Transaction.countDocuments(query);

        res.json({
            transactions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

router.get('/transactions/:id', async (req, res) => {
    try {
        // Validate MongoDB ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid transaction ID format' });
        }
        
        const transaction = await Transaction.findById(req.params.id)
            .populate('user', 'email credits');

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        res.status(500).json({ error: 'Failed to fetch transaction details' });
    }
});

router.patch('/transactions/:id', async (req, res) => {
    try {
        // Validate MongoDB ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid transaction ID format' });
        }
        
        const { status } = req.body;
        if (!['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const transaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { $set: { status } },
            { new: true }
        ).populate('user', 'email');

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// ==================== FEEDBACK ====================
router.get('/feedback/reports', async (req, res) => {
    try {
        const { page = 1, limit = 20, startDate, endDate } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        // Build query for sessions with reported messages
        const sessionQuery = { 'messages.feedback.reported': true };
        if (startDate || endDate) {
            sessionQuery['messages.feedback.reportedAt'] = {};
            if (startDate) sessionQuery['messages.feedback.reportedAt'].$gte = new Date(startDate);
            if (endDate) sessionQuery['messages.feedback.reportedAt'].$lte = new Date(endDate);
        }

        // First, count total reported messages using aggregation
        const totalCountResult = await ChatSession.aggregate([
            { $match: sessionQuery },
            { $unwind: '$messages' },
            { $match: { 'messages.feedback.reported': true } },
            { $count: 'total' }
        ]);
        const total = totalCountResult[0]?.total || 0;

        // Then fetch sessions with pagination
        // We need to fetch more sessions to ensure we get enough reported messages
        const sessions = await ChatSession.find(sessionQuery)
            .populate('user', 'email')
            .sort({ 'messages.feedback.reportedAt': -1 })
            .limit(limitNum * 2) // Fetch more to account for sessions with multiple reported messages
            .lean();

        // Extract all reported messages and sort them
        const reportedMessages = [];
        sessions.forEach(session => {
            session.messages.forEach(message => {
                if (message.feedback?.reported) {
                    // Apply date filter if needed
                    const reportedAt = message.feedback.reportedAt;
                    if (startDate && new Date(reportedAt) < new Date(startDate)) return;
                    if (endDate && new Date(reportedAt) > new Date(endDate)) return;
                    
                    reportedMessages.push({
                        messageId: message.id,
                        sessionId: session._id,
                        sessionTitle: session.title,
                        userEmail: session.user?.email || 'N/A',
                        messagePreview: message.text || message.optimizedPrompt || 'No text',
                        reportedAt: reportedAt
                    });
                }
            });
        });

        // Sort by reportedAt descending and apply pagination
        reportedMessages.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
        const paginatedMessages = reportedMessages.slice(skip, skip + limitNum);

        res.json({
            reports: paginatedMessages,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

router.patch('/feedback/reports/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const session = await ChatSession.findOne({ 'messages.id': messageId });

        if (!session) {
            return res.status(404).json({ error: 'Message not found' });
        }

        await ChatSession.updateOne(
            { 'messages.id': messageId },
            { 
                $set: { 
                    'messages.$.feedback.reported': false,
                    'messages.$.feedback.reportedAt': null
                } 
            }
        );

        res.json({ message: 'Report dismissed successfully' });
    } catch (error) {
        console.error('Error dismissing report:', error);
        res.status(500).json({ error: 'Failed to dismiss report' });
    }
});

router.get('/feedback/stats', async (req, res) => {
    try {
        const feedbackResult = await ChatSession.aggregate([
            { $unwind: '$messages' },
            { $match: { 'messages.feedback.type': { $in: ['like', 'dislike'] } } },
            { $group: {
                _id: '$messages.feedback.type',
                count: { $sum: 1 }
            } }
        ]);

        const stats = {
            like: 0,
            dislike: 0,
            report: 0
        };

        feedbackResult.forEach(item => {
            if (item._id === 'like') stats.like = item.count;
            if (item._id === 'dislike') stats.dislike = item.count;
        });

        const reportedCount = await ChatSession.countDocuments({
            'messages.feedback.reported': true
        });
        stats.report = reportedCount;

        const ratio = stats.like + stats.dislike > 0 
            ? (stats.like / (stats.like + stats.dislike) * 100).toFixed(2)
            : 0;

        res.json({
            ...stats,
            likeDislikeRatio: parseFloat(ratio)
        });
    } catch (error) {
        console.error('Error fetching feedback stats:', error);
        res.status(500).json({ error: 'Failed to fetch feedback statistics' });
    }
});

// ==================== CREDITS ====================
router.post('/credits/add', async (req, res) => {
    try {
        const { userId, credits } = req.body;
        if (!userId || !credits || credits <= 0) {
            return res.status(400).json({ error: 'userId and positive credits are required' });
        }
        
        // Validate MongoDB ObjectId
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        
        if (credits > 1000000) {
            return res.status(400).json({ error: 'Credits amount too large (max 1,000,000)' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { credits } },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user, message: `Added ${credits} credits successfully` });
    } catch (error) {
        console.error('Error adding credits:', error);
        res.status(500).json({ error: 'Failed to add credits' });
    }
});

router.post('/credits/subtract', async (req, res) => {
    try {
        const { userId, credits } = req.body;
        if (!userId || !credits || credits <= 0) {
            return res.status(400).json({ error: 'userId and positive credits are required' });
        }
        
        // Validate MongoDB ObjectId
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.credits < credits) {
            return res.status(400).json({ error: 'User does not have enough credits' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { credits: -credits } },
            { new: true }
        ).select('-password');

        res.json({ user: updatedUser, message: `Subtracted ${credits} credits successfully` });
    } catch (error) {
        console.error('Error subtracting credits:', error);
        res.status(500).json({ error: 'Failed to subtract credits' });
    }
});

router.post('/credits/bulk', async (req, res) => {
    try {
        const { userIds, operation, credits } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'userIds must be a non-empty array' });
        }

        // Validate all userIds are valid ObjectIds
        const invalidIds = userIds.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
        if (invalidIds.length > 0) {
            return res.status(400).json({ error: 'Invalid user ID format in userIds array' });
        }

        if (!['add', 'subtract'].includes(operation)) {
            return res.status(400).json({ error: 'Operation must be add or subtract' });
        }

        if (typeof credits !== 'number' || credits <= 0) {
            return res.status(400).json({ error: 'Credits must be a positive number' });
        }
        
        if (credits > 1000000) {
            return res.status(400).json({ error: 'Credits amount too large (max 1,000,000)' });
        }

        const updateOperation = operation === 'add' 
            ? { $inc: { credits } }
            : { $inc: { credits: -credits } };

        const result = await User.updateMany(
            { _id: { $in: userIds } },
            updateOperation
        );

        res.json({ 
            message: `${operation === 'add' ? 'Added' : 'Subtracted'} ${credits} credits to ${result.modifiedCount} users`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error in bulk credit operation:', error);
        res.status(500).json({ error: 'Failed to perform bulk credit operation' });
    }
});

router.get('/credits/stats', async (req, res) => {
    try {
        // Total credits issued
        const creditsResult = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            { $group: { 
                _id: null, 
                totalCredits: { $sum: '$credits' },
                totalBonusCredits: { $sum: '$bonusCredits' }
            } }
        ]);
        const totalIssued = (creditsResult[0]?.totalCredits || 0) + (creditsResult[0]?.totalBonusCredits || 0);

        // Total credits used
        const sessionsWithImages = await ChatSession.aggregate([
            { $unwind: '$messages' },
            { $match: { 'messages.imageUrls': { $exists: true, $ne: [] } } },
            { $group: { _id: null, count: { $sum: { $size: '$messages.imageUrls' } } } }
        ]);
        const totalUsed = sessionsWithImages[0]?.count || 0;

        // Current credits in system
        const currentCreditsResult = await User.aggregate([
            { $group: { _id: null, total: { $sum: '$credits' } } }
        ]);
        const currentCredits = currentCreditsResult[0]?.total || 0;

        // Top users by credits
        const topUsers = await User.find()
            .select('email credits')
            .sort({ credits: -1 })
            .limit(10);

        res.json({
            totalIssued,
            totalUsed,
            remaining: totalIssued - totalUsed,
            currentCredits,
            topUsers
        });
    } catch (error) {
        console.error('Error fetching credit stats:', error);
        res.status(500).json({ error: 'Failed to fetch credit statistics' });
    }
});

// ==================== SETTINGS ====================
router.get('/settings', async (req, res) => {
    try {
        // For now, return static settings
        // In the future, this could be stored in a Settings model
        const settings = {
            creditPackages: [
                { id: '1', credits: 10, bonusCredits: 0, price: 10000 },
                { id: '2', credits: 35, bonusCredits: 5, price: 30000 },
                { id: '3', credits: 130, bonusCredits: 30, price: 100000 }
            ],
            defaultCredits: 10,
            apiKeys: {
                gemini: process.env.API_KEY ? '***' + process.env.API_KEY.slice(-4) : 'Not set',
                sepay: process.env.SEPAY_API_KEY ? '***' + process.env.SEPAY_API_KEY.slice(-4) : 'Not set'
            },
            systemInfo: {
                version: '1.0.0',
                uptime: process.uptime(),
                nodeVersion: process.version
            }
        };

        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.patch('/settings', async (req, res) => {
    try {
        // For now, settings are static
        // In the future, this could update a Settings model
        res.json({ message: 'Settings update not yet implemented' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;

