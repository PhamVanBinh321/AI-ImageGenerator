import express from 'express';
import { SePayPgClient } from 'sepay-pg-node';
import { authMiddleware } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Cấu hình SePay
const SEPAY_MERCHANT_ID = process.env.SEPAY_MERCHANT_ID;
const SEPAY_SECRET_KEY = process.env.SEPAY_SECRET_KEY;
const SEPAY_ENV = process.env.SEPAY_ENV || 'sandbox'; // 'sandbox' hoặc 'production'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Khởi tạo SePay client (chỉ khởi tạo nếu có đủ thông tin)
let sepayClient = null;

if (SEPAY_MERCHANT_ID && SEPAY_SECRET_KEY) {
    try {
        sepayClient = new SePayPgClient({
            env: SEPAY_ENV,
            merchant_id: SEPAY_MERCHANT_ID,
            secret_key: SEPAY_SECRET_KEY,
        });
        console.log('SePay client initialized successfully');
    } catch (error) {
        console.error('Error initializing SePay client:', error);
    }
} else {
    console.warn('SePay credentials not configured. Payment features will not work.');
}

// Mapping các gói credit
const CREDIT_PACKAGES = {
    'package-1': { price: 10000, credits: 10, bonus: 0 },
    'package-2': { price: 30000, credits: 35, bonus: 5 },
    'package-3': { price: 100000, credits: 130, bonus: 30 },
};

/**
 * Tạo order ID duy nhất
 */
const generateOrderId = () => {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

/**
 * Tạo invoice number duy nhất
 */
const generateInvoiceNumber = () => {
    return `INV-${Date.now()}`;
};

/**
 * POST /api/payment/create
 * Tạo payment form fields với SePay SDK
 */
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { packageId } = req.body;

        if (!packageId || !CREDIT_PACKAGES[packageId]) {
            return res.status(400).json({ error: 'Gói credit không hợp lệ' });
        }

        if (!SEPAY_MERCHANT_ID || !SEPAY_SECRET_KEY) {
            return res.status(500).json({ error: 'SePay chưa được cấu hình. Vui lòng liên hệ admin.' });
        }

        if (!sepayClient) {
            return res.status(500).json({ error: 'SePay client chưa được khởi tạo. Vui lòng kiểm tra cấu hình.' });
        }

        const packageInfo = CREDIT_PACKAGES[packageId];
        const orderId = generateOrderId();
        const invoiceNumber = generateInvoiceNumber();

        // Tạo transaction trong DB
        const transaction = new Transaction({
            user: req.user.id,
            orderId,
            invoiceNumber,
            packageId,
            amount: packageInfo.price,
            credits: packageInfo.credits,
            bonusCredits: packageInfo.bonus,
            status: 'pending',
        });
        await transaction.save();

        // Kiểm tra xem SDK có method checkout không
        console.log('SePay client:', sepayClient);
        console.log('SePay client methods:', Object.keys(sepayClient || {}));
        
        if (!sepayClient.checkout) {
            console.error('SePay client structure:', JSON.stringify(sepayClient, null, 2));
            throw new Error('SePay SDK không có method checkout. Vui lòng kiểm tra lại SDK version và cấu hình.');
        }
        
        console.log('Checkout methods:', Object.keys(sepayClient.checkout || {}));

        // Lấy checkout URL từ SDK
        let checkoutURL;
        try {
            checkoutURL = sepayClient.checkout.initCheckoutUrl();
            console.log('Checkout URL:', checkoutURL);
        } catch (error) {
            console.error('Error getting checkout URL:', error);
            throw new Error(`Không thể lấy checkout URL: ${error.message}`);
        }

        // Tạo form fields từ SDK
        // Thêm invoice_number vào success_url để có thể lấy lại khi redirect
        const successUrl = `${BASE_URL}/api/payment/success?invoice_number=${encodeURIComponent(invoiceNumber)}`;
        const errorUrl = `${BASE_URL}/api/payment/error?invoice_number=${encodeURIComponent(invoiceNumber)}`;
        const cancelUrl = `${BASE_URL}/api/payment/cancel?invoice_number=${encodeURIComponent(invoiceNumber)}`;
        
        let checkoutFormfields;
        try {
            checkoutFormfields = sepayClient.checkout.initOneTimePaymentFields({
                operation: 'PURCHASE',
                payment_method: 'BANK_TRANSFER',
                order_invoice_number: invoiceNumber,
                order_amount: packageInfo.price,
                currency: 'VND',
                order_description: `Mua ${packageInfo.credits + packageInfo.bonus} credit`,
                success_url: successUrl,
                error_url: errorUrl,
                cancel_url: cancelUrl,
            });
            console.log('Form Fields:', checkoutFormfields);
        } catch (error) {
            console.error('Error creating form fields:', error);
            throw new Error(`Không thể tạo form fields: ${error.message}`);
        }

        // Kiểm tra xem SDK có trả về đúng format không
        if (!checkoutURL) {
            throw new Error('Checkout URL là null hoặc undefined');
        }

        if (!checkoutFormfields || typeof checkoutFormfields !== 'object') {
            console.error('Invalid form fields:', checkoutFormfields);
            throw new Error('Form fields không hợp lệ');
        }

        // Chuẩn bị response
        const responseData = {
            checkoutUrl: checkoutURL,
            formFields: checkoutFormfields,
            orderId: orderId,
            invoiceNumber: invoiceNumber,
            transactionId: transaction._id.toString(),
        };

        console.log('Sending response:', JSON.stringify(responseData, null, 2));

        res.json(responseData);
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ 
            error: 'Đã có lỗi xảy ra khi tạo thanh toán',
            details: error.message 
        });
    }
});

