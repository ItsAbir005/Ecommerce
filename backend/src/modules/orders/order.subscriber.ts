import { rabbitMQ } from '../../config/rabbitmq';
import { Product } from '../../models/Product';
import { Order } from '../../models/Order';
import { ConsumeMessage } from 'amqplib';

export const startOrderWorkers = async () => {
    try {
        if (!rabbitMQ.channel) {
            console.warn("RabbitMQ channel not initialized yet for workers.");
            return;
        }

        console.log("🛠️ Starting Order Processing Workers...");

        // Consume 'order_processing_queue'
        await rabbitMQ.channel.consume('order_processing_queue', async (msg: ConsumeMessage | null) => {
            if (!msg) return;

            const routingKey = msg.fields.routingKey;
            const content = msg.content.toString();
            const data = JSON.parse(content);

            console.log(`[⬇️] Received Event: ${routingKey}`);

            if (routingKey === 'order.created') {
                try {
                    console.log(`Processing stock reservation for Order: ${data.orderId}`);

                    // ── Handle Stock Reservation ──
                    for (const item of data.items) {
                        if (item.variant_id) {
                            await Product.updateOne(
                                { _id: item.product_id, "variants._id": item.variant_id },
                                { $inc: { "variants.$.stock": -item.quantity } }
                            );
                        } else {
                            await Product.findByIdAndUpdate(item.product_id, { $inc: { stock: -item.quantity } });
                        }
                    }

                    // ── Simulate Email Sending ──
                    console.log(`📧 Sending confirmation email to user: ${data.userId}`);
                    // e.g. await emailService.sendOrderConfirmation(data.userId, data.orderId);

                    // Acknowledge the message so it's removed from the queue
                    rabbitMQ.channel.ack(msg);
                    console.log(`✅ Order ${data.orderId} processed successfully!`);
                } catch (error) {
                    console.error(`❌ Failed to process order.created for ${data.orderId}:`, error);
                    // Nack with requeue if it should be retried, or false if it should go to a Dead Letter Queue
                    rabbitMQ.channel.nack(msg, false, true);
                }
            } else {
                // Ignore other events in this worker
                rabbitMQ.channel.ack(msg);
            }
        });
    } catch (error) {
        console.error("Order Worker Initialization Error:", error);
    }
};
