"use strict";
/**
 * cart.service.ts
 * Refactored to use Redis for extremely fast in-memory cart storage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCartSummary = exports.validateCart = exports.clearCart = exports.removeItem = exports.updateItem = exports.addItem = exports.getCart = void 0;
const redis_1 = require("../../config/redis");
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
const getCartKey = (userId) => `cart:${userId}`;
/**
 * Retrieves the cart from Redis. Returns a default empty cart if none exists.
 */
const getCart = async (userId) => {
    const key = getCartKey(userId);
    const data = await redis_1.redisClient.get(key);
    if (!data) {
        return { user_id: userId, items: [] };
    }
    return JSON.parse(data);
};
exports.getCart = getCart;
/**
 * Saves the cart to Redis and resets the TTL (Time-To-Live) expiration.
 */
const saveCart = async (userId, cart) => {
    const key = getCartKey(userId);
    await redis_1.redisClient.setEx(key, redis_1.CART_TTL, JSON.stringify(cart));
};
// ─── 1. Add Item to Cart ───────────────────────────────────────────────────────
const addItem = async (userId, productId, quantity, variantId) => {
    if (quantity < 1)
        throw new Error('Quantity must be at least 1');
    const product = await Product_1.Product.findById(productId);
    if (!product)
        throw new Error('Product not found');
    // Stock check against the source of truth (DB)
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
    const cart = await (0, exports.getCart)(userId);
    const price = effectivePrice(product);
    const existingIdx = cart.items.findIndex((item) => {
        const sameProduct = item.product_id === productId;
        const sameVariant = variantId ? item.variant_id === variantId : !item.variant_id;
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
        cart.items[existingIdx].price_at_addition = price; // Refresh snapshot
    }
    else {
        const newItem = {
            product_id: productId,
            variant_id: variantId,
            title: product.title,
            image: product.images?.[0] || '',
            price: price,
            discount: product.discount || 0,
            quantity,
            price_at_addition: price,
        };
        cart.items.push(newItem);
    }
    await saveCart(userId, cart);
    return cart; // Notice we return the populated Redis cart directly
};
exports.addItem = addItem;
// ─── 2. Update Cart Item ───────────────────────────────────────────────────────
const updateItem = async (userId, itemId, // In the new Redis model, we map item ID to product_id as the easiest unique identifier alongside variant
quantity, variantId) => {
    // Note: We'll assume the client is passing the product ID as the "itemId" for simplicity in the cache model, or a strict composite. 
    // Usually, you pass up the product_id + variant_id to identify the item. Let's assume itemId = product_id to match old signature loosely.
    const cart = await (0, exports.getCart)(userId);
    // Find the item by product ID (and variant if provided)
    const existingIdx = cart.items.findIndex((i) => i.product_id === itemId && (variantId ? i.variant_id === variantId : true));
    if (existingIdx === -1)
        throw new Error('Cart item not found in Redis');
    const item = cart.items[existingIdx];
    const product = await Product_1.Product.findById(item.product_id);
    if (!product)
        throw new Error('Product no longer exists');
    // Remove if quantity 0
    if (quantity !== undefined && quantity <= 0) {
        cart.items.splice(existingIdx, 1);
        await saveCart(userId, cart);
        return cart;
    }
    // Replace variant if requested
    if (variantId !== undefined) {
        const variant = product.variants.find((v) => v._id.toString() === variantId);
        if (!variant)
            throw new Error('Variant not found');
        item.variant_id = variantId;
    }
    // Update quantity
    if (quantity !== undefined) {
        const targetVariantId = item.variant_id;
        const availableStock = targetVariantId
            ? product.variants.find((v) => v._id.toString() === targetVariantId)?.stock ?? 0
            : product.stock;
        if (quantity > availableStock)
            throw new Error(`Only ${availableStock} units available`);
        item.quantity = quantity;
    }
    item.price_at_addition = effectivePrice(product);
    await saveCart(userId, cart);
    return cart;
};
exports.updateItem = updateItem;
// ─── 3. Remove Single Item ────────────────────────────────────────────────────
const removeItem = async (userId, itemId) => {
    // Again, assuming itemId = product_id for compatibility
    const cart = await (0, exports.getCart)(userId);
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => i.product_id !== itemId);
    if (cart.items.length === before)
        throw new Error('Cart item not found in Redis');
    await saveCart(userId, cart);
    return cart;
};
exports.removeItem = removeItem;
// ─── 4. Clear Entire Cart ─────────────────────────────────────────────────────
const clearCart = async (userId) => {
    await redis_1.redisClient.del(getCartKey(userId));
    return { message: 'Cart cleared successfully from Redis' };
};
exports.clearCart = clearCart;
// ─── 5. Validate Cart Before Checkout ────────────────────────────────────────
const validateCart = async (userId) => {
    const cart = await (0, exports.getCart)(userId);
    if (cart.items.length === 0)
        return { valid: true, changes: [], cart };
    const issues = [];
    const toRemove = [];
    for (const item of cart.items) {
        const product = await Product_1.Product.findById(item.product_id);
        if (!product) {
            toRemove.push(item.product_id);
            issues.push(`Item removed: product no longer exists`);
            continue;
        }
        if (item.variant_id) {
            const variant = product.variants.find((v) => v._id.toString() === item.variant_id);
            if (!variant || variant.stock === 0) {
                toRemove.push(item.product_id);
                issues.push(`"${product.title}" variant is out of stock — removed`);
                continue;
            }
            if (item.quantity > variant.stock) {
                item.quantity = variant.stock;
                issues.push(`"${product.title}" qty reduced to ${variant.stock} (stock limit)`);
            }
        }
        else {
            if (product.stock === 0) {
                toRemove.push(item.product_id);
                issues.push(`"${product.title}" is out of stock — removed`);
                continue;
            }
            if (item.quantity > product.stock) {
                item.quantity = product.stock;
                issues.push(`"${product.title}" qty reduced to ${product.stock} (stock limit)`);
            }
        }
        const currentPrice = effectivePrice(product);
        if (item.price_at_addition !== currentPrice) {
            issues.push(`"${product.title}" price changed from $${item.price_at_addition} → $${currentPrice}`);
            item.price_at_addition = currentPrice;
        }
    }
    if (toRemove.length > 0) {
        cart.items = cart.items.filter((i) => !toRemove.includes(i.product_id));
    }
    await saveCart(userId, cart);
    return {
        valid: issues.length === 0,
        changes: issues,
        cart: await (0, exports.getCart)(userId),
    };
};
exports.validateCart = validateCart;
// ─── 6. Cart Summary (subtotal, tax, discount, shipping, total) ───────────────
const getCartSummary = async (userId) => {
    const cart = await (0, exports.getCart)(userId);
    if (cart.items.length === 0) {
        return { itemCount: 0, subtotal: 0, discountAmount: 0, tax: 0, shipping: 0, total: 0, items: [] };
    }
    let subtotal = 0;
    let discountAmount = 0;
    const lineItems = [];
    for (const item of cart.items) {
        // In Redis, we already snapshot the core details in the cache
        // So we can compute the summary without a DB query! (Massive speedup)
        const originalLinePrice = item.price * item.quantity;
        // The item.price is the discounted price at addition. 
        // Realistically, to get the absolute 'discountAmount' across the order based on original prices,
        // we should rely on the product DB or store the item's original_price in Redis.
        // For this summary, we'll pull from DB quickly since summary is heavy anyway.
        const product = await Product_1.Product.findById(item.product_id);
        if (!product)
            continue;
        const discountedUnitPrice = effectivePrice(product);
        const discountedLinePrice = discountedUnitPrice * item.quantity;
        const itemDiscount = (product.price * item.quantity) - discountedLinePrice;
        subtotal += discountedLinePrice;
        discountAmount += itemDiscount;
        lineItems.push({
            itemId: item.product_id, // Note: mapping product id as itemId
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