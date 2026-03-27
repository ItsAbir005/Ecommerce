"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveDriverHandler = exports.blockDriverHandler = exports.getAllDriversHandler = exports.getHistoryHandler = exports.getActiveDeliveryHandler = exports.updateLocation = exports.setStatus = exports.getMe = void 0;
const driver_service_1 = require("./driver.service");
const Driver_1 = require("../../models/Driver");
const Notification_1 = require("../../models/Notification");
// GET /api/drivers/me
const getMe = async (req, res) => {
    try {
        const driver = await (0, driver_service_1.getDriverProfile)(req.driver._id.toString());
        res.json(driver);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getMe = getMe;
// PUT /api/drivers/status  { status: 'online'|'offline', lat, lng }
const setStatus = async (req, res) => {
    try {
        const { status, lat, lng } = req.body;
        if (!['online', 'offline'].includes(status)) {
            return res.status(400).json({ message: 'status must be "online" or "offline"' });
        }
        const result = await (0, driver_service_1.setDriverStatus)(req.driver._id.toString(), status, lat, lng);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.setStatus = setStatus;
// PUT /api/drivers/location  { lat, lng }
const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ message: 'lat and lng are required' });
        }
        const result = await (0, driver_service_1.updateDriverLocation)(req.driver._id.toString(), lat, lng);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateLocation = updateLocation;
// GET /api/drivers/delivery/active
const getActiveDeliveryHandler = async (req, res) => {
    try {
        const delivery = await (0, driver_service_1.getActiveDelivery)(req.driver._id.toString());
        res.json(delivery);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getActiveDeliveryHandler = getActiveDeliveryHandler;
// GET /api/drivers/delivery/history  — driver's completed deliveries
const getHistoryHandler = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const result = await (0, driver_service_1.getDeliveryHistory)(req.driver._id.toString(), page);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getHistoryHandler = getHistoryHandler;
// ── Admin handlers ────────────────────────────────────────────────────────────
// GET /api/drivers/all  — admin: list all registered drivers
const getAllDriversHandler = async (_req, res) => {
    try {
        const drivers = await Driver_1.Driver.find({}).select('-password').sort({ createdAt: -1 }).lean();
        res.json(drivers);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getAllDriversHandler = getAllDriversHandler;
// PUT /api/drivers/:id/block  — admin: block or unblock a driver
const blockDriverHandler = async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const update = { isBlocked: !!isBlocked };
        // Force driver offline when blocked
        if (isBlocked)
            update.status = 'offline';
        const driver = await Driver_1.Driver.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
        if (!driver)
            return res.status(404).json({ message: 'Driver not found' });
        res.json(driver);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.blockDriverHandler = blockDriverHandler;
// PUT /api/drivers/:id/approve  — admin: approve a new driver
const approveDriverHandler = async (req, res) => {
    try {
        const driver = await Driver_1.Driver.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true }).select('-password');
        if (!driver)
            return res.status(404).json({ message: 'Driver not found' });
        // Mark associated notification as read if it exists
        await Notification_1.Notification.findOneAndUpdate({ relatedId: driver._id, type: 'DRIVER_REGISTRATION' }, { isRead: true });
        res.json({ message: 'Driver approved successfully', driver });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.approveDriverHandler = approveDriverHandler;
//# sourceMappingURL=driver.controller.js.map