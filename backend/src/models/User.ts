import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    profileImage?: string;
    isBlocked: boolean;
    addresses: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        isDefault: boolean;
    }[];
    notificationSettings: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    role: 'user' | 'admin';
}

const AddressSchema = new Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
}, { _id: true });

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        profileImage: { type: String },
        isBlocked: { type: Boolean, default: false },
        addresses: [AddressSchema],
        notificationSettings: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
        },
        role: { type: String, enum: ['user', 'admin'], default: 'user' }
    },
    { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// email is already unique=true on the field, but explicit index improves lookup speed
UserSchema.index({ email: 1 }, { unique: true });
// Admin panel: filter/sort users by role
UserSchema.index({ role: 1 });
// Moderation: quickly find all blocked users
UserSchema.index({ isBlocked: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

