import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
    title: string;
    description: string;
    price: number;
    stock: number;
    category_id: mongoose.Types.ObjectId;
}

const ProductSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        stock: { type: Number, required: true, min: 0 },
        category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    },
    { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
