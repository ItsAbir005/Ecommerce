import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Shipment } from './src/models/Shipment';
import { rabbitMQ } from './src/config/rabbitmq';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function sweepPending() {
    await mongoose.connect(uri);
    await rabbitMQ.connect();

    console.log('Finding all pending shipments...');
    const pendingShipments = await Shipment.find({ status: 'pending', driver_id: null });

    console.log(`Found ${pendingShipments.length} pending shipments.`);

    for (const shipment of pendingShipments) {
        console.log(`Pushing shipment ${shipment.trackingCode} back into RabbitMQ...`);
        await rabbitMQ.publishEvent('shipment.created', {
            shipmentId: shipment._id.toString(),
            orderId: shipment.order_id.toString(),
            deliveryAddress: shipment.deliveryAddress,
        });
    }

    console.log(`\nFinished triggering RabbitMQ for ${pendingShipments.length} shipments.`);

    setTimeout(() => {
        process.exit(0);
    }, 2000);
}

sweepPending().catch(console.error);