/**
 * Middleware để capture raw body cho IPN
 */
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
 * POST /api/payment/ipn
 * Nhận IPN (Instant Payment Notification) từ SePay
 */
router.post('/ipn', captureRawBody, express.json(), async (req, res) => {
    try {
        // Log raw body trước khi parse
        console.log('=== IPN RECEIVED ===');
        console.log('IPN raw body (string):', req.rawBody);
        console.log('IPN headers:', JSON.stringify(req.headers, null, 2));
        console.log('IPN method:', req.method);
        console.log('IPN URL:', req.url);
        console.log('IPN query:', req.query);
        
        const data = req.body;
        console.log('IPN parsed body:', JSON.stringify(data, null, 2));

        // Tìm invoice number từ nhiều nguồn khác nhau (hỗ trợ nhiều format)
        let invoiceNumber = null;
        let orderData = null;
        let transactionData = null;

        // Format 1: data.order.order_invoice_number
        if (data.order && data.order.order_invoice_number) {
            invoiceNumber = data.order.order_invoice_number;
            orderData = data.order;
            transactionData = data.transaction;
        }
        // Format 2: data.order_invoice_number (trực tiếp)
        else if (data.order_invoice_number) {
            invoiceNumber = data.order_invoice_number;
            orderData = data.order || data;
            transactionData = data.transaction || data;
        }
        // Format 3: data.invoice_number
        else if (data.invoice_number) {
            invoiceNumber = data.invoice_number;
            orderData = data.order || data;
            transactionData = data.transaction || data;
        }

        console.log('Extracted invoiceNumber:', invoiceNumber);
        console.log('Notification type:', data.notification_type || data.type || 'N/A');
        console.log('Order status:', orderData?.status || data.status || 'N/A');

        // Kiểm tra các trường hợp thanh toán thành công
        const isPaymentSuccess = 
            data.notification_type === 'ORDER_PAID' ||
            data.type === 'ORDER_PAID' ||
            data.notification_type === 'payment_success' ||
            data.type === 'payment_success' ||
            orderData?.status === 'PAID' ||
            orderData?.status === 'paid' ||
            data.status === 'PAID' ||
            data.status === 'paid' ||
            (data.order && (data.order.status === 'PAID' || data.order.status === 'paid'));

        if (isPaymentSuccess && invoiceNumber) {
            const transaction = await Transaction.findOne({ invoiceNumber });

            if (!transaction) {
                console.error('❌ Transaction not found for invoiceNumber:', invoiceNumber);
                console.error('Available invoiceNumbers in DB:', await Transaction.find({}).select('invoiceNumber').limit(10));
                return res.status(404).json({ error: 'Transaction not found' });
            }

            // Kiểm tra xem đã xử lý chưa
            if (transaction.status === 'completed') {
                console.log('ℹ️ Transaction already processed:', invoiceNumber);
                // Vẫn cộng credit nếu chưa có (fallback)
                const user = await User.findById(transaction.user);
                if (user) {
                    const expectedCredits = transaction.credits + transaction.bonusCredits;
                    // Kiểm tra xem credit đã được cộng chưa bằng cách so sánh
                    // Nếu user có ít credit hơn expected, có thể credit chưa được cộng
                    console.log(`Current user credits: ${user.credits}, Expected after transaction: ${expectedCredits}`);
                }
                return res.status(200).json({ success: true, message: 'Already processed' });
            }

            console.log('🔄 Processing transaction:', {
                invoiceNumber: transaction.invoiceNumber,
                userId: transaction.user,
                credits: transaction.credits,
                bonusCredits: transaction.bonusCredits,
                currentStatus: transaction.status
            });

            // Cập nhật transaction
            transaction.status = 'completed';
            if (orderData?.id) transaction.sepayOrderId = orderData.id;
            if (transactionData?.transaction_id) transaction.sepayTransactionId = transactionData.transaction_id;
            if (transactionData?.payment_method) transaction.paymentMethod = transactionData.payment_method;
            transaction.ipnData = data;
            await transaction.save();

            // Cộng credit cho user
            const totalCredits = transaction.credits + transaction.bonusCredits;
            const userBefore = await User.findById(transaction.user);
            const creditsBefore = userBefore?.credits || 0;
            
            const updatedUser = await User.findByIdAndUpdate(
                transaction.user,
                { $inc: { credits: totalCredits } },
                { new: true }
            );

            if (!updatedUser) {
                console.error('❌ Failed to update user credits. User not found:', transaction.user);
                return res.status(500).json({ error: 'Failed to update user credits' });
            }

            console.log(`✅ Payment completed: ${invoiceNumber}`);
            console.log(`✅ Credits added: ${totalCredits} (${transaction.credits} + ${transaction.bonusCredits} bonus)`);
            console.log(`✅ User ID: ${transaction.user}`);
            console.log(`✅ Credits: ${creditsBefore} -> ${updatedUser.credits}`);
        } else {
            console.log('⚠️ IPN received but not recognized as successful payment:');
            console.log('  - notification_type:', data.notification_type || data.type || 'N/A');
            console.log('  - status:', data.status || orderData?.status || 'N/A');
            console.log('  - invoiceNumber found:', invoiceNumber ? 'Yes' : 'No');
            console.log('  - Full data keys:', Object.keys(data));
        }

        // Trả về 200 để xác nhận đã nhận IPN (quan trọng để SePay không gửi lại)
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Error processing IPN:', error);
        console.error('Error stack:', error.stack);
        // Vẫn trả về 200 để SePay không gửi lại IPN liên tục
        // Nhưng log lỗi để debug
        res.status(200).json({ success: false, error: error.message });
    }
});

