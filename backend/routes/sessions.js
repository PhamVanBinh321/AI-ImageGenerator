import express from 'express';
import ChatSession from '../models/ChatSession.js';

const router = express.Router();

// @route   GET api/sessions
// @desc    Get all chat sessions for a user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const sessions = await ChatSession.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/sessions/new
// @desc    Create a new chat session
// @access  Private
router.post('/new', async (req, res) => {
    try {
        const newSession = new ChatSession({
            user: req.user.id,
            title: 'Cuộc trò chuyện mới',
            messages: [
                {
                    id: 'init',
                    sender: 'ai',
                    text: 'Chào bạn! Hãy cho tôi biết ý tưởng về bức ảnh bạn muốn tạo. Bạn có thể yêu cầu nhiều ảnh hoặc tỷ lệ cụ thể (vd: "một chú mèo phi hành gia, 16:9, 2 phiên bản").',
                },
            ],
            createdAt: Date.now(),
        });

        await newSession.save();
        res.status(201).json(newSession);

    } catch (error) {
        console.error('Error creating new session:', error.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/sessions/:id
// @desc    Delete a chat session
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const session = await ChatSession.findOne({ _id: req.params.id, user: req.user.id });
        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        await ChatSession.deleteOne({ _id: req.params.id });

        res.json({ msg: 'Session removed' });

    } catch (error) {
        console.error('Error deleting session:', error.message);
        // Handle CastError for invalid ObjectId
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Session not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST api/sessions/:sessionId/messages/:messageId/feedback
// @desc    Update feedback for a message (like/dislike)
// @access  Private
router.post('/:sessionId/messages/:messageId/feedback', async (req, res) => {
    try {
        const { sessionId, messageId } = req.params;
        const { type } = req.body; // 'like', 'dislike', or null to remove

        // Validate feedback type
        if (type !== null && type !== 'like' && type !== 'dislike') {
            return res.status(400).json({ error: 'Invalid feedback type. Must be "like", "dislike", or null' });
        }

        const session = await ChatSession.findOne({ _id: sessionId, user: req.user.id });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const message = session.messages.find(msg => msg.id === messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Update feedback
        const updateData = {
            'messages.$.feedback.type': type,
        };

        // Nếu type là null, xóa feedback
        if (type === null) {
            updateData['messages.$.feedback.type'] = null;
        }

        await ChatSession.updateOne(
            { _id: sessionId, 'messages.id': messageId },
            { $set: updateData }
        );

        res.json({ success: true, feedback: { type } });
    } catch (error) {
        console.error('Error updating feedback:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @route   POST api/sessions/:sessionId/messages/:messageId/report
// @desc    Report a message
// @access  Private
router.post('/:sessionId/messages/:messageId/report', async (req, res) => {
    try {
        const { sessionId, messageId } = req.params;

        const session = await ChatSession.findOne({ _id: sessionId, user: req.user.id });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const message = session.messages.find(msg => msg.id === messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Update report status
        await ChatSession.updateOne(
            { _id: sessionId, 'messages.id': messageId },
            { 
                $set: { 
                    'messages.$.feedback.reported': true,
                    'messages.$.feedback.reportedAt': new Date()
                }
            }
        );

        res.json({ success: true, message: 'Message reported successfully' });
    } catch (error) {
        console.error('Error reporting message:', error.message);
        res.status(500).json({ error: 'Server Error' });
    }
});


export default router;