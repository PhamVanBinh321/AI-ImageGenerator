import express from 'express';
import { getSessions, createSession, deleteSession, updateFeedback, reportMessage } from '../controllers/sessionController.js';

const router = express.Router();

// @route   GET api/sessions
// @desc    Get all chat sessions for a user
// @access  Private
router.get('/', getSessions);

// @route   POST api/sessions/new
// @desc    Create a new chat session
// @access  Private
router.post('/new', createSession);

// @route   DELETE api/sessions/:id
// @desc    Delete a chat session
// @access  Private
router.delete('/:id', deleteSession);

// @route   POST api/sessions/:sessionId/messages/:messageId/feedback
// @desc    Update feedback for a message (like/dislike)
// @access  Private
router.post('/:sessionId/messages/:messageId/feedback', updateFeedback);

// @route   POST api/sessions/:sessionId/messages/:messageId/report
// @desc    Report a message
// @access  Private
router.post('/:sessionId/messages/:messageId/report', reportMessage);

export default router;