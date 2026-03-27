"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const Payment_1 = require("../../models/Payment");
const Order_1 = require("../../models/Order");
const rabbitmq_1 = require("../../config/rabbitmq");
// Ensure STRIPE_SECRET_KEY is populated in production
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    // Explicitly cast to any to avoid version mismatch errors in different TS environments
    apiVersion: '2025-02-24.acacia',
});
class PaymentService {
    static async createCheckoutSession(orderId, amount, currency) {
        // Create an initial payment record
        const payment = new Payment_1.Payment({
            order_id: orderId,
            transaction_id: 'pending_' + Date.now(), // Temporary ID until Stripe provides one
            amount: amount,
            currency: currency,
            status: 'pending',
        });
        await payment.save();
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: `Order #${orderId}`,
                        },
                        unit_amount: Math.round(amount * 100), // Stripe expects amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            client_reference_id: orderId,
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${orderId}?payment=success`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${orderId}?payment=cancel`,
            metadata: {
                payment_record_id: payment._id.toString(),
            }
        });
        // Update with the actual checkout session id
        payment.transaction_id = session.id;
        await payment.save();
        return session;
    }
    static async handleWebhookEvent(body, signature, secret) {
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, secret);
        }
        catch (err) {
            throw new Error(`Webhook Validation Error: ${err.message}`);
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const paymentId = session.metadata?.payment_record_id;
            if (paymentId) {
                const payment = await Payment_1.Payment.findById(paymentId);
                if (payment) {
                    payment.status = 'successful';
                    // Save either the specific payment intent or fallback to the session id
                    payment.transaction_id = session.payment_intent || session.id;
                    await payment.save();
                    // Update the order status since payment succeeded
                    const order = await Order_1.Order.findById(payment.order_id);
                    if (order) {
                        order.payment_status = 'paid';
                        if (order.status === 'pending') {
                            order.status = 'paid';
                        }
                        await order.save();
                    }
                    // ── Publish payment.success to message queue ─────────────
                    // Workers will send payment confirmation email + initiate shipping
                    await rabbitmq_1.rabbitMQ.publishEvent('payment.success', {
                        orderId: payment.order_id.toString(),
                        userId: order?.user_id?.toString(),
                        amount: payment.amount,
                    });
                }
            }
        }
        else if (event.type === 'payment_intent.payment_failed') {
            const intent = event.data.object;
            // Handle failed payment, matching by transaction_id OR metadata if we stored it
            const payment = await Payment_1.Payment.findOne({ transaction_id: intent.id });
            if (payment) {
                payment.status = 'failed';
                await payment.save();
            }
        }
        else if (event.type === 'charge.refunded') {
            const charge = event.data.object;
            if (charge.payment_intent) {
                const payment = await Payment_1.Payment.findOne({ transaction_id: charge.payment_intent });
                if (payment) {
                    payment.status = 'refunded';
                    await payment.save();
                    const order = await Order_1.Order.findById(payment.order_id);
                    if (order) {
                        order.payment_status = 'refunded';
                        // Optionally update status to cancelled based on your business logic
                        order.status = 'cancelled';
                        await order.save();
                    }
                }
            }
        }
        return event;
    }
    static async processRefund(paymentId) {
        const payment = await Payment_1.Payment.findById(paymentId);
        if (!payment)
            throw new Error('Payment not found');
        if (payment.status !== 'successful')
            throw new Error('Only successful payments can be refunded');
        // The transaction_id generally acts as the Payment Intent when 'successful'
        const refund = await stripe.refunds.create({
            payment_intent: payment.transaction_id,
        });
        // We update status synchronously here, though the webhook will also catch it asynchronously
        if (refund.status === 'succeeded' || refund.status === 'pending') {
            payment.status = 'refunded';
            await payment.save();
            const order = await Order_1.Order.findById(payment.order_id);
            if (order) {
                order.payment_status = 'refunded';
                order.status = 'cancelled';
                await order.save();
            }
            // ── Publish refund job to message queue ───────────────────────────
            // Background worker will send refund confirmation email
            await rabbitmq_1.rabbitMQ.publishEvent('job.process_refund', {
                orderId: payment.order_id.toString(),
                userId: order?.user_id?.toString(),
                amount: payment.amount,
            });
        }
        return refund;
    }
    static async verifyPaymentStatus(orderId) {
        // Get the latest payment for this order
        const payment = await Payment_1.Payment.findOne({ order_id: orderId }).sort({ _id: -1 });
        if (!payment)
            throw new Error('Payment record not found');
        if (payment.status === 'successful') {
            return { verified: true, status: 'paid' };
        }
        if (payment.status === 'pending' && payment.transaction_id && payment.transaction_id.startsWith('cs_')) {
            try {
                const session = await stripe.checkout.sessions.retrieve(payment.transaction_id);
                if (session.payment_status === 'paid') {
                    payment.status = 'successful';
                    payment.transaction_id = session.payment_intent || session.id;
                    await payment.save();
                    const order = await Order_1.Order.findById(orderId);
                    if (order) {
                        order.payment_status = 'paid';
                        if (order.status === 'pending') {
                            order.status = 'paid';
                        }
                        await order.save();
                    }
                    // ── Trigger shipping workflow ─────────────────
                    await rabbitmq_1.rabbitMQ.publishEvent('payment.success', {
                        paymentId: payment._id.toString(),
                        orderId: payment.order_id.toString(),
                        userId: order?.user_id?.toString(),
                        amount: payment.amount,
                    });
                    return { verified: true, status: 'paid' };
                }
            }
            catch (error) {
                console.error('Stripe session retrieval error:', error.message);
            }
        }
        return { verified: false, status: payment.status };
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map