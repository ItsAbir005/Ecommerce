import { Router } from 'express';
import { initializePayment, webhook, refund } from './payment.controller';

const router = Router();

// Endpoint to initialize payment
// POST /api/payments/
router.post('/', initializePayment);

// Endpoint for Stripe webhooks (body must remain raw)
// POST /api/payments/webhook
router.post('/webhook', webhook);

// Endpoint to trigger a manual refund
// POST /api/payments/refund/:payment_id
router.post('/refund/:payment_id', refund);

export default router;
