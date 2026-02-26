import { Router } from "express";
import login from "../modules/auth/login";
import register from "../modules/auth/register";
const router = Router();
router.post("/login", login);
router.post("/register", register);
export default router;
