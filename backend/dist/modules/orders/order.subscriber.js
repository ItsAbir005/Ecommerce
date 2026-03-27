"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOrderWorkers = void 0;
const rabbitmq_1 = require("../../config/rabbitmq");
const Product_1 = require("../../models/Product");
const User_1 = require("../../models/User");
const mail_service_1 = require("../mail/mail.service");
const job_subscriber_1 = require("../jobs/job.subscriber");
/**
 * Order Worker
 *
 * Listens to order_processing_queue (routing: order.*)
 *
 * order.created:
 *   1. Reduce product stock
 *   2. Send order confirmation email via Nodemailer
 *   3. Schedule 24h reminder if order stays pending
 */
const startOrderWorkers = async () => {
    try {
        if (!rabbitmq_1.rabbitMQ.channel) {
            console.warn('RabbitMQ channel not initialized yet for order workers.');
            return;
        }
        console.log('🛠️  Starting Order Processing Workers...');
        await rabbitmq_1.rabbitMQ.channel.consume('order_processing_queue', async (msg) => {
            if (!msg)
                return;
            const routingKey = msg.fields.routingKey;
            const data = JSON.parse(msg.content.toString());
            console.log(`[⬇️] Order Worker received: ${routingKey} | orderId: ${data.orderId}`);
            if (routingKey === 'order.created') {
                try {
                    // ── Stock Deduction ─────────────────────────────────────
                    // Stock is now atomically locked in order.service.ts at checkout.
                    // Skip deduction here to avoid double-deduction.
                    // Legacy path kept for backward compat if flag is absent.
                    if (!data.stockAlreadyLocked) {
                        for (const item of data.items) {
                            if (item.variant_id) {
                                await Product_1.Product.updateOne({ _id: item.product_id, 'variants._id': item.variant_id }, { $inc: { 'variants.$.stock': -item.quantity } });
                            }
                            else {
                                await Product_1.Product.findByIdAndUpdate(item.product_id, { $inc: { stock: -item.quantity } });
                            }
                        }
                        console.log(`📦 Stock deducted (legacy) for order: ${data.orderId}`);
                    }
                    else {
                        console.log(`📦 Stock already locked atomically at checkout for order: ${data.orderId} ✓`);
                    }
                    // ── Email via Nodemailer (best-effort, wrapped separately) ─
                    // IMPORTANT: Email failures must NOT nack the message.
                    // A nack with requeue=true would cause an infinite retry loop.
                    // Email is a side-effect — stock is the critical operation.
                    const user = await User_1.User.findById(data.userId);
                    if (user?.email && user?.notificationSettings?.email !== false) {
                        try {
                            await (0, mail_service_1.sendOrderConfirmation)(user.email, user.name, data.orderId, data.items.map((i) => ({
                                title: i.title,
                                quantity: i.quantity,
                                price: i.price,
                            })), data.totalAmount);
                        }
                        catch (emailErr) {
                            // Log but DON'T rethrow — email failure is non-critical
                            console.error(`⚠️  Email failed for order ${data.orderId} (SMTP unavailable?):`, emailErr.message);
                            console.warn('💡 Tip: Start MailHog with: docker-compose -f docker-compose.dev.yml up -d mailhog');
                        }
                    }
                    // ── Schedule 24h reminder ────────────────────────────────
                    const reminderDelay = process.env.NODE_ENV === 'production'
                        ? 24 * 60 * 60 * 1000
                        : 2 * 60 * 1000; // 2 min in dev for testing
                    (0, job_subscriber_1.scheduleReminderEmail)(data.userId, data.orderId, reminderDelay);
                    // Always ack — stock was handled, email is best-effort
                    rabbitmq_1.rabbitMQ.channel.ack(msg);
                    console.log(`✅ Order ${data.orderId} processed (stock ✓, email best-effort, reminder scheduled)`);
                }
                catch (error) {
                    // Only non-email errors reach here (e.g. DB failure during stock deduction)
                    // nack with requeue=false → message goes to Dead Letter Queue (not retried infinitely)
                    console.error(`❌ Critical failure processing order.created for ${data.orderId}:`, error);
                    rabbitmq_1.rabbitMQ.channel.nack(msg, false, false); // false = do NOT requeue → prevents infinite loop
                }
            }
            else {
                // Unknown routing key under order.* — safely ack
                rabbitmq_1.rabbitMQ.channel.ack(msg);
            }
        });
    }
    catch (error) {
        console.error('Order Worker Initialization Error:', error);
    }
};
exports.startOrderWorkers = startOrderWorkers;
//# sourceMappingURL=order.subscriber.js.map