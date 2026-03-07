import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type DriverStatus = 'offline' | 'online' | 'busy';
export type VehicleType = 'bike' | 'car' | 'van' | 'truck';

export interface IDriver extends Document {
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicleNumber: string;
    vehicleType: VehicleType;
    licenseNumber: string;
    status: DriverStatus;
    isAvailable: boolean;
    currentLocation: {
        lat: number;
        lng: number;
        updatedAt: Date;
    };
    isBlocked: boolean;
    isApproved: boolean; // Tracking admin approvals for new registrations
    role: 'driver';
    comparePassword(candidate: string): Promise<boolean>;
}

const DriverSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 6 },
        phone: { type: String, required: true },
        vehicleNumber: { type: String, required: true, uppercase: true },
        vehicleType: {
            type: String,
            enum: ['bike', 'car', 'van', 'truck'],
            default: 'bike',
        },
        licenseNumber: { type: String, required: true },
        status: {
            type: String,
            enum: ['offline', 'online', 'busy'],
            default: 'offline',
        },
        isAvailable: { type: Boolean, default: false },
        currentLocation: {
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 },
            updatedAt: { type: Date, default: Date.now },
        },
        isBlocked: { type: Boolean, default: false },
        isApproved: { type: Boolean, default: false }, // New drivers are pending approval
        role: { type: String, default: 'driver', immutable: true },
    },
    { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
DriverSchema.index({ email: 1 }, { unique: true });
DriverSchema.index({ status: 1 });
DriverSchema.index({ isAvailable: 1 });

// ── Hash password before save ──────────────────────────────────────────────────
// Mongoose 7+: async pre-hooks don't receive a `next` callback — just return a Promise
DriverSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password as string, 12);
});

// ── Password comparison method ─────────────────────────────────────────────────
DriverSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
};

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
