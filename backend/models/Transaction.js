import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
    },
    packageId: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    credits: {
        type: Number,
        required: true,
    },
    bonusCredits: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending',
    },
    sepayOrderId: {
        type: String,
    },
    sepayTransactionId: {
        type: String,
    },
    paymentMethod: {
        type: String,
    },
    ipnData: {
        type: mongoose.Schema.Types.Mixed,
    },
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;


