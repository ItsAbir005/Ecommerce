"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const admin_middleware_1 = require("../../middleware/admin.middleware");
const order_controller_1 = require("./order.controller");
const router = (0, express_1.Router)();
// All order routes require authentication
router.use(auth_middleware_1.authMiddleware);
// ── User routes ─────────────────────────────────────────────────────────────
router.post('/', order_controller_1.createOrder); // POST   /api/orders
router.get('/my', order_controller_1.getMyOrders); // GET    /api/orders/my
router.get('/:id', order_controller_1.getOrderById); // GET    /api/orders/:id
router.put('/:id/cancel', order_controller_1.cancelOrder); // PUT    /api/orders/:id/cancel
// ── Admin routes ─────────────────────────────────────────────────────────────
router.get('/', admin_middleware_1.adminMiddleware, order_controller_1.getAllOrders); // GET  /api/orders
router.put('/:id/status', admin_middleware_1.adminMiddleware, order_controller_1.updateOrderStatus); // PUT  /api/orders/:id/status
exports.default = router;
//# sourceMappingURL=order.routes.js.map