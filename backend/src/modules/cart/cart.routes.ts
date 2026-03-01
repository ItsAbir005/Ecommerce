import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
    getCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    validateCart,
    getCartSummary,
} from './cart.controller';

const router = Router();

// All cart routes require authentication
router.use(authMiddleware as any);

// ─── Cart Routes ──────────────────────────────────────────────────────────────
// NOTE: /validate and /summary must come BEFORE /:itemId to avoid being caught as a param

router.get('/validate', validateCart);      // GET  /api/cart/validate
router.get('/summary', getCartSummary);    // GET  /api/cart/summary
router.get('/', getCart);           // GET  /api/cart

router.post('/', addItem);        // POST /api/cart
router.put('/:itemId', updateItem);     // PUT  /api/cart/:itemId
router.delete('/:itemId', removeItem);     // DELETE /api/cart/:itemId
router.delete('/', clearCart);      // DELETE /api/cart

export default router;
