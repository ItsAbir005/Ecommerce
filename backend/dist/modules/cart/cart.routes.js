"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const cart_controller_1 = require("./cart.controller");
const router = (0, express_1.Router)();
// All cart routes require authentication
router.use(auth_middleware_1.authMiddleware);
// ─── Cart Routes ──────────────────────────────────────────────────────────────
// NOTE: /validate and /summary must come BEFORE /:itemId to avoid being caught as a param
router.get('/validate', cart_controller_1.validateCart); // GET  /api/cart/validate
router.get('/summary', cart_controller_1.getCartSummary); // GET  /api/cart/summary
router.get('/', cart_controller_1.getCart); // GET  /api/cart
router.post('/', cart_controller_1.addItem); // POST /api/cart
router.put('/:itemId', cart_controller_1.updateItem); // PUT  /api/cart/:itemId
router.delete('/:itemId', cart_controller_1.removeItem); // DELETE /api/cart/:itemId
router.delete('/', cart_controller_1.clearCart); // DELETE /api/cart
exports.default = router;
//# sourceMappingURL=cart.routes.js.map