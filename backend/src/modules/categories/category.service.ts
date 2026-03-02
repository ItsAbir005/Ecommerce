import { Category, ICategory } from '../../models/Category';
import { Product } from '../../models/Product';
import mongoose from 'mongoose';

// ── 1. Get all categories (flat) ──────────────────────────────────────────────
export const getAllCategories = async () => {
    return Category.find({}).sort({ name: 1 }).lean();
};

// ── 2. Get category tree (nested parent → children) ───────────────────────────
export const getCategoryTree = async () => {
    const all = await Category.find({}).sort({ name: 1 }).lean();

    // Type for tree node
    type TreeNode = typeof all[0] & { children: TreeNode[] };

    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Build map
    for (const cat of all) {
        map.set(cat._id.toString(), { ...cat, children: [] } as unknown as TreeNode);
    }

    // Connect parent → children
    for (const node of map.values()) {
        if (node.parent_id) {
            const parent = map.get(node.parent_id.toString());
            if (parent) parent.children.push(node);
            else roots.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
};

// ── 3. Get products by category (paginated) ───────────────────────────────────
export const getProductsByCategory = async (categoryId: string, page = 1, limit = 12) => {
    const query = { category_id: new mongoose.Types.ObjectId(categoryId) };
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    return { products, total, page, pages: Math.ceil(total / limit) };
};

// ── 4. Create category (admin) ────────────────────────────────────────────────
export const createCategory = async (data: {
    name: string; description?: string; icon?: string; image?: string; parent_id?: string;
}) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await Category.findOne({ slug });
    if (existing) throw new Error('Category with this name already exists');

    return Category.create({
        name: data.name,
        slug,
        description: data.description ?? '',
        icon: data.icon ?? '',
        image: data.image ?? '',
        parent_id: data.parent_id ?? undefined,
    });
};

// ── 5. Update category (admin) ────────────────────────────────────────────────
export const updateCategory = async (id: string, data: Partial<{
    name: string; description: string; icon: string; image: string; parent_id: string | null;
}>) => {
    const updates: any = { ...data };
    if (data.name) {
        updates.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    const cat = await Category.findByIdAndUpdate(id, updates, { new: true });
    if (!cat) throw new Error('Category not found');
    return cat;
};

// ── 6. Delete category (admin — blocks if products exist) ─────────────────────
export const deleteCategory = async (id: string) => {
    const productCount = await Product.countDocuments({ category_id: id });
    if (productCount > 0)
        throw new Error(`Cannot delete: ${productCount} products still belong to this category`);

    // Also check for child categories
    const childCount = await Category.countDocuments({ parent_id: id });
    if (childCount > 0)
        throw new Error(`Cannot delete: ${childCount} sub-categories use this as parent`);

    const cat = await Category.findByIdAndDelete(id);
    if (!cat) throw new Error('Category not found');
    return { message: 'Category deleted successfully' };
};
