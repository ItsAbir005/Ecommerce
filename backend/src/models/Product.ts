import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
    title: string;
    description: string;
    price: number;
    stock: number;
    category_id: mongoose.Types.ObjectId;
    images: string[];
    variants: {
        _id?: mongoose.Types.ObjectId;
        size: string;
        color: string;
        stock: number;
    }[];
    discount: number;
}

const ProductSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        stock: { type: Number, required: true, min: 0 },
        category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
        images: [{ type: String }],
        variants: [
            {
                size: { type: String },
                color: { type: String },
                stock: { type: Number, required: true, min: 0, default: 0 },
            }
        ],
        discount: { type: Number, default: 0, min: 0, max: 100 },
    },
    { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Text index: enables full-text search on title and description
ProductSchema.index({ title: 'text', description: 'text' });
// Category page: fast filtering by category + sort by price
ProductSchema.index({ category_id: 1, price: 1 });
// Deals page: filter by discount > 0
ProductSchema.index({ discount: -1 });
// Price range filtering
ProductSchema.index({ price: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

