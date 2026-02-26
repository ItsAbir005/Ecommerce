import { Router } from "express";
import login from "../modules/auth/login";
import register from "../modules/auth/register";
import getMe from "../modules/auth/getMe";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", authMiddleware, getMe);

export default router;
