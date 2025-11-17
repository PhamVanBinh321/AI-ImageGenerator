import express from 'express';
import ChatSession from '../models/ChatSession.js';

const router = express.Router();

// @route   GET api/sessions
// @desc    Get all chat sessions for a user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const sessions = await ChatSession.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/sessions/new
// @desc    Create a new chat session
// @access  Private
router.post('/new', async (req, res) => {
    try {
        const newSession = new ChatSession({
            user: req.user.id,
            title: 'Cuộc trò chuyện mới',
            messages: [
                {
                    id: 'init',
                    sender: 'ai',
                    text: 'Chào bạn! Hãy cho tôi biết ý tưởng về bức ảnh bạn muốn tạo. Bạn có thể yêu cầu nhiều ảnh hoặc tỷ lệ cụ thể (vd: "một chú mèo phi hành gia, 16:9, 2 phiên bản").',
                },
            ],
            createdAt: Date.now(),
        });

        await newSession.save();
        res.status(201).json(newSession);

    } catch (error) {
        console.error('Error creating new session:', error.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/sessions/:id
// @desc    Delete a chat session
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const session = await ChatSession.findOne({ _id: req.params.id, user: req.user.id });
        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        await ChatSession.deleteOne({ _id: req.params.id });

        res.json({ msg: 'Session removed' });

    } catch (error) {
        console.error('Error deleting session:', error.message);
        // Handle CastError for invalid ObjectId
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Session not found' });
        }
        res.status(500).send('Server Error');
    }
});


export default router;