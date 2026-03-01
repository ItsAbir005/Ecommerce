import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as CartService from './cart.service';

// ── Helper ────────────────────────────────────────────────────────────────────
const userId = (req: AuthRequest) => (req.user as any)._id.toString();

// ── GET /api/cart ─────────────────────────────────────────────────────────────
export const getCart = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const cart = await CartService.getCart(userId(req));
        return res.json(cart);
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

// ── POST /api/cart ────────────────────────────────────────────────────────────
export const addItem = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { productId, quantity = 1, variantId } = req.body;
        if (!productId) return res.status(400).json({ message: 'productId is required' });
        const cart = await CartService.addItem(userId(req), productId, Number(quantity), variantId);
        return res.status(201).json(cart);
    } catch (err: any) {
        const status = err.message.includes('not found') ? 404
            : err.message.includes('stock') || err.message.includes('available') ? 409
                : 500;
        return res.status(status).json({ message: err.message });
    }
};

// ── PUT /api/cart/:itemId ─────────────────────────────────────────────────────
export const updateItem = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { quantity, variantId } = req.body;
        const cart = await CartService.updateItem(
            userId(req),
            req.params.itemId as string,
            quantity !== undefined ? Number(quantity) : undefined,
            variantId
        );
        return res.json(cart);
    } catch (err: any) {
        const status = err.message.includes('not found') ? 404
            : err.message.includes('stock') || err.message.includes('available') ? 409
                : 500;
        return res.status(status).json({ message: err.message });
    }
};

// ── DELETE /api/cart/:itemId ──────────────────────────────────────────────────
export const removeItem = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const cart = await CartService.removeItem(userId(req), req.params.itemId as string);
        return res.json(cart);
    } catch (err: any) {
        return res.status(err.message.includes('not found') ? 404 : 500).json({ message: err.message });
    }
};

// ── DELETE /api/cart ──────────────────────────────────────────────────────────
export const clearCart = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const result = await CartService.clearCart(userId(req));
        return res.json(result);
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

// ── GET /api/cart/validate ────────────────────────────────────────────────────
export const validateCart = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const result = await CartService.validateCart(userId(req));
        return res.json(result);
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

// ── GET /api/cart/summary ─────────────────────────────────────────────────────
export const getCartSummary = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const summary = await CartService.getCartSummary(userId(req));
        return res.json(summary);
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};
