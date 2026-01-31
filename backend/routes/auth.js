import express from 'express';
import { register, login, getUser, changePassword, deleteAccount } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';
import { registerLimiter, loginLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerLimiter, validateRegister, register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginLimiter, validateLogin, login);

// @route   GET api/auth/user
// @desc    Get logged in user data
// @access  Private
router.get('/user', authMiddleware, getUser);

// @route   PUT api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authMiddleware, changePassword);

// @route   DELETE api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authMiddleware, deleteAccount);

export default router;