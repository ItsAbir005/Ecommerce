"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCartSummary = exports.validateCart = exports.clearCart = exports.removeItem = exports.updateItem = exports.addItem = exports.getCart = void 0;
const CartService = __importStar(require("./cart.service"));
// ── Helper ────────────────────────────────────────────────────────────────────
const userId = (req) => req.user._id.toString();
// ── GET /api/cart ─────────────────────────────────────────────────────────────
const getCart = async (req, res) => {
    try {
        const cart = await CartService.getCart(userId(req));
        return res.json(cart);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
exports.getCart = getCart;
// ── POST /api/cart ────────────────────────────────────────────────────────────
const addItem = async (req, res) => {
    try {
        const { productId, quantity = 1, variantId } = req.body;
        if (!productId)
            return res.status(400).json({ message: 'productId is required' });
        const cart = await CartService.addItem(userId(req), productId, Number(quantity), variantId);
        return res.status(201).json(cart);
    }
    catch (err) {
        const status = err.message.includes('not found') ? 404
            : err.message.includes('stock') || err.message.includes('available') ? 409
                : 500;
        return res.status(status).json({ message: err.message });
    }
};
exports.addItem = addItem;
// ── PUT /api/cart/:itemId ─────────────────────────────────────────────────────
const updateItem = async (req, res) => {
    try {
        const { quantity, variantId } = req.body;
        const cart = await CartService.updateItem(userId(req), req.params.itemId, quantity !== undefined ? Number(quantity) : undefined, variantId);
        return res.json(cart);
    }
    catch (err) {
        const status = err.message.includes('not found') ? 404
            : err.message.includes('stock') || err.message.includes('available') ? 409
                : 500;
        return res.status(status).json({ message: err.message });
    }
};
exports.updateItem = updateItem;
// ── DELETE /api/cart/:itemId ──────────────────────────────────────────────────
const removeItem = async (req, res) => {
    try {
        const cart = await CartService.removeItem(userId(req), req.params.itemId);
        return res.json(cart);
    }
    catch (err) {
        return res.status(err.message.includes('not found') ? 404 : 500).json({ message: err.message });
    }
};
exports.removeItem = removeItem;
// ── DELETE /api/cart ──────────────────────────────────────────────────────────
const clearCart = async (req, res) => {
    try {
        const result = await CartService.clearCart(userId(req));
        return res.json(result);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
exports.clearCart = clearCart;
// ── GET /api/cart/validate ────────────────────────────────────────────────────
const validateCart = async (req, res) => {
    try {
        const result = await CartService.validateCart(userId(req));
        return res.json(result);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
exports.validateCart = validateCart;
// ── GET /api/cart/summary ─────────────────────────────────────────────────────
const getCartSummary = async (req, res) => {
    try {
        const summary = await CartService.getCartSummary(userId(req));
        return res.json(summary);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
exports.getCartSummary = getCartSummary;
//# sourceMappingURL=cart.controller.js.map