/**
 * GET/POST /api/payment/success
 * Callback khi thanh toán thành công
 * SePay có thể gửi GET hoặc POST
 */
router.all('/success', async (req, res) => {
    try {
        // Log tất cả thông tin từ request để debug
        console.log('=== SUCCESS CALLBACK RECEIVED ===');
        console.log('Query params:', req.query);
        console.log('Query string:', req.url);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', req.body);
        
        const { order_id, invoice_number, order_invoice_number, invoice, order } = req.query;
        
        // SePay có thể trả về invoice_number với tên khác nhau
        const invoiceNumber = invoice_number || order_invoice_number || invoice || order;
        
        console.log('Extracted invoice_number:', invoiceNumber);
        console.log('Extracted order_id:', order_id);
        
        // Kiểm tra và cập nhật transaction nếu có
        if (invoiceNumber) {
            const transaction = await Transaction.findOne({ invoiceNumber: invoiceNumber });
            
            if (transaction) {
                console.log('Transaction found:', {
                    invoiceNumber: transaction.invoiceNumber,
                    status: transaction.status,
                    userId: transaction.user,
                    createdAt: transaction.createdAt,
                    credits: transaction.credits,
                    bonusCredits: transaction.bonusCredits,
                });
                
                // Nếu transaction vẫn pending, có thể IPN chưa đến hoặc bị lỗi
                // Thêm fallback: nếu transaction đã được tạo hơn 30 giây trước và vẫn pending,
                // tự động cập nhật credit (IPN có thể đã bị miss)
                if (transaction.status === 'pending') {
                    const timeSinceCreation = Date.now() - new Date(transaction.createdAt).getTime();
                    const thirtySeconds = 30 * 1000;
                    
                    console.log(`Transaction still pending. Time since creation: ${Math.round(timeSinceCreation / 1000)}s`);
                    
                    // Nếu đã qua 30 giây và vẫn pending, có thể IPN không đến
                    // Cập nhật credit như một fallback mechanism
                    if (timeSinceCreation > thirtySeconds) {
                        console.log('⚠️ Transaction pending for more than 30s. Applying fallback credit update...');
                        
                        transaction.status = 'completed';
                        if (order_id) transaction.sepayOrderId = order_id;
                        transaction.ipnData = { source: 'success_callback_fallback', order_id };
                        await transaction.save();
                        
                        // Cộng credit cho user
                        const totalCredits = transaction.credits + transaction.bonusCredits;
                        const userBefore = await User.findById(transaction.user);
                        const creditsBefore = userBefore?.credits || 0;
                        
                        const updatedUser = await User.findByIdAndUpdate(
                            transaction.user,
                            { $inc: { credits: totalCredits } },
                            { new: true }
                        );
                        
                        if (updatedUser) {
                            console.log(`✅ Fallback: Credits added via success callback`);
                            console.log(`✅ Credits: ${creditsBefore} -> ${updatedUser.credits}`);
                        } else {
                            console.error('❌ Fallback: Failed to update user credits');
                        }
                    } else {
                        console.log('Transaction still pending, waiting for IPN... (less than 30s)');
                    }
                } else if (transaction.status === 'completed') {
                    console.log('✅ Transaction already completed via IPN');
                    // Kiểm tra xem credit đã được cộng chưa
                    const user = await User.findById(transaction.user);
                    if (user) {
                        console.log(`Current user credits: ${user.credits}`);
                    }
                }
            } else {
                console.error('❌ Transaction not found for invoice:', invoiceNumber);
            }
        } else {
            // Nếu không có invoice_number, thử tìm transaction pending gần nhất
            // (trong vòng 5 phút) - có thể là transaction vừa tạo
            console.log('⚠️ No invoice_number in callback. Trying to find recent pending transaction...');
            
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentPendingTransactions = await Transaction.find({
                status: 'pending',
                createdAt: { $gte: fiveMinutesAgo }
            }).sort({ createdAt: -1 }).limit(1);
            
            if (recentPendingTransactions.length > 0) {
                const transaction = recentPendingTransactions[0];
                console.log('Found recent pending transaction:', {
                    invoiceNumber: transaction.invoiceNumber,
                    userId: transaction.user,
                    createdAt: transaction.createdAt
                });
                
                // Áp dụng fallback: cập nhật credit cho transaction gần nhất
                const timeSinceCreation = Date.now() - new Date(transaction.createdAt).getTime();
                const thirtySeconds = 30 * 1000;
                
                if (timeSinceCreation > thirtySeconds) {
                    console.log('⚠️ Applying fallback credit update for recent transaction...');
                    
                    transaction.status = 'completed';
                    if (order_id) transaction.sepayOrderId = order_id;
                    transaction.ipnData = { source: 'success_callback_fallback_no_invoice', order_id, timestamp: new Date() };
                    await transaction.save();
                    
                    // Cộng credit cho user
                    const totalCredits = transaction.credits + transaction.bonusCredits;
                    const userBefore = await User.findById(transaction.user);
                    const creditsBefore = userBefore?.credits || 0;
                    
                    const updatedUser = await User.findByIdAndUpdate(
                        transaction.user,
                        { $inc: { credits: totalCredits } },
                        { new: true }
                    );
                    
                    if (updatedUser) {
                        console.log(`✅ Fallback: Credits added for transaction ${transaction.invoiceNumber}`);
                        console.log(`✅ Credits: ${creditsBefore} -> ${updatedUser.credits}`);
                    }
                }
            } else {
                console.log('No recent pending transactions found.');
            }
        }
        
        // Redirect về frontend với thông báo thành công
        res.redirect(`${FRONTEND_URL}/payment/success?order_id=${order_id || ''}&invoice_number=${invoiceNumber || ''}`);
    } catch (error) {
        console.error('❌ Error in success callback:', error);
        console.error('Error stack:', error.stack);
        res.redirect(`${FRONTEND_URL}/payment/success`);
    }
});

