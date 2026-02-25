import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
    product_id: mongoose.Types.ObjectId;
    title: string;
    price: number;
    quantity: number;
}

export interface IOrder extends Document {
    user_id: mongoose.Types.ObjectId;
    total_amount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_status: 'unpaid' | 'paid' | 'refunded';
    order_items: IOrderItem[];
}

const OrderItemSchema: Schema = new Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
});

const OrderSchema: Schema = new Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        total_amount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
        payment_status: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'unpaid',
        },
        order_items: [OrderItemSchema],
    },
    { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
