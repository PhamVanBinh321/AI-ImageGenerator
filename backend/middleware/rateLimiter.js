import rateLimit from 'express-rate-limit';

// Rate limiter cho đăng ký - giới hạn 5 lần/15 phút
export const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5, // tối đa 5 requests
    message: {
        error: 'Too many registration attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter cho đăng nhập - giới hạn 10 lần/15 phút
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10, // tối đa 10 requests
    message: {
        error: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter chung cho auth routes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 20, // tối đa 20 requests
    message: {
        error: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});










