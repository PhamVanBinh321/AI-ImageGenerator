import express from 'express';
import {
    createPayment,
    handleIPN,
    handleSuccess,
    handleError,
    handleCancel,
    checkTransaction,
    manualUpdateCredit,
    getTransactions
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to capture raw body for IPN
const captureRawBody = (req, res, next) => {
    let rawBody = '';
    req.on('data', chunk => {
        rawBody += chunk.toString();
    });
    req.on('end', () => {
        req.rawBody = rawBody;
        next();
    });
};

/**
 * POST /api/payment/create
 * Tạo payment form fields với SePay SDK
 */
router.post('/create', authMiddleware, createPayment);

/**
 * POST /api/payment/ipn
 * Nhận IPN (Instant Payment Notification) từ SePay
 */
router.post('/ipn', captureRawBody, express.json(), handleIPN);

/**
 * GET/POST /api/payment/success
 * Callback khi thanh toán thành công
 */
router.all('/success', handleSuccess);

/**
 * GET/POST /api/payment/error
 * Callback khi thanh toán thất bại
 */
router.all('/error', handleError);

/**
 * GET/POST /api/payment/cancel
 * Callback khi người dùng hủy thanh toán
 */
router.all('/cancel', handleCancel);

/**
 * GET /api/payment/check-transaction/:invoiceNumber
 * Kiểm tra trạng thái transaction và refresh credits nếu cần
 */
router.get('/check-transaction/:invoiceNumber', authMiddleware, checkTransaction);

/**
 * POST /api/payment/manual-update-credit/:invoiceNumber
 * Manually update credit nếu transaction đã completed nhưng credit chưa được cộng
 */
router.post('/manual-update-credit/:invoiceNumber', authMiddleware, manualUpdateCredit);

/**
 * GET /api/payment/transactions
 * Lấy lịch sử giao dịch của user
 */
router.get('/transactions', authMiddleware, getTransactions);

export default router;
