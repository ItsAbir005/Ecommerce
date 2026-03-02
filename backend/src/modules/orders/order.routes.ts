import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import {
    createOrder, getMyOrders, getOrderById,
    cancelOrder, getAllOrders, updateOrderStatus,
} from './order.controller';

const router = Router();

// All order routes require authentication
router.use(authMiddleware as any);

// ── User routes ─────────────────────────────────────────────────────────────
router.post('/', createOrder);       // POST   /api/orders
router.get('/my', getMyOrders);       // GET    /api/orders/my
router.get('/:id', getOrderById);      // GET    /api/orders/:id
router.put('/:id/cancel', cancelOrder);       // PUT    /api/orders/:id/cancel

// ── Admin routes ─────────────────────────────────────────────────────────────
router.get('/', adminMiddleware as any, getAllOrders);           // GET  /api/orders
router.put('/:id/status', adminMiddleware as any, updateOrderStatus);     // PUT  /api/orders/:id/status

export default router;