/**
 * GET/POST /api/payment/error
 * Callback khi thanh toán thất bại
 */
router.all('/error', async (req, res) => {
    try {
        // Log tất cả thông tin từ request để debug
        console.log('=== ERROR CALLBACK RECEIVED ===');
        console.log('Query params:', req.query);
        console.log('Query string:', req.url);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', req.body);
        
        const { order_id, invoice_number, order_invoice_number, invoice, order } = req.query;
        
        // SePay có thể trả về invoice_number với tên khác nhau
        const invoiceNumber = invoice_number || order_invoice_number || invoice || order;
        
        console.log('Extracted invoice_number:', invoiceNumber);
        console.log('Extracted order_id:', order_id);
        
        // Cập nhật transaction status nếu có invoice_number
        if (invoiceNumber) {
            const transaction = await Transaction.findOne({ invoiceNumber: invoiceNumber });
            
            if (transaction) {
                console.log('Transaction found for error:', {
                    invoiceNumber: transaction.invoiceNumber,
                    currentStatus: transaction.status,
                    userId: transaction.user
                });
                
                // Chỉ cập nhật nếu transaction chưa completed
                if (transaction.status !== 'completed') {
                    transaction.status = 'failed';
                    if (order_id) transaction.sepayOrderId = order_id;
                    await transaction.save();
                    console.log(`✅ Transaction ${invoiceNumber} marked as failed`);
                } else {
                    console.log(`⚠️ Transaction ${invoiceNumber} already completed, cannot mark as failed`);
                }
            } else {
                console.error('❌ Transaction not found for invoice:', invoiceNumber);
            }
        } else {
            // Nếu không có invoice_number, thử tìm transaction pending gần nhất
            console.log('⚠️ No invoice_number in error callback. Trying to find recent pending transaction...');
            
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentPendingTransactions = await Transaction.find({
                status: 'pending',
                createdAt: { $gte: fiveMinutesAgo }
            }).sort({ createdAt: -1 }).limit(1);
            
            if (recentPendingTransactions.length > 0) {
                const transaction = recentPendingTransactions[0];
                console.log('Found recent pending transaction:', {
                    invoiceNumber: transaction.invoiceNumber,
                    userId: transaction.user,
                    createdAt: transaction.createdAt
                });
                
                // Cập nhật status thành failed
                transaction.status = 'failed';
                if (order_id) transaction.sepayOrderId = order_id;
                transaction.ipnData = { source: 'error_callback_fallback', order_id, timestamp: new Date() };
                await transaction.save();
                
                console.log(`✅ Fallback: Transaction ${transaction.invoiceNumber} marked as failed`);
            } else {
                console.log('No recent pending transactions found to mark as failed.');
            }
        }

        res.redirect(`${FRONTEND_URL}/payment/error?order_id=${order_id || ''}&invoice_number=${invoiceNumber || ''}`);
    } catch (error) {
        console.error('❌ Error in error callback:', error);
        console.error('Error stack:', error.stack);
        res.redirect(`${FRONTEND_URL}/payment/error`);
    }
});

