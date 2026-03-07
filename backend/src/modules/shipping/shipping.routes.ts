import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { driverAuthMiddleware } from '../../middleware/driverAuth.middleware';
import { getTracking, updateStatus, confirmDeliveryHandler, acceptDeliveryHandler, rejectDeliveryHandler } from './shipping.controller';

const router = Router();

// Customer: GET /api/shipping/order/:orderId  (requires customer JWT)
router.get('/order/:orderId', authMiddleware as any, getTracking);

// Driver: PUT /api/shipping/:id/status  (requires driver JWT)
router.put('/:id/status', driverAuthMiddleware as any, updateStatus);

// Driver: POST /api/shipping/:id/accept  (requires driver JWT)
router.post('/:id/accept', driverAuthMiddleware as any, acceptDeliveryHandler);

// Driver: POST /api/shipping/:id/reject  (requires driver JWT)
router.post('/:id/reject', driverAuthMiddleware as any, rejectDeliveryHandler);

// Driver: POST /api/shipping/:id/confirm-delivery  (requires driver JWT)
router.post('/:id/confirm-delivery', driverAuthMiddleware as any, confirmDeliveryHandler);

export default router;
