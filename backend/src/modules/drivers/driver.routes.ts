import { Router } from 'express';
import { registerDriver, loginDriver } from './driver.auth';
import { driverAuthMiddleware } from '../../middleware/driverAuth.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import {
    getMe, setStatus, updateLocation,
    getActiveDeliveryHandler, getHistoryHandler,
    getAllDriversHandler, blockDriverHandler,
    approveDriverHandler,
} from './driver.controller';

const router = Router();

// ── Public ──────────────────────────────────────────────────────────────────
router.post('/register', registerDriver);
router.post('/login', loginDriver);

// ── Admin routes (customer JWT + admin role) ─────────────────────────────
// IMPORTANT: These MUST be before router.use(driverAuthMiddleware) or that
// middleware would intercept them and reject admin JWTs.
router.get('/all', authMiddleware as any, adminMiddleware as any, getAllDriversHandler);
router.put('/:id/block', authMiddleware as any, adminMiddleware as any, blockDriverHandler);
router.put('/:id/approve', authMiddleware as any, adminMiddleware as any, approveDriverHandler);

// ── Protected (driver JWT required) ─────────────────────────────────────────
router.use(driverAuthMiddleware as any);
router.get('/me', getMe);
router.put('/status', setStatus);
router.put('/location', updateLocation);
router.get('/delivery/active', getActiveDeliveryHandler);
router.get('/delivery/history', getHistoryHandler);

export default router;
