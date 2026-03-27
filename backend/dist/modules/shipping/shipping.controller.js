"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectDeliveryHandler = exports.acceptDeliveryHandler = exports.confirmDeliveryHandler = exports.updateStatus = exports.getTracking = void 0;
const shipping_service_1 = require("./shipping.service");
// GET /api/shipping/order/:orderId  — customer tracking
const getTracking = async (req, res) => {
    try {
        const shipment = await (0, shipping_service_1.getShipmentByOrder)(req.params.orderId);
        if (!shipment)
            return res.status(404).json({ message: 'Shipment not found' });
        res.json(shipment);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getTracking = getTracking;
// PUT /api/shipping/:id/status  — driver updates status
const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['picked_up', 'out_for_delivery', 'failed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Status must be one of: ${validStatuses.join(', ')}`,
            });
        }
        const shipment = await (0, shipping_service_1.updateShipmentStatus)(req.params.id, req.driver._id.toString(), status);
        res.json(shipment);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};
exports.updateStatus = updateStatus;
// POST /api/shipping/:id/confirm-delivery  — driver submits OTP
const confirmDeliveryHandler = async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp)
            return res.status(400).json({ message: 'OTP is required' });
        const shipment = await (0, shipping_service_1.confirmDelivery)(req.params.id, req.driver._id.toString(), otp);
        res.json({ message: 'Delivery confirmed!', shipment });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};
exports.confirmDeliveryHandler = confirmDeliveryHandler;
// POST /api/shipping/:id/accept  — driver accepts delivery
const acceptDeliveryHandler = async (req, res) => {
    try {
        const shipment = await (0, shipping_service_1.acceptDelivery)(req.params.id, req.driver._id.toString());
        res.json(shipment);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};
exports.acceptDeliveryHandler = acceptDeliveryHandler;
// POST /api/shipping/:id/reject  — driver rejects delivery so it can be re-assigned
const rejectDeliveryHandler = async (req, res) => {
    try {
        const shipment = await (0, shipping_service_1.rejectDelivery)(req.params.id, req.driver._id.toString());
        res.json(shipment);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};
exports.rejectDeliveryHandler = rejectDeliveryHandler;
//# sourceMappingURL=shipping.controller.js.map