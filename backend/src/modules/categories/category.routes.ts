import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import {
    getAllCategories, getCategoryTree, getProductsByCategory,
    createCategory, updateCategory, deleteCategory,
} from './category.controller';

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/tree', getCategoryTree);           // GET /api/categories/tree
router.get('/:id/products', getProductsByCategory);    // GET /api/categories/:id/products
router.get('/', getAllCategories);          // GET /api/categories

// ── Admin routes ──────────────────────────────────────────────────────────────
router.post('/', authMiddleware as any, adminMiddleware as any, createCategory);
router.put('/:id', authMiddleware as any, adminMiddleware as any, updateCategory);
router.delete('/:id', authMiddleware as any, adminMiddleware as any, deleteCategory);

export default router;
