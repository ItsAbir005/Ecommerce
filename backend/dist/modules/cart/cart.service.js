"use strict";
/**
 * cart.service.ts
 * All business logic for the cart. Never touches orders/payments/stock permanently.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCartSummary = exports.validateCart = exports.clearCart = exports.removeItem = exports.updateItem = exports.addItem = exports.getCart = exports.getOrCreateCart = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Cart_1 = require("../../models/Cart");
const Product_1 = require("../../models/Product");
// ─── Constants ─────────────────────────────────────────────────────────────────
const TAX_RATE = 0.08; // 8%
const FREE_SHIPPING = 50; // free shipping threshold (USD)
const SHIPPING_COST = 5.99;
// ─── Helpers ───────────────────────────────────────────────────────────────────
/** Calculate effective price after discount */
const effectivePrice = (product) => product.discount > 0
    ? parseFloat((product.price * (1 - product.discount / 100)).toFixed(2))
    : product.price;
/** Find or create a cart doc for a user */
const getOrCreateCart = async (userId) => {
    let cart = await Cart_1.Cart.findOne({ user_id: userId });
    if (!cart) {
        cart = await Cart_1.Cart.create({ user_id: userId, items: [] });
    }
    return cart;
};
exports.getOrCreateCart = getOrCreateCart;
// ─── 1. Get Cart (with populated product details) ──────────────────────────────
const getCart = async (userId) => {
    const cart = await Cart_1.Cart.findOne({ user_id: userId }).populate({
        path: 'items.product_id',
        select: 'title price discount stock images variants category_id',
    });
    if (!cart)
        return { user_id: userId, items: [], itemCount: 0 };
    return cart;
};
exports.getCart = getCart;
// ─── 2. Add Item to Cart ───────────────────────────────────────────────────────
const addItem = async (userId, productId, quantity, variantId) => {
    if (quantity < 1)
        throw new Error('Quantity must be at least 1');
    const product = await Product_1.Product.findById(productId);
    if (!product)
        throw new Error('Product not found');
    // Stock check
    if (variantId) {
        const variant = product.variants.find((v) => v._id.toString() === variantId);
        if (!variant)
            throw new Error('Variant not found');
        if (variant.stock < quantity)
            throw new Error(`Only ${variant.stock} units available for this variant`);
    }
    else {
        if (product.stock < quantity)
            throw new Error(`Only ${product.stock} units in stock`);
        if (product.stock === 0)
            throw new Error('Product is out of stock');
    }
    const cart = await (0, exports.getOrCreateCart)(userId);
    const price = effectivePrice(product);
    // Check if the exact item (product + variant combination) already exists
    const existingIdx = cart.items.findIndex((item) => {
        const sameProduct = item.product_id.toString() === productId;
        const sameVariant = variantId
            ? item.variant_id?.toString() === variantId
            : !item.variant_id;
        return sameProduct && sameVariant;
    });
    if (existingIdx > -1) {
        const newQty = cart.items[existingIdx].quantity + quantity;
        const availableStock = variantId
            ? product.variants.find((v) => v._id.toString() === variantId)?.stock ?? 0
            : product.stock;
        if (newQty > availableStock)
            throw new Error(`Cannot add more. Only ${availableStock} units available`);
        cart.items[existingIdx].quantity = newQty;
        // Update price snapshot in case it changed
        cart.items[existingIdx].price_at_addition = price;
    }
    else {
        const newItem = {
            product_id: new mongoose_1.default.Types.ObjectId(productId),
            quantity,
            price_at_addition: price,
        };
        if (variantId) {
            newItem.variant_id = new mongoose_1.default.Types.ObjectId(variantId);
        }
        cart.items.push(newItem);
    }
    await cart.save();
    return (0, exports.getCart)(userId);
};
exports.addItem = addItem;
// ─── 3. Update Cart Item ───────────────────────────────────────────────────────
const updateItem = async (userId, itemId, quantity, variantId) => {
    const cart = await Cart_1.Cart.findOne({ user_id: userId });
    if (!cart)
        throw new Error('Cart not found');
    const item = cart.items.find((i) => i._id.toString() === itemId);
    if (!item)
        throw new Error('Cart item not found');
    const product = await Product_1.Product.findById(item.product_id);
    if (!product)
        throw new Error('Product no longer exists');
    // If quantity is set to 0 or less, remove the item
    if (quantity !== undefined && quantity <= 0) {
        cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
        await cart.save();
        return (0, exports.getCart)(userId);
    }
    // Update variant
    if (variantId !== undefined) {
        const variant = product.variants.find((v) => v._id.toString() === variantId);
        if (!variant)
            throw new Error('Variant not found');
        item.variant_id = new mongoose_1.default.Types.ObjectId(variantId);
    }
    // Update quantity with stock validation
    if (quantity !== undefined) {
        const targetVariantId = item.variant_id?.toString();
        const availableStock = targetVariantId
            ? product.variants.find((v) => v._id.toString() === targetVariantId)?.stock ?? 0
            : product.stock;
        if (quantity > availableStock)
            throw new Error(`Only ${availableStock} units available`);
        item.quantity = quantity;
    }
    // Refresh price snapshot
    item.price_at_addition = effectivePrice(product);
    await cart.save();
    return (0, exports.getCart)(userId);
};
exports.updateItem = updateItem;
// ─── 4. Remove Single Item ────────────────────────────────────────────────────
const removeItem = async (userId, itemId) => {
    const cart = await Cart_1.Cart.findOne({ user_id: userId });
    if (!cart)
        throw new Error('Cart not found');
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    if (cart.items.length === before)
        throw new Error('Cart item not found');
    await cart.save();
    return (0, exports.getCart)(userId);
};
exports.removeItem = removeItem;
// ─── 5. Clear Entire Cart ─────────────────────────────────────────────────────
const clearCart = async (userId) => {
    await Cart_1.Cart.findOneAndUpdate({ user_id: userId }, { $set: { items: [] } }, { upsert: true });
    return { message: 'Cart cleared successfully' };
};
exports.clearCart = clearCart;
// ─── 6. Validate Cart Before Checkout ────────────────────────────────────────
const validateCart = async (userId) => {
    const cart = await Cart_1.Cart.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0)
        return { valid: true, changes: [], cart: { items: [] } };
    const issues = [];
    const toRemove = [];
    for (const item of cart.items) {
        const product = await Product_1.Product.findById(item.product_id);
        // Product no longer exists
        if (!product) {
            toRemove.push(item._id.toString());
            issues.push(`Item removed: product no longer exists`);
            continue;
        }
        const variantIdStr = item.variant_id?.toString();
        // Check stock for variant
        if (variantIdStr) {
            const variant = product.variants.find((v) => v._id.toString() === variantIdStr);
            if (!variant || variant.stock === 0) {
                toRemove.push(item._id.toString());
                issues.push(`"${product.title}" variant is out of stock — removed`);
                continue;
            }
            if (item.quantity > variant.stock) {
                item.quantity = variant.stock;
                issues.push(`"${product.title}" qty reduced to ${variant.stock} (stock limit)`);
            }
        }
        else {
            // Check overall stock
            if (product.stock === 0) {
                toRemove.push(item._id.toString());
                issues.push(`"${product.title}" is out of stock — removed`);
                continue;
            }
            if (item.quantity > product.stock) {
                item.quantity = product.stock;
                issues.push(`"${product.title}" qty reduced to ${product.stock} (stock limit)`);
            }
        }
        // Price drift detection
        const currentPrice = effectivePrice(product);
        if (item.price_at_addition !== currentPrice) {
            issues.push(`"${product.title}" price changed from $${item.price_at_addition} → $${currentPrice}`);
            item.price_at_addition = currentPrice;
        }
    }
    // Remove unavailable items
    if (toRemove.length > 0) {
        cart.items = cart.items.filter((i) => !toRemove.includes(i._id.toString()));
    }
    await cart.save();
    return {
        valid: issues.length === 0,
        changes: issues,
        cart: await (0, exports.getCart)(userId),
    };
};
exports.validateCart = validateCart;
// ─── 7. Cart Summary (subtotal, tax, discount, shipping, total) ───────────────
const getCartSummary = async (userId) => {
    const cart = await Cart_1.Cart.findOne({ user_id: userId }).populate({
        path: 'items.product_id',
        select: 'title price discount stock images',
    });
    if (!cart || cart.items.length === 0) {
        return {
            itemCount: 0,
            subtotal: 0,
            discountAmount: 0,
            tax: 0,
            shipping: 0,
            total: 0,
            items: [],
        };
    }
    let subtotal = 0;
    let discountAmount = 0;
    const lineItems = [];
    for (const item of cart.items) {
        const product = item.product_id;
        if (!product)
            continue;
        const originalLinePrice = product.price * item.quantity;
        const discountedUnitPrice = effectivePrice(product);
        const discountedLinePrice = discountedUnitPrice * item.quantity;
        const itemDiscount = originalLinePrice - discountedLinePrice;
        subtotal += discountedLinePrice;
        discountAmount += itemDiscount;
        lineItems.push({
            itemId: item._id,
            title: product.title,
            quantity: item.quantity,
            unitPrice: discountedUnitPrice,
            originalUnitPrice: product.price,
            lineTotal: parseFloat(discountedLinePrice.toFixed(2)),
            discount: parseFloat(itemDiscount.toFixed(2)),
        });
    }
    const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_COST;
    const total = parseFloat((subtotal + tax + shipping).toFixed(2));
    return {
        itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
        subtotal: parseFloat(subtotal.toFixed(2)),
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        tax,
        shipping,
        shippingNote: shipping === 0 ? 'Free shipping applied' : `Add $${(FREE_SHIPPING - subtotal).toFixed(2)} more for free shipping`,
        total,
        items: lineItems,
    };
};
exports.getCartSummary = getCartSummary;
//# sourceMappingURL=cart.service.js.map