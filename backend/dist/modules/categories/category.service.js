"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getProductsByCategory = exports.getCategoryTree = exports.getAllCategories = void 0;
const Category_1 = require("../../models/Category");
const Product_1 = require("../../models/Product");
const mongoose_1 = __importDefault(require("mongoose"));
// ── 1. Get all categories (flat) ──────────────────────────────────────────────
const getAllCategories = async () => {
    return Category_1.Category.find({}).sort({ name: 1 }).lean();
};
exports.getAllCategories = getAllCategories;
// ── 2. Get category tree (nested parent → children) ───────────────────────────
const getCategoryTree = async () => {
    const all = await Category_1.Category.find({}).sort({ name: 1 }).lean();
    const map = new Map();
    const roots = [];
    // Build map
    for (const cat of all) {
        map.set(cat._id.toString(), { ...cat, children: [] });
    }
    // Connect parent → children
    for (const node of map.values()) {
        if (node.parent_id) {
            const parent = map.get(node.parent_id.toString());
            if (parent)
                parent.children.push(node);
            else
                roots.push(node);
        }
        else {
            roots.push(node);
        }
    }
    return roots;
};
exports.getCategoryTree = getCategoryTree;
// ── 3. Get products by category (paginated) ───────────────────────────────────
const getProductsByCategory = async (categoryId, page = 1, limit = 12) => {
    const query = { category_id: new mongoose_1.default.Types.ObjectId(categoryId) };
    const total = await Product_1.Product.countDocuments(query);
    const products = await Product_1.Product.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    return { products, total, page, pages: Math.ceil(total / limit) };
};
exports.getProductsByCategory = getProductsByCategory;
// ── 4. Create category (admin) ────────────────────────────────────────────────
const createCategory = async (data) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await Category_1.Category.findOne({ slug });
    if (existing)
        throw new Error('Category with this name already exists');
    return Category_1.Category.create({
        name: data.name,
        slug,
        description: data.description ?? '',
        icon: data.icon ?? '',
        image: data.image ?? '',
        parent_id: data.parent_id ?? undefined,
    });
};
exports.createCategory = createCategory;
// ── 5. Update category (admin) ────────────────────────────────────────────────
const updateCategory = async (id, data) => {
    const updates = { ...data };
    if (data.name) {
        updates.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    const cat = await Category_1.Category.findByIdAndUpdate(id, updates, { new: true });
    if (!cat)
        throw new Error('Category not found');
    return cat;
};
exports.updateCategory = updateCategory;
// ── 6. Delete category (admin — blocks if products exist) ─────────────────────
const deleteCategory = async (id) => {
    const productCount = await Product_1.Product.countDocuments({ category_id: id });
    if (productCount > 0)
        throw new Error(`Cannot delete: ${productCount} products still belong to this category`);
    // Also check for child categories
    const childCount = await Category_1.Category.countDocuments({ parent_id: id });
    if (childCount > 0)
        throw new Error(`Cannot delete: ${childCount} sub-categories use this as parent`);
    const cat = await Category_1.Category.findByIdAndDelete(id);
    if (!cat)
        throw new Error('Category not found');
    return { message: 'Category deleted successfully' };
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=category.service.js.map