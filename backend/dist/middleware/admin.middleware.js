"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    }
    else {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=admin.middleware.js.map