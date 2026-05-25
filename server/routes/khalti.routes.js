
import express from 'express';
import { initializeKhaltiPayment, verifyKhaltiPayment } from '../controllers/khaltiController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/initiate', protect, initializeKhaltiPayment);
router.post('/verify', verifyKhaltiPayment);

export default router;