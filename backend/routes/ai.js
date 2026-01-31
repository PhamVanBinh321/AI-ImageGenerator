import express from 'express';
import { generateTitle, optimizePrompt, generateImage } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/generate-title', generateTitle);
router.post('/optimize-prompt', optimizePrompt);
router.post('/generate-image', generateImage);

export default router;
