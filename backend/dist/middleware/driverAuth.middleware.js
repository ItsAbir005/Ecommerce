"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Driver_1 = require("../models/Driver");
/**
 * Driver-specific JWT middleware.
 * Separate from customer authMiddleware — verifies role === 'driver'.
 */
const driverAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No driver token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'driver') {
            return res.status(403).json({ message: 'Access denied: not a driver account' });
        }
        const driver = await Driver_1.Driver.findById(decoded.id).select('-password');
        if (!driver) {
            return res.status(401).json({ message: 'Driver not found' });
        }
        if (driver.isBlocked) {
            return res.status(403).json({ message: 'Driver account is blocked' });
        }
        req.driver = driver;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid driver token', error: err.message });
    }
};
exports.driverAuthMiddleware = driverAuthMiddleware;
//# sourceMappingURL=driverAuth.middleware.js.map