import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    slug: string;
    description?: string;
    icon?: string;         // emoji icon e.g. "📱"
    image?: string;        // Cloudinary URL
    parent_id?: mongoose.Types.ObjectId | null;
}

const CategorySchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, unique: true, lowercase: true, sparse: true },
        description: { type: String, default: '' },
        icon: { type: String, default: '' },
        image: { type: String, default: '' },
        parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    },
    { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Text search on category name
CategorySchema.index({ name: 'text' });
// Hierarchical queries: all subcategories of a parent
CategorySchema.index({ parent_id: 1 });
// slug is already unique on the field level

export const Category = mongoose.model<ICategory>('Category', CategorySchema);

