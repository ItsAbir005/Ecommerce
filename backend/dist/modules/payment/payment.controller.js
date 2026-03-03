"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refund = exports.webhook = exports.initializePayment = void 0;
const payment_service_1 = require("./payment.service");
const Order_1 = require("../../models/Order");
const initializePayment = async (req, res) => {
    try {
        const { order_id } = req.body;
        if (!order_id) {
            res.status(400).json({ success: false, message: 'order_id is required' });
            return;
        }
        const order = await Order_1.Order.findById(order_id);
        if (!order) {
            res.status(404).json({ success: false, message: 'Order not found' });
            return;
        }
        if (order.payment_status === 'paid') {
            res.status(400).json({ success: false, message: 'Order is already paid' });
            return;
        }
        const session = await payment_service_1.PaymentService.createCheckoutSession(order._id.toString(), order.total_amount, 'usd' // You can make this dynamic if needed
        );
        res.status(200).json({
            success: true,
            checkout_url: session.url,
            session_id: session.id,
        });
    }
    catch (error) {
        console.error('Payment initialization error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};
exports.initializePayment = initializePayment;
const webhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('Stripe webhook secret is not set.');
        res.status(500).send('Webhook secret not configured in the environment.');
        return;
    }
    if (!signature) {
        res.status(400).send('No signature found in headers.');
        return;
    }
    try {
        // Express must be configured to pass the raw body to this endpoint
        await payment_service_1.PaymentService.handleWebhookEvent(req.body, signature, webhookSecret);
        res.status(200).json({ received: true });
    }
    catch (err) {
        console.error('Webhook processing failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
};
exports.webhook = webhook;
const refund = async (req, res) => {
    try {
        const payment_id = req.params.payment_id;
        const refundResult = await payment_service_1.PaymentService.processRefund(payment_id);
        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            data: refundResult,
        });
    }
    catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};
exports.refund = refund;
//# sourceMappingURL=payment.controller.js.map