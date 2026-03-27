"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = exports.adminRegister = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../../models/User");
/**
 * POST /api/auth/admin/register
 *
 * Creates an admin account.
 * Protected by ADMIN_SECRET_KEY env variable — only someone who has this
 * key (the developer/owner) can create an admin account.
 *
 * This prevents random users from registering as admin.
 */
const adminRegister = async (req, res) => {
    const { name, email, password, adminSecret } = req.body;
    // 1. Validate secret key
    const expectedSecret = process.env.ADMIN_SECRET_KEY;
    if (!expectedSecret) {
        return res.status(500).json({ message: "ADMIN_SECRET_KEY not configured on server" });
    }
    if (adminSecret !== expectedSecret) {
        return res.status(403).json({ message: "Invalid admin secret key" });
    }
    // 2. Validate fields
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: "Admin password must be at least 8 characters" });
    }
    // 3. Check duplicate
    const exists = await User_1.User.findOne({ email });
    if (exists)
        return res.status(409).json({ message: "Email already registered" });
    // 4. Create admin
    const hashedPassword = await bcrypt_1.default.hash(password, 12);
    const admin = await User_1.User.create({ name, email, password: hashedPassword, role: "admin" });
    // 5. Return token so they can login immediately
    const token = jsonwebtoken_1.default.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({
        message: "Admin account created successfully",
        token,
        admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
};
exports.adminRegister = adminRegister;
/**
 * POST /api/auth/admin/login
 *
 * Admin login — same User document, just checks role === 'admin'.
 * Returns a JWT with role: 'admin' for frontend to store separately.
 */
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: "Email and password required" });
    const admin = await User_1.User.findOne({ email, role: "admin" });
    if (!admin)
        return res.status(401).json({ message: "Invalid admin credentials" });
    if (admin.isBlocked)
        return res.status(403).json({ message: "Admin account is blocked" });
    const valid = await bcrypt_1.default.compare(password, admin.password);
    if (!valid)
        return res.status(401).json({ message: "Invalid admin credentials" });
    const token = jsonwebtoken_1.default.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({
        token,
        admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
};
exports.adminLogin = adminLogin;
//# sourceMappingURL=admin.auth.js.map