import { Router } from 'express';
import { registerDriver, loginDriver } from './driver.auth';
import { driverAuthMiddleware } from '../../middleware/driverAuth.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import {
    getMe, setStatus, updateLocation,
    getActiveDeliveryHandler, getHistoryHandler,
    getAllDriversHandler, blockDriverHandler,
} from './driver.controller';

const router = Router();

// ── Public ──────────────────────────────────────────────────────────────────
router.post('/register', registerDriver);
router.post('/login', loginDriver);

// ── Protected (driver JWT required) ─────────────────────────────────────────
router.use(driverAuthMiddleware as any);
router.get('/me', getMe);
router.put('/status', setStatus);
router.put('/location', updateLocation);
router.get('/delivery/active', getActiveDeliveryHandler);
router.get('/delivery/history', getHistoryHandler);

// ── Admin routes (customer JWT + admin role) ──────────────────────────────
router.get('/all', authMiddleware as any, adminMiddleware as any, getAllDriversHandler);
router.put('/:id/block', authMiddleware as any, adminMiddleware as any, blockDriverHandler);

export default router;
