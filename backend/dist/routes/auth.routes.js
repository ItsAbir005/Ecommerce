"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const login_1 = __importDefault(require("../modules/auth/login"));
const register_1 = __importDefault(require("../modules/auth/register"));
const getMe_1 = __importDefault(require("../modules/auth/getMe"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const admin_auth_1 = require("../modules/auth/admin.auth");
const router = (0, express_1.Router)();
// Rate limited: 5 attempts per minute per IP
router.post("/login", rateLimit_middleware_1.authRateLimiter, login_1.default);
router.post("/register", rateLimit_middleware_1.authRateLimiter, register_1.default);
router.get("/me", auth_middleware_1.authMiddleware, getMe_1.default);
// ── Admin auth routes ────────────────────────────────────────────────────────
// POST /api/auth/admin/register  → requires ADMIN_SECRET_KEY in body
// POST /api/auth/admin/login     → checks role==='admin'
router.post("/admin/register", admin_auth_1.adminRegister);
router.post("/admin/login", rateLimit_middleware_1.authRateLimiter, admin_auth_1.adminLogin);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map