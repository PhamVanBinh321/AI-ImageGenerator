import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const adminMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token is not valid' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Lấy user từ database để kiểm tra role
        const user = await User.findById(decoded.user.id);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        req.user = decoded.user;
        req.user.role = user.role; // Thêm role vào req.user
        next();
    } catch (err) {
        console.error('Admin middleware error:', err);
        res.status(401).json({ error: 'Token is not valid' });
    }
};






