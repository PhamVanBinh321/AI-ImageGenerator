import express from 'express';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import {
    getDashboardStats,
    getDashboardCharts,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    bulkUserOperations,
    getSessions,
    getSession,
    deleteSession,
    getTransactions,
    getTransaction,
    updateTransaction,
    getReports,
    dismissReport,
    getFeedbackStats,
    addCredits,
    subtractCredits
} from '../controllers/adminController.js';

const router = express.Router();

// Tất cả routes đều cần adminMiddleware
router.use(adminMiddleware);

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/charts', getDashboardCharts);

// ==================== USERS ====================
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/bulk', bulkUserOperations);

// ==================== SESSIONS ====================
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSession);
router.delete('/sessions/:id', deleteSession);

// ==================== TRANSACTIONS ====================
router.get('/transactions', getTransactions);
router.get('/transactions/:id', getTransaction);
router.patch('/transactions/:id', updateTransaction);

// ==================== FEEDBACK ====================
router.get('/feedback/reports', getReports);
router.patch('/feedback/reports/:messageId', dismissReport);
router.get('/feedback/stats', getFeedbackStats);

// ==================== CREDITS ====================
router.post('/credits/add', addCredits);
router.post('/credits/subtract', subtractCredits);

export default router;
