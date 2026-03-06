/**
 * shipment.subscriber.ts
 * Listens to shipment_queue for shipment.created events.
 * Runs the driver assignment logic using Redis GeoSearch.
 */

import { rabbitMQ } from '../../config/rabbitmq';
import { ConsumeMessage } from 'amqplib';
import { assignDriver } from './shipping.service';

export const startShipmentWorkers = async () => {
    try {
        if (!rabbitMQ.channel) {
            console.warn('RabbitMQ channel not initialized for shipment workers.');
            return;
        }

        console.log('🚚 Starting Shipment Workers...');

        await rabbitMQ.channel.consume('shipment_queue', async (msg: ConsumeMessage | null) => {
            if (!msg) return;

            const routingKey = msg.fields.routingKey;
            const data = JSON.parse(msg.content.toString());

            console.log(`[⬇️] Shipment Worker received: ${routingKey}`, data.shipmentId);

            if (routingKey === 'shipment.created') {
                try {
                    // Attempt to assign nearest available driver
                    await assignDriver(data.shipmentId);
                    rabbitMQ.channel.ack(msg);
                } catch (err: any) {
                    console.error(`❌ Failed to assign driver for shipment ${data.shipmentId}:`, err.message);
                    // Nack without requeue — don't loop forever; manual retry via admin
                    rabbitMQ.channel.nack(msg, false, false);
                }
            } else {
                rabbitMQ.channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Shipment Worker Initialization Error:', error);
    }
};
