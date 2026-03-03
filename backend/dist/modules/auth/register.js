"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("../../models/User");
const register = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Name is required" });
    }
    const existingUser = await User_1.User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const newUser = await User_1.User.create({ name, email, password: hashedPassword });
    return res.status(201).json({ message: "User registered successfully" });
};
exports.default = register;
//# sourceMappingURL=register.js.map