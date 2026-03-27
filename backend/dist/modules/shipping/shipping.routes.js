"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const driverAuth_middleware_1 = require("../../middleware/driverAuth.middleware");
const shipping_controller_1 = require("./shipping.controller");
const router = (0, express_1.Router)();
// Customer: GET /api/shipping/order/:orderId  (requires customer JWT)
router.get('/order/:orderId', auth_middleware_1.authMiddleware, shipping_controller_1.getTracking);
// Driver: PUT /api/shipping/:id/status  (requires driver JWT)
router.put('/:id/status', driverAuth_middleware_1.driverAuthMiddleware, shipping_controller_1.updateStatus);
// Driver: POST /api/shipping/:id/accept  (requires driver JWT)
router.post('/:id/accept', driverAuth_middleware_1.driverAuthMiddleware, shipping_controller_1.acceptDeliveryHandler);
// Driver: POST /api/shipping/:id/reject  (requires driver JWT)
router.post('/:id/reject', driverAuth_middleware_1.driverAuthMiddleware, shipping_controller_1.rejectDeliveryHandler);
// Driver: POST /api/shipping/:id/confirm-delivery  (requires driver JWT)
router.post('/:id/confirm-delivery', driverAuth_middleware_1.driverAuthMiddleware, shipping_controller_1.confirmDeliveryHandler);
exports.default = router;
//# sourceMappingURL=shipping.routes.js.map