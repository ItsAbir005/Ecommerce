import { Request, Response } from 'express';
import { Notification } from '../../models/Notification';

export const getNotifications = async (_req: Request, res: Response): Promise<any> => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50).lean();
        res.json(notifications);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const getUnreadNotifications = async (_req: Request, res: Response): Promise<any> => {
    try {
        const notifications = await Notification.find({ isRead: false }).sort({ createdAt: -1 }).lean();
        res.json(notifications);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const markAsRead = async (req: Request, res: Response): Promise<any> => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json(notification);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const markAllAsRead = async (_req: Request, res: Response): Promise<any> => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
