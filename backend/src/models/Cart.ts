import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
    product_id: mongoose.Types.ObjectId;
    quantity: number;
}

export interface ICart extends Document {
    user_id: mongoose.Types.ObjectId;
    items: ICartItem[];
}

const CartItemSchema: Schema = new Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
});

const CartSchema: Schema = new Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        items: [CartItemSchema],
    },
    { timestamps: true }
);

export const Cart = mongoose.model<ICart>('Cart', CartSchema);
