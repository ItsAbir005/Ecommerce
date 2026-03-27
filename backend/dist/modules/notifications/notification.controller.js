"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getUnreadNotifications = exports.getNotifications = void 0;
const Notification_1 = require("../../models/Notification");
const getNotifications = async (_req, res) => {
    try {
        const notifications = await Notification_1.Notification.find().sort({ createdAt: -1 }).limit(50).lean();
        res.json(notifications);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getNotifications = getNotifications;
const getUnreadNotifications = async (_req, res) => {
    try {
        const notifications = await Notification_1.Notification.find({ isRead: false }).sort({ createdAt: -1 }).lean();
        res.json(notifications);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getUnreadNotifications = getUnreadNotifications;
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification_1.Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
        if (!notification)
            return res.status(404).json({ message: 'Notification not found' });
        res.json(notification);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (_req, res) => {
    try {
        await Notification_1.Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.markAllAsRead = markAllAsRead;
//# sourceMappingURL=notification.controller.js.map