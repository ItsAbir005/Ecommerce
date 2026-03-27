"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPaymentWorkers = void 0;
const rabbitmq_1 = require("../../config/rabbitmq");
const Order_1 = require("../../models/Order");
const User_1 = require("../../models/User");
const mail_service_1 = require("../mail/mail.service");
/**
 * Listens to payment_queue for payment.success events.
 * Responsibilities:
 *   - Send payment confirmation email to user
 *   - Trigger shipping initiation job
 */
const startPaymentWorkers = async () => {
    try {
        if (!rabbitmq_1.rabbitMQ.channel) {
            console.warn('RabbitMQ channel not initialized for payment workers.');
            return;
        }
        console.log('💳 Starting Payment Workers...');
        await rabbitmq_1.rabbitMQ.channel.consume('payment_queue', async (msg) => {
            if (!msg)
                return;
            const routingKey = msg.fields.routingKey;
            const data = JSON.parse(msg.content.toString());
            console.log(`[⬇️] Payment Worker received: ${routingKey}`, data.orderId);
            if (routingKey === 'payment.success') {
                try {
                    // Fetch order with user info
                    const order = await Order_1.Order.findById(data.orderId);
                    if (!order) {
                        console.warn(`Order ${data.orderId} not found for payment.success event.`);
                        rabbitmq_1.rabbitMQ.channel.ack(msg);
                        return;
                    }
                    // Fetch user for email — wrapped separately so SMTP failure
                    // doesn't nack the message and cause an infinite retry loop
                    const user = await User_1.User.findById(order.user_id);
                    if (user?.email && user?.notificationSettings?.email !== false) {
                        try {
                            await (0, mail_service_1.sendPaymentSuccessEmail)(user.email, user.name, order._id.toString(), order.total_amount);
                        }
                        catch (emailErr) {
                            console.error(`⚠️  Payment email failed for order ${data.orderId}:`, emailErr.message);
                        }
                    }
                    // Publish downstream job: initiate shipping
                    await rabbitmq_1.rabbitMQ.publishEvent('job.shipping_initiated', {
                        orderId: order._id.toString(),
                        userId: order.user_id.toString(),
                    });
                    rabbitmq_1.rabbitMQ.channel.ack(msg);
                    console.log(`✅ Payment success processed for order: ${data.orderId}`);
                }
                catch (error) {
                    console.error(`❌ Critical failure for payment.success ${data.orderId}:`, error);
                    rabbitmq_1.rabbitMQ.channel.nack(msg, false, false); // do NOT requeue → prevents infinite loop
                }
            }
            else {
                rabbitmq_1.rabbitMQ.channel.ack(msg);
            }
        });
    }
    catch (error) {
        console.error('Payment Worker Initialization Error:', error);
    }
};
exports.startPaymentWorkers = startPaymentWorkers;
//# sourceMappingURL=payment.subscriber.js.map