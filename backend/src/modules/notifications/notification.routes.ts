import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import {
    getNotifications,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead,
} from './notification.controller';

const router = Router();

// Only Admins can access notifications
router.use(authMiddleware as any, adminMiddleware as any);

router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
