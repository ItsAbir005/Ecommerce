"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const admin_middleware_1 = require("../../middleware/admin.middleware");
const rateLimit_middleware_1 = require("../../middleware/rateLimit.middleware");
const order_controller_1 = require("./order.controller");
const router = (0, express_1.Router)();
// All order routes require authentication
router.use(auth_middleware_1.authMiddleware);
// ── User routes ─────────────────────────────────────────────────────────────
// POST /api/orders — rate limited: 10 checkout attempts per minute per IP
router.post('/', rateLimit_middleware_1.checkoutRateLimiter, order_controller_1.createOrder);
router.get('/my', order_controller_1.getMyOrders);
router.get('/:id', order_controller_1.getOrderById);
router.put('/:id/cancel', order_controller_1.cancelOrder);
// ── Admin routes ─────────────────────────────────────────────────────────────
router.get('/', admin_middleware_1.adminMiddleware, order_controller_1.getAllOrders);
router.put('/:id/status', admin_middleware_1.adminMiddleware, order_controller_1.updateOrderStatus);
exports.default = router;
//# sourceMappingURL=order.routes.js.map