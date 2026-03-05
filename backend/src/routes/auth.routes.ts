import { Router } from "express";
import login from "../modules/auth/login";
import register from "../modules/auth/register";
import getMe from "../modules/auth/getMe";
import { authMiddleware } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Rate limited: 5 attempts per minute per IP
router.post("/login", authRateLimiter, login);
router.post("/register", authRateLimiter, register);
router.get("/me", authMiddleware, getMe);

export default router;
