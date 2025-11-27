import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';
import { registerLimiter, loginLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerLimiter, validateRegister, async (req, res) => {
    const { email, password } = req.body;

    try {
        // Kiểm tra user đã tồn tại chưa
        let user = await User.findOne({ email });
        if (user) {
            // Không tiết lộ user có tồn tại hay không để tránh user enumeration
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Hash password trước khi tạo user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user với password đã hash
        user = new User({ 
            email, 
            password: hashedPassword 
        });
        
        await user.save();

        const payload = {
            user: { id: user.id }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { email: user.email, credits: user.credits, role: user.role } });
        });

    } catch (error) {
        console.error('Error during registration:', error.message);
        res.status(500).send('Server error');
    }
});


// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        
        // Luôn trả về cùng một message để tránh user enumeration
        // Dù user không tồn tại hay password sai, đều trả về "Invalid credentials"
        if (!user) {
            // Hash một password giả để tốn thời gian tương đương, tránh timing attack
            await bcrypt.compare(password, '$2a$10$dummyHashToPreventTimingAttack');
            return res.status(400).json({ error: 'Invalid email or password.' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const payload = {
            user: { id: user.id }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { email: user.email, credits: user.credits, role: user.role } });
        });

    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/user
// @desc    Get logged in user data
// @access  Private
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
        }

        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật mật khẩu
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('Error changing password:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authMiddleware, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Vui lòng nhập mật khẩu để xác nhận xóa tài khoản' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Mật khẩu không đúng' });
        }

        // Xóa user (MongoDB sẽ tự động xóa các documents liên quan nếu có cascade)
        await User.findByIdAndDelete(req.user.id);

        res.json({ message: 'Tài khoản đã được xóa thành công' });
    } catch (error) {
        console.error('Error deleting account:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;