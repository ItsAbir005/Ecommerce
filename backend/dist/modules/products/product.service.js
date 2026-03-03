"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.increaseStock = exports.reduceStock = exports.checkStockAvailability = void 0;
const Product_1 = require("../../models/Product");
/**
 * Checks if sufficient stock is available for a product (and optionally a specific variant).
 * @param productId
 * @param quantity
 * @param variantId (Optional) ID of the specific variant
 * @returns boolean
 */
const checkStockAvailability = async (productId, quantity, variantId) => {
    const product = await Product_1.Product.findById(productId);
    if (!product) {
        throw new Error("Product not found");
    }
    if (variantId) {
        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (!variant) {
            throw new Error("Variant not found");
        }
        return variant.stock >= quantity;
    }
    return product.stock >= quantity;
};
exports.checkStockAvailability = checkStockAvailability;
/**
 * Reduces the stock of a product (and optionally a specific variant) when an order is placed.
 * @param productId
 * @param quantity
 * @param variantId
 */
const reduceStock = async (productId, quantity, variantId) => {
    const isAvailable = await (0, exports.checkStockAvailability)(productId, quantity, variantId);
    if (!isAvailable) {
        throw new Error("Insufficient stock available");
    }
    const product = await Product_1.Product.findById(productId);
    if (!product)
        throw new Error("Product not found");
    if (variantId) {
        const variantIndex = product.variants.findIndex(v => v._id.toString() === variantId);
        if (variantIndex !== -1) {
            product.variants[variantIndex].stock -= quantity;
        }
    }
    product.stock -= quantity;
    await product.save();
};
exports.reduceStock = reduceStock;
/**
 * Increases the stock of a product (and optionally a specific variant) when an order is cancelled.
 * @param productId
 * @param quantity
 * @param variantId
 */
const increaseStock = async (productId, quantity, variantId) => {
    const product = await Product_1.Product.findById(productId);
    if (!product)
        throw new Error("Product not found");
    if (variantId) {
        const variantIndex = product.variants.findIndex(v => v._id.toString() === variantId);
        if (variantIndex !== -1) {
            product.variants[variantIndex].stock += quantity;
        }
    }
    product.stock += quantity;
    await product.save();
};
exports.increaseStock = increaseStock;
//# sourceMappingURL=product.service.js.map