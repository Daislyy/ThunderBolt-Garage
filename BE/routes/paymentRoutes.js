import express from 'express';
import { paymentController } from '../controllers/paymentController.js';

const router = express.Router();

router.get('/client-key', paymentController.getClientKey);
router.post('/snap-token', paymentController.createSnapToken);
router.post('/cash', paymentController.recordCashPayment);
router.post('/webhook', paymentController.handleWebhook);

export default router;
