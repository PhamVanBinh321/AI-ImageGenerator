import { SePayPgClient } from 'sepay-pg-node';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import dotenv from 'dotenv';

dotenv.config();

const SEPAY_MERCHANT_ID = process.env.SEPAY_MERCHANT_ID;
const SEPAY_SECRET_KEY = process.env.SEPAY_SECRET_KEY;
const SEPAY_ENV = process.env.SEPAY_ENV || 'sandbox';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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

const CREDIT_PACKAGES = {
    'package-1': { price: 10000, credits: 10, bonus: 0 },
    'package-2': { price: 30000, credits: 35, bonus: 5 },
    'package-3': { price: 100000, credits: 130, bonus: 30 },
};

const generateOrderId = () => {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const generateInvoiceNumber = () => {
    return `INV-${Date.now()}`;
};

export const createPayment = async (req, res) => {
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

        if (!sepayClient.checkout) {
            throw new Error('SePay SDK không có method checkout. Vui lòng kiểm tra lại SDK version và cấu hình.');
        }

        let checkoutURL;
        try {
            checkoutURL = sepayClient.checkout.initCheckoutUrl();
        } catch (error) {
            console.error('Error getting checkout URL:', error);
            throw new Error(`Không thể lấy checkout URL: ${error.message}`);
        }

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
        } catch (error) {
            console.error('Error creating form fields:', error);
            throw new Error(`Không thể tạo form fields: ${error.message}`);
        }

        if (!checkoutURL) {
            throw new Error('Checkout URL là null hoặc undefined');
        }

        if (!checkoutFormfields || typeof checkoutFormfields !== 'object') {
            throw new Error('Form fields không hợp lệ');
        }

        const responseData = {
            checkoutUrl: checkoutURL,
            formFields: checkoutFormfields,
            orderId: orderId,
            invoiceNumber: invoiceNumber,
            transactionId: transaction._id.toString(),
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({
            error: 'Đã có lỗi xảy ra khi tạo thanh toán',
            details: error.message
        });
    }
};

export const handleIPN = async (req, res) => {
    try {
        console.log('=== IPN RECEIVED ===');
        const data = req.body;

        let invoiceNumber = null;
        let orderData = null;
        let transactionData = null;

        if (data.order && data.order.order_invoice_number) {
            invoiceNumber = data.order.order_invoice_number;
            orderData = data.order;
            transactionData = data.transaction;
        }
        else if (data.order_invoice_number) {
            invoiceNumber = data.order_invoice_number;
            orderData = data.order || data;
            transactionData = data.transaction || data;
        }
        else if (data.invoice_number) {
            invoiceNumber = data.invoice_number;
            orderData = data.order || data;
            transactionData = data.transaction || data;
        }

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
                return res.status(404).json({ error: 'Transaction not found' });
            }

            if (transaction.status === 'completed') {
                return res.status(200).json({ success: true, message: 'Already processed' });
            }

            transaction.status = 'completed';
            if (orderData?.id) transaction.sepayOrderId = orderData.id;
            if (transactionData?.transaction_id) transaction.sepayTransactionId = transactionData.transaction_id;
            if (transactionData?.payment_method) transaction.paymentMethod = transactionData.payment_method;
            transaction.ipnData = data;
            await transaction.save();

            const totalCredits = transaction.credits + transaction.bonusCredits;

            const updatedUser = await User.findByIdAndUpdate(
                transaction.user,
                { $inc: { credits: totalCredits } },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(500).json({ error: 'Failed to update user credits' });
            }

            console.log(`✅ Payment completed: ${invoiceNumber}`);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Error processing IPN:', error);
        res.status(200).json({ success: false, error: error.message });
    }
};

export const handleSuccess = async (req, res) => {
    try {
        console.log('=== SUCCESS CALLBACK RECEIVED ===');

        const { order_id, invoice_number, order_invoice_number, invoice, order } = req.query;

        const invoiceNumber = invoice_number || order_invoice_number || invoice || order;

        if (invoiceNumber) {
            const transaction = await Transaction.findOne({ invoiceNumber: invoiceNumber });

            if (transaction) {
                if (transaction.status === 'pending') {
                    const timeSinceCreation = Date.now() - new Date(transaction.createdAt).getTime();
                    const thirtySeconds = 30 * 1000;

                    if (timeSinceCreation > thirtySeconds) {
                        transaction.status = 'completed';
                        if (order_id) transaction.sepayOrderId = order_id;
                        transaction.ipnData = { source: 'success_callback_fallback', order_id };
                        await transaction.save();

                        const totalCredits = transaction.credits + transaction.bonusCredits;

                        await User.findByIdAndUpdate(
                            transaction.user,
                            { $inc: { credits: totalCredits } },
                            { new: true }
                        );
                    }
                }
            }
        } else {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentPendingTransactions = await Transaction.find({
                status: 'pending',
                createdAt: { $gte: fiveMinutesAgo }
            }).sort({ createdAt: -1 }).limit(1);

            if (recentPendingTransactions.length > 0) {
                const transaction = recentPendingTransactions[0];
                const timeSinceCreation = Date.now() - new Date(transaction.createdAt).getTime();
                const thirtySeconds = 30 * 1000;

                if (timeSinceCreation > thirtySeconds) {
                    transaction.status = 'completed';
                    if (order_id) transaction.sepayOrderId = order_id;
                    transaction.ipnData = { source: 'success_callback_fallback_no_invoice', order_id, timestamp: new Date() };
                    await transaction.save();

                    const totalCredits = transaction.credits + transaction.bonusCredits;

                    await User.findByIdAndUpdate(
                        transaction.user,
                        { $inc: { credits: totalCredits } },
                        { new: true }
                    );
                }
            }
        }

        res.redirect(`${FRONTEND_URL}/payment/success?order_id=${order_id || ''}&invoice_number=${invoiceNumber || ''}`);
    } catch (error) {
        console.error('❌ Error in success callback:', error);
        res.redirect(`${FRONTEND_URL}/payment/success`);
    }
};

