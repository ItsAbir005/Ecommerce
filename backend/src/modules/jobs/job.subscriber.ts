import { rabbitMQ } from '../../config/rabbitmq';
import { Order } from '../../models/Order';
import { User } from '../../models/User';
import { ConsumeMessage } from 'amqplib';
import { sendReminderEmail, sendRefundEmail } from '../mail/mail.service';

/**
 * Background Job Worker
 * Handles delayed/background tasks from the background_jobs_queue.
 *
 * Events consumed:
 *   - job.send_reminder   → 24h pending order reminder email
 *   - job.process_refund  → send refund confirmation email
 *   - job.shipping_initiated → log shipping (extendable to notify warehouse)
 */
export const startBackgroundJobWorkers = async () => {
    try {
        if (!rabbitMQ.channel) {
            console.warn('RabbitMQ channel not initialized for job workers.');
            return;
        }

        console.log('⚙️  Starting Background Job Workers...');

        await rabbitMQ.channel.consume('background_jobs_queue', async (msg: ConsumeMessage | null) => {
            if (!msg) return;

            const routingKey = msg.fields.routingKey;
            const data = JSON.parse(msg.content.toString());

            console.log(`[⬇️] Job Worker received: ${routingKey}`);

            try {
                if (routingKey === 'job.send_reminder') {
                    // ----------------------------------------------------------
                    // 24-hour order reminder
                    // ----------------------------------------------------------
                    const order = await Order.findById(data.orderId);
                    if (order && order.status === 'pending') {
                        const user = await User.findById(data.userId || order.user_id);
                        if (user?.email && user?.notificationSettings?.email !== false) {
                            await sendReminderEmail(user.email, user.name, order._id.toString());
                        }
                    }
                    rabbitMQ.channel.ack(msg);

                } else if (routingKey === 'job.process_refund') {
                    // ----------------------------------------------------------
                    // Refund confirmation email
                    // ----------------------------------------------------------
                    const order = await Order.findById(data.orderId);
                    if (order) {
                        const user = await User.findById(data.userId || order.user_id);
                        if (user?.email && user?.notificationSettings?.email !== false) {
                            await sendRefundEmail(
                                user.email,
                                user.name,
                                order._id.toString(),
                                data.amount ?? order.total_amount
                            );
                        }
                    }
                    rabbitMQ.channel.ack(msg);

                } else if (routingKey === 'job.shipping_initiated') {
                    // ----------------------------------------------------------
                    // Shipping initiated — extendable: notify warehouse, 3PL API, etc.
                    // ----------------------------------------------------------
                    console.log(`🚚 Shipping initiated for order: ${data.orderId}`);
                    rabbitMQ.channel.ack(msg);

                } else {
                    // Unknown job — ack to avoid poison pill loop
                    console.warn(`Unknown job routing key: ${routingKey}`);
                    rabbitMQ.channel.ack(msg);
                }
            } catch (error) {
                console.error(`❌ Background job failed for ${routingKey}:`, error);
                rabbitMQ.channel.nack(msg, false, true);
            }
        });
    } catch (error) {
        console.error('Background Job Worker Initialization Error:', error);
    }
};

/**
 * Schedule a reminder email after a delay (e.g., 24 hours after order creation).
 * Uses setTimeout in the producer. In production, use RabbitMQ TTL + DLX for precision.
 */
export const scheduleReminderEmail = (userId: string, orderId: string, delayMs = 24 * 60 * 60 * 1000) => {
    console.log(`⏰ Reminder scheduled for order ${orderId} in ${delayMs / 1000}s`);
    setTimeout(async () => {
        await rabbitMQ.publishEvent('job.send_reminder', { userId, orderId });
    }, delayMs);
};
