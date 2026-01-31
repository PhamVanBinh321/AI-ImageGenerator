import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import paymentRoutes from './routes/payment.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import { authMiddleware } from './middleware/authMiddleware.js';

dotenv.config();

// Kết nối đến MongoDB
connectDB();

const app = express();
const port = process.env.PORT || 3001;

// --- Middlewares ---
// Helmet để bảo vệ HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- API Routes ---

app.get('/', (req, res) => {
    res.send('AI Image Generator Backend is running!');
});

// Auth routes
app.use('/api/auth', authRoutes);

// AI Routes
app.use('/api', aiRoutes);

// Session routes
app.use('/api/sessions', authMiddleware, sessionRoutes);

// Payment routes
app.use('/api/payment', paymentRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});