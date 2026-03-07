import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'DRIVER_REGISTRATION' | 'GENERAL';

export interface INotification extends Document {
    type: NotificationType;
    message: string;
    isRead: boolean;
    relatedId?: mongoose.Types.ObjectId;
    metadata?: Record<string, any>; // Store extra info like driver name, vehicle etc.
}

const NotificationSchema: Schema = new Schema(
    {
        type: {
            type: String,
            enum: ['DRIVER_REGISTRATION', 'GENERAL'],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
        },
    },
    { timestamps: true }
);

// Indexes for faster querying
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
