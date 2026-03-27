"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const admin_middleware_1 = require("../../middleware/admin.middleware");
const notification_controller_1 = require("./notification.controller");
const router = (0, express_1.Router)();
// Only Admins can access notifications
router.use(auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware);
router.get('/', notification_controller_1.getNotifications);
router.get('/unread', notification_controller_1.getUnreadNotifications);
router.put('/read-all', notification_controller_1.markAllAsRead);
router.put('/:id/read', notification_controller_1.markAsRead);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map