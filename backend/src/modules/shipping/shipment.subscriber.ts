/**
 * shipment.subscriber.ts
 *
 * Listens to shipment_queue for shipment.created events.
 * Runs the driver assignment logic using Redis GeoSearch.
 *
 * FIFO guarantee:
 * - prefetch(1) ensures only ONE shipment is processed at a time.
 * - If no driver is available, the message is sent to shipment_retry_queue
 *   with a 60s TTL. After 60s it re-enters the main queue via DLX,
 *   maintaining FIFO order relative to other pending shipments.
 * - On server start, any orphaned 'pending' shipments (created but never
 *   assigned, e.g. after a crash) are recovered and re-queued.
 */

import { rabbitMQ } from '../../config/rabbitmq';
import { ConsumeMessage } from 'amqplib';
import { assignDriver } from './shipping.service';
import { Shipment } from '../../models/Shipment';

export const startShipmentWorkers = async () => {
    try {
        if (!rabbitMQ.channel) {
            console.warn('RabbitMQ channel not initialized for shipment workers.');
            return;
        }

        // ── Strict FIFO: process one shipment at a time ──────────────────────
        // Without prefetch(1), multiple workers could pull messages out of
        // order. This ensures assignment respects queue arrival order.
        await rabbitMQ.channel.prefetch(1);

        console.log('🚚 Starting Shipment Workers (FIFO mode)...');

        // ── Recover orphaned pending shipments on restart ────────────────────
        // After a server crash or restart, shipments that were published to the
        // queue but never acked may be lost. Re-queue any still-pending ones.
        const orphaned = await Shipment.find({ status: 'pending', driver_id: { $exists: false } });
        if (orphaned.length > 0) {
            console.log(`🔄 Recovering ${orphaned.length} orphaned pending shipments...`);
            for (const shipment of orphaned) {
                await rabbitMQ.publishEvent('shipment.created', {
                    shipmentId: shipment._id.toString(),
                    orderId: shipment.order_id.toString(),
                    deliveryAddress: shipment.deliveryAddress,
                });
            }
        }

        // ── Main consumer ────────────────────────────────────────────────────
        await rabbitMQ.channel.consume('shipment_queue', async (msg: ConsumeMessage | null) => {
            if (!msg) return;

            const routingKey = msg.fields.routingKey;
            const data = JSON.parse(msg.content.toString());
            const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) as number;

            console.log(`[⬇️] Shipment Worker received: ${routingKey} | shipment=${data.shipmentId} | retry=${retryCount}`);

            if (routingKey === 'shipment.created') {
                try {
                    const shipment = await assignDriver(data.shipmentId);

                    if (shipment?.status === 'pending') {
                        // No driver was available — send to retry queue if under the retry limit.
                        // Max 20 retries = ~20 minutes of waiting before giving up.
                        if (retryCount < 20) {
                            console.warn(`⏳ No driver available for ${data.shipmentId}. Retry ${retryCount + 1}/20 in 60s...`);
                            rabbitMQ.channel.publish(
                                '',                      // default exchange (direct to queue by name)
                                'shipment_retry_queue',
                                Buffer.from(JSON.stringify(data)),
                                {
                                    persistent: true,
                                    headers: { 'x-retry-count': retryCount + 1 },
                                }
                            );
                            rabbitMQ.channel.ack(msg);
                        } else {
                            console.error(`❌ Shipment ${data.shipmentId} exhausted all retries. Marking as failed.`);
                            await Shipment.findByIdAndUpdate(data.shipmentId, { status: 'failed' });
                            rabbitMQ.channel.ack(msg);
                        }
                    } else {
                        // Driver successfully assigned
                        rabbitMQ.channel.ack(msg);
                    }
                } catch (err: any) {
                    console.error(`❌ Failed to process shipment ${data.shipmentId}:`, err.message);
                    // Ack to avoid blocking the queue — the shipment stays
                    // in 'pending' state and will be recovered on next restart.
                    rabbitMQ.channel.ack(msg);
                }
            } else {
                rabbitMQ.channel.ack(msg);
            }
        });

        console.log('✅ Shipment Worker running (FIFO, with retry queue)');
    } catch (error) {
        console.error('Shipment Worker Initialization Error:', error);
    }
};