/**
 * GET/POST /api/payment/cancel
 * Callback khi người dùng hủy thanh toán
 */
router.all('/cancel', async (req, res) => {
    try {
        // Log tất cả thông tin từ request để debug
        console.log('=== CANCEL CALLBACK RECEIVED ===');
        console.log('Query params:', req.query);
        console.log('Query string:', req.url);
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', req.body);
        
        const { order_id, invoice_number, order_invoice_number, invoice, order } = req.query;
        
        // SePay có thể trả về invoice_number với tên khác nhau
        const invoiceNumber = invoice_number || order_invoice_number || invoice || order;
        
        console.log('Extracted invoice_number:', invoiceNumber);
        console.log('Extracted order_id:', order_id);
        
        // Cập nhật transaction status nếu có invoice_number
        if (invoiceNumber) {
            const transaction = await Transaction.findOne({ invoiceNumber: invoiceNumber });
            
            if (transaction) {
                console.log('Transaction found for cancel:', {
                    invoiceNumber: transaction.invoiceNumber,
                    currentStatus: transaction.status,
                    userId: transaction.user
                });
                
                // Chỉ cập nhật nếu transaction chưa completed
                if (transaction.status !== 'completed') {
                    transaction.status = 'cancelled';
                    if (order_id) transaction.sepayOrderId = order_id;
                    await transaction.save();
                    console.log(`✅ Transaction ${invoiceNumber} cancelled`);
                } else {
                    console.log(`⚠️ Transaction ${invoiceNumber} already completed, cannot cancel`);
                }
            } else {
                console.error('❌ Transaction not found for invoice:', invoiceNumber);
            }
        } else {
            // Nếu không có invoice_number, thử tìm transaction pending gần nhất
            // (trong vòng 5 phút) - có thể là transaction vừa bị hủy
            console.log('⚠️ No invoice_number in cancel callback. Trying to find recent pending transaction...');
            
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentPendingTransactions = await Transaction.find({
                status: 'pending',
                createdAt: { $gte: fiveMinutesAgo }
            }).sort({ createdAt: -1 }).limit(1);
            
            if (recentPendingTransactions.length > 0) {
                const transaction = recentPendingTransactions[0];
                console.log('Found recent pending transaction:', {
                    invoiceNumber: transaction.invoiceNumber,
                    userId: transaction.user,
                    createdAt: transaction.createdAt
                });
                
                // Cập nhật status thành cancelled
                transaction.status = 'cancelled';
                if (order_id) transaction.sepayOrderId = order_id;
                transaction.ipnData = { source: 'cancel_callback_fallback', order_id, timestamp: new Date() };
                await transaction.save();
                
                console.log(`✅ Fallback: Transaction ${transaction.invoiceNumber} cancelled`);
            } else {
                console.log('No recent pending transactions found to cancel.');
            }
        }

        res.redirect(`${FRONTEND_URL}/payment/cancel?order_id=${order_id || ''}&invoice_number=${invoiceNumber || ''}`);
    } catch (error) {
        console.error('❌ Error in cancel callback:', error);
        console.error('Error stack:', error.stack);
        res.redirect(`${FRONTEND_URL}/payment/cancel`);
    }
});