export const handleError = async (req, res) => {
    try {
        console.log('=== ERROR CALLBACK RECEIVED ===');

        const { order_id, invoice_number, order_invoice_number, invoice, order } = req.query;
        const invoiceNumber = invoice_number || order_invoice_number || invoice || order;

        if (invoiceNumber) {
            const transaction = await Transaction.findOne({ invoiceNumber: invoiceNumber });

            if (transaction) {
                if (transaction.status !== 'completed') {
                    transaction.status = 'failed';
                    if (order_id) transaction.sepayOrderId = order_id;
                    await transaction.save();
                }
            }
        } else {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentPendingTransactions = await Transaction.find({
                status: 'pending',
                createdAt: { $gte: fiveMinutesAgo }
            }).sort({ createdAt: -1 }).limit(1);

            if (recentPendingTransactions.length > 0) {
                const transaction = recentPendingTransactions[0];
                transaction.status = 'failed';
                if (order_id) transaction.sepayOrderId = order_id;
                transaction.ipnData = { source: 'error_callback_fallback', order_id, timestamp: new Date() };
                await transaction.save();
            }
        }

        res.redirect(`${FRONTEND_URL}/payment/error?order_id=${order_id || ''}&invoice_number=${invoiceNumber || ''}`);
    } catch (error) {
        console.error('❌ Error in error callback:', error);
        res.redirect(`${FRONTEND_URL}/payment/error`);
    }
};

export const handleCancel = async (req, res) => {
    try {
        console.log('=== CANCEL CALLBACK RECEIVED ===');

        const { order_id, invoice_number, order_invoice_number, invoice, order } = req.query;
        const invoiceNumber = invoice_number || order_invoice_number || invoice || order;

        if (invoiceNumber) {
            const transaction = await Transaction.findOne({ invoiceNumber: invoiceNumber });

            if (transaction) {
                if (transaction.status !== 'completed') {
                    transaction.status = 'cancelled';
                    if (order_id) transaction.sepayOrderId = order_id;
                    await transaction.save();
                }
            }
        } else {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentPendingTransactions = await Transaction.find({
                status: 'pending',
                createdAt: { $gte: fiveMinutesAgo }
            }).sort({ createdAt: -1 }).limit(1);

            if (recentPendingTransactions.length > 0) {
                const transaction = recentPendingTransactions[0];
                transaction.status = 'cancelled';
                if (order_id) transaction.sepayOrderId = order_id;
                transaction.ipnData = { source: 'cancel_callback_fallback', order_id, timestamp: new Date() };
                await transaction.save();
            }
        }

        res.redirect(`${FRONTEND_URL}/payment/cancel?order_id=${order_id || ''}&invoice_number=${invoiceNumber || ''}`);
    } catch (error) {
        console.error('❌ Error in cancel callback:', error);
        res.redirect(`${FRONTEND_URL}/payment/cancel`);
    }
};

export const checkTransaction = async (req, res) => {
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

        if (transaction.status === 'completed') {
            return res.json({
                status: 'completed',
                credits: user?.credits || 0,
                transaction: {
                    invoiceNumber: transaction.invoiceNumber,
                    amount: transaction.amount,
                    credits: transaction.credits,
                    bonusCredits: transaction.bonusCredits,
                }
            });
        }

        res.json({
            status: transaction.status,
            credits: null,
        });
    } catch (error) {
        console.error('❌ Error checking transaction:', error);
        res.status(500).json({ error: 'Không thể kiểm tra transaction' });
    }
};

export const manualUpdateCredit = async (req, res) => {
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

        const totalCredits = transaction.credits + transaction.bonusCredits;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $inc: { credits: totalCredits } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(500).json({ error: 'Failed to update user credits' });
        }

        res.json({
            success: true,
            message: 'Credit đã được cập nhật thành công',
            credits: updatedUser.credits,
            addedCredits: totalCredits,
        });
    } catch (error) {
        console.error('❌ Error in manual credit update:', error);
        res.status(500).json({ error: 'Không thể cập nhật credit' });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .select('-ipnData');

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Không thể lấy lịch sử giao dịch' });
    }
};
