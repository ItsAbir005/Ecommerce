import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { checkoutRateLimiter } from '../../middleware/rateLimit.middleware';
import {
    createOrder, getMyOrders, getOrderById,
    cancelOrder, getAllOrders, updateOrderStatus,
} from './order.controller';

const router = Router();

// All order routes require authentication
router.use(authMiddleware as any);

// ── User routes ─────────────────────────────────────────────────────────────
// POST /api/orders — rate limited: 10 checkout attempts per minute per IP
router.post('/', checkoutRateLimiter, createOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

// ── Admin routes ─────────────────────────────────────────────────────────────
router.get('/', adminMiddleware as any, getAllOrders);
router.put('/:id/status', adminMiddleware as any, updateOrderStatus);

export default router;