/**
 * GET /api/payment/check-transaction/:invoiceNumber
 * Kiểm tra trạng thái transaction và refresh credits nếu cần
 */
router.get('/check-transaction/:invoiceNumber', authMiddleware, async (req, res) => {
    try {
        const { invoiceNumber } = req.params;
        const transaction = await Transaction.findOne({ 
            invoiceNumber,
            user: req.user.id 
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const user = await User.findById(req.user.id);
        
        // Nếu transaction đã completed, kiểm tra xem credit đã được cộng chưa
        if (transaction.status === 'completed') {
            const expectedCredits = transaction.credits + transaction.bonusCredits;
            const currentCredits = user?.credits || 0;
            
            // Nếu credit chưa được cộng (có thể do IPN bị miss), cộng ngay
            // Kiểm tra bằng cách xem transaction có được tạo gần đây không
            const timeSinceCreation = Date.now() - new Date(transaction.createdAt).getTime();
            const fiveMinutes = 5 * 60 * 1000;
            
            // Nếu transaction completed nhưng credit có vẻ chưa được cộng
            // và transaction được tạo trong vòng 5 phút, thử cộng lại
            if (timeSinceCreation < fiveMinutes) {
                // Kiểm tra xem có dấu hiệu credit đã được cộng chưa
                // Nếu user có ít credit hơn expected, có thể chưa được cộng
                // Tuy nhiên, cách này không chính xác 100%, nên chỉ log để debug
                console.log(`Transaction completed. Expected credits: ${expectedCredits}, Current: ${currentCredits}`);
            }
            
            return res.json({
                status: 'completed',
                credits: currentCredits,
                transaction: {
                    invoiceNumber: transaction.invoiceNumber,
                    amount: transaction.amount,
                    credits: transaction.credits,
                    bonusCredits: transaction.bonusCredits,
                }
            });
        }

        // Nếu transaction vẫn pending, kiểm tra xem có nên cập nhật không
        // (fallback nếu IPN không đến)
        const timeSinceCreation = Date.now() - new Date(transaction.createdAt).getTime();
        const twoMinutes = 2 * 60 * 1000;
        
        if (transaction.status === 'pending' && timeSinceCreation > twoMinutes) {
            console.log(`⚠️ Transaction pending for ${Math.round(timeSinceCreation / 1000)}s. May need manual check.`);
        }

        res.json({
            status: transaction.status,
            credits: null,
        });
    } catch (error) {
        console.error('❌ Error checking transaction:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Không thể kiểm tra transaction' });
    }
});

/**
 * POST /api/payment/manual-update-credit/:invoiceNumber
 * Manually update credit nếu transaction đã completed nhưng credit chưa được cộng
 * (Fallback mechanism nếu IPN bị miss)
 */
router.post('/manual-update-credit/:invoiceNumber', authMiddleware, async (req, res) => {
    try {
        const { invoiceNumber } = req.params;
        const transaction = await Transaction.findOne({ 
            invoiceNumber,
            user: req.user.id 
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.status !== 'completed') {
            return res.status(400).json({ error: 'Transaction chưa completed. Không thể cập nhật credit.' });
        }

        // Kiểm tra xem credit đã được cộng chưa bằng cách kiểm tra user hiện tại
        const user = await User.findById(req.user.id);
        const totalCredits = transaction.credits + transaction.bonusCredits;
        
        console.log(`🔄 Manual credit update requested for: ${invoiceNumber}`);
        console.log(`Expected credits: ${totalCredits}, Current user credits: ${user?.credits || 0}`);

        // Cộng credit (sử dụng $inc để đảm bảo atomic)
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $inc: { credits: totalCredits } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(500).json({ error: 'Failed to update user credits' });
        }

        console.log(`✅ Manual credit update successful: ${user?.credits || 0} -> ${updatedUser.credits}`);

        res.json({
            success: true,
            message: 'Credit đã được cập nhật thành công',
            credits: updatedUser.credits,
            addedCredits: totalCredits,
        });
    } catch (error) {
        console.error('❌ Error in manual credit update:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Không thể cập nhật credit' });
    }
});

/**
 * GET /api/payment/transactions
 * Lấy lịch sử giao dịch của user
 */
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .select('-ipnData'); // Không trả về IPN data để giảm kích thước

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Không thể lấy lịch sử giao dịch' });
    }
});

export default router;
