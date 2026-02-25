import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    parent_id?: mongoose.Types.ObjectId;
}

const CategorySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    },
    { timestamps: true }
);

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
