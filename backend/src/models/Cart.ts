import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
    _id?: mongoose.Types.ObjectId;
    product_id: mongoose.Types.ObjectId;
    variant_id?: mongoose.Types.ObjectId;   // optional variant (size/color)
    quantity: number;
    price_at_addition: number;              // snapshot price for drift detection
}

export interface ICart extends Document {
    user_id: mongoose.Types.ObjectId;
    items: ICartItem[];
}

const CartItemSchema: Schema = new Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    quantity: { type: Number, required: true, min: 1 },
    price_at_addition: { type: Number, required: true },
});

const CartSchema: Schema = new Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        items: [CartItemSchema],
    },
    { timestamps: true }
);

export const Cart = mongoose.model<ICart>('Cart', CartSchema);
