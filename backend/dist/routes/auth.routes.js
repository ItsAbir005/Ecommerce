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
const router = (0, express_1.Router)();
router.post("/login", login_1.default);
router.post("/register", register_1.default);
router.get("/me", auth_middleware_1.authMiddleware, getMe_1.default);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map