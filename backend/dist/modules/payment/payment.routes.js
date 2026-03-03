"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const router = (0, express_1.Router)();
// Endpoint to initialize payment
// POST /api/payments/
router.post('/', payment_controller_1.initializePayment);
// Endpoint for Stripe webhooks (body must remain raw)
// POST /api/payments/webhook
router.post('/webhook', payment_controller_1.webhook);
// Endpoint to trigger a manual refund
// POST /api/payments/refund/:payment_id
router.post('/refund/:payment_id', payment_controller_1.refund);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map