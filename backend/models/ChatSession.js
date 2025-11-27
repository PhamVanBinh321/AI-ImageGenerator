import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sender: { type: String, enum: ['user', 'ai'], required: true },
  text: { type: String },
  isOptimizing: { type: Boolean, default: false },
  originalPrompt: { type: String },
  optimizedPrompt: { type: String },
  explanation: { type: String },
  imageConfig: {
    aspectRatio: { type: String },
    numberOfImages: { type: Number },
  },
  imageUrls: { type: [String], default: [] },
  imagePrompt: { type: String },
  imageStatus: { type: String, enum: ['loading', 'success', 'error'] },
  feedback: {
    type: { type: String, enum: ['like', 'dislike'], default: null },
    reported: { type: Boolean, default: false },
    reportedAt: { type: Date },
  },
}, { _id: false });


const chatSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        default: 'New Chat',
    },
    messages: [messageSchema],
}, { timestamps: true });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;