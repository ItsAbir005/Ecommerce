"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const admin_middleware_1 = require("../../middleware/admin.middleware");
const category_controller_1 = require("./category.controller");
const router = (0, express_1.Router)();
// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/tree', category_controller_1.getCategoryTree); // GET /api/categories/tree
router.get('/:id/products', category_controller_1.getProductsByCategory); // GET /api/categories/:id/products
router.get('/', category_controller_1.getAllCategories); // GET /api/categories
// ── Admin routes ──────────────────────────────────────────────────────────────
router.post('/', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, category_controller_1.createCategory);
router.put('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, category_controller_1.updateCategory);
router.delete('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, category_controller_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=category.routes.js.map