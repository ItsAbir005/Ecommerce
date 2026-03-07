import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Order } from './src/models/Order';
import { createShipment } from './src/modules/shipping/shipping.service';
import { rabbitMQ } from './src/config/rabbitmq';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function run() {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Initialize RabbitMQ publisher so createShipment can publish events
    await rabbitMQ.connect();

    const paidOrders = await Order.find({ status: { $in: ['paid', 'confirmed', 'shipped'] } });
    console.log(`Found ${paidOrders.length} paid/confirmed/shipped orders.`);

    let created = 0;
    for (const order of paidOrders) {
        try {
            const shipment = await createShipment(order._id.toString());
            console.log(`✔️ Processed Order ${order._id} -> Shipment ${shipment.trackingCode}`);
            created++;
        } catch (err: any) {
            console.error(`❌ Failed for Order ${order._id}:`, err.message);
        }
    }

    console.log(`\nDone. Created/Verified ${created} shipments out of ${paidOrders.length} orders.`);

    setTimeout(() => process.exit(0), 2000); // Allow RabbitMQ to flush events
}

run().catch(console.error);
