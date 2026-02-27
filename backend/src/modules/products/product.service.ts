import { Product } from "../../models/Product";
import mongoose from "mongoose";

/**
 * Checks if sufficient stock is available for a product (and optionally a specific variant).
 * @param productId 
 * @param quantity 
 * @param variantId (Optional) ID of the specific variant
 * @returns boolean
 */
export const checkStockAvailability = async (
    productId: string,
    quantity: number,
    variantId?: string
): Promise<boolean> => {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error("Product not found");
    }

    if (variantId) {
        const variant = product.variants.find(v => (v._id as mongoose.Types.ObjectId).toString() === variantId);
        if (!variant) {
            throw new Error("Variant not found");
        }
        return variant.stock >= quantity;
    }

    return product.stock >= quantity;
};

/**
 * Reduces the stock of a product (and optionally a specific variant) when an order is placed.
 * @param productId 
 * @param quantity 
 * @param variantId 
 */
export const reduceStock = async (
    productId: string,
    quantity: number,
    variantId?: string
): Promise<void> => {
    const isAvailable = await checkStockAvailability(productId, quantity, variantId);

    if (!isAvailable) {
        throw new Error("Insufficient stock available");
    }

    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    if (variantId) {
        const variantIndex = product.variants.findIndex(v => (v._id as mongoose.Types.ObjectId).toString() === variantId);
        if (variantIndex !== -1) {
            product.variants[variantIndex].stock -= quantity;
        }
    }

    product.stock -= quantity;
    await product.save();
};

/**
 * Increases the stock of a product (and optionally a specific variant) when an order is cancelled.
 * @param productId 
 * @param quantity 
 * @param variantId 
 */
export const increaseStock = async (
    productId: string,
    quantity: number,
    variantId?: string
): Promise<void> => {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    if (variantId) {
        const variantIndex = product.variants.findIndex(v => (v._id as mongoose.Types.ObjectId).toString() === variantId);
        if (variantIndex !== -1) {
            product.variants[variantIndex].stock += quantity;
        }
    }

    product.stock += quantity;
    await product.save();
};
