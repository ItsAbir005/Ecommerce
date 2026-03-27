"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driver_auth_1 = require("./driver.auth");
const driverAuth_middleware_1 = require("../../middleware/driverAuth.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const admin_middleware_1 = require("../../middleware/admin.middleware");
const driver_controller_1 = require("./driver.controller");
const router = (0, express_1.Router)();
// ── Public ──────────────────────────────────────────────────────────────────
router.post('/register', driver_auth_1.registerDriver);
router.post('/login', driver_auth_1.loginDriver);
// ── Admin routes (customer JWT + admin role) ─────────────────────────────
// IMPORTANT: These MUST be before router.use(driverAuthMiddleware) or that
// middleware would intercept them and reject admin JWTs.
router.get('/all', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, driver_controller_1.getAllDriversHandler);
router.put('/:id/block', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, driver_controller_1.blockDriverHandler);
router.put('/:id/approve', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, driver_controller_1.approveDriverHandler);
// ── Protected (driver JWT required) ─────────────────────────────────────────
router.use(driverAuth_middleware_1.driverAuthMiddleware);
router.get('/me', driver_controller_1.getMe);
router.put('/status', driver_controller_1.setStatus);
router.put('/location', driver_controller_1.updateLocation);
router.get('/delivery/active', driver_controller_1.getActiveDeliveryHandler);
router.get('/delivery/history', driver_controller_1.getHistoryHandler);
exports.default = router;
//# sourceMappingURL=driver.routes.js.map