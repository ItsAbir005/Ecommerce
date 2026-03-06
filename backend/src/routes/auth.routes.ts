import { Router } from "express";
import login from "../modules/auth/login";
import register from "../modules/auth/register";
import getMe from "../modules/auth/getMe";
import { authMiddleware } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rateLimit.middleware";
import { adminRegister, adminLogin } from "../modules/auth/admin.auth";

const router = Router();

// Rate limited: 5 attempts per minute per IP
router.post("/login", authRateLimiter, login);
router.post("/register", authRateLimiter, register);
router.get("/me", authMiddleware, getMe);

// ── Admin auth routes ────────────────────────────────────────────────────────
// POST /api/auth/admin/register  → requires ADMIN_SECRET_KEY in body
// POST /api/auth/admin/login     → checks role==='admin'
router.post("/admin/register", adminRegister);
router.post("/admin/login", authRateLimiter, adminLogin);

export default router;
