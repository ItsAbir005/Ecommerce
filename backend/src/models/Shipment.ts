import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export type ShipmentStatus =
    | 'pending'
    | 'assigned'
    | 'picked_up'
    | 'out_for_delivery'
    | 'delivered'
    | 'failed';

export interface IShipment extends Document {
    order_id: mongoose.Types.ObjectId;
    driver_id?: mongoose.Types.ObjectId;
    status: ShipmentStatus;
    trackingCode: string;
    otp: string;            // 6-digit OTP for delivery confirmation
    estimatedDelivery?: Date;
    assignedAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
    failureReason?: string;
    pickupAddress: {
        street: string; city: string; state: string; zip: string; country: string;
    };
    deliveryAddress: {
        street: string; city: string; state: string; zip: string; country: string;
    };
}

const AddressSchema = new Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
}, { _id: false });

const ShipmentSchema = new Schema(
    {
        order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
        driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
        status: {
            type: String,
            enum: ['pending', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed'],
            default: 'pending',
        },
        // Unique tracking code: generated on creation
        trackingCode: {
            type: String,
            unique: true,
            default: () => 'TRK' + crypto.randomBytes(4).toString('hex').toUpperCase(),
        },
        // 6-digit OTP — driver submits at delivery to confirm
        otp: {
            type: String,
            default: () => Math.floor(100000 + Math.random() * 900000).toString(),
        },
        estimatedDelivery: { type: Date },
        assignedAt: { type: Date },
        pickedUpAt: { type: Date },
        deliveredAt: { type: Date },
        failureReason: { type: String },
        pickupAddress: { type: AddressSchema, required: true },
        deliveryAddress: { type: AddressSchema, required: true },
    },
    { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
ShipmentSchema.index({ order_id: 1 }, { unique: true });
ShipmentSchema.index({ driver_id: 1 });
ShipmentSchema.index({ status: 1 });
ShipmentSchema.index({ trackingCode: 1 }, { unique: true });

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);
