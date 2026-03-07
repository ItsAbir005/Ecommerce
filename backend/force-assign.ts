import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Shipment } from './src/models/Shipment';
import { assignDriver } from './src/modules/shipping/shipping.service';
import { redisClient, connectRedis } from './src/config/redis';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function forceAssign() {
    await mongoose.connect(uri);
    await connectRedis();

    console.log('Finding all pending shipments...');
    const pendingShipments = await Shipment.find({ status: 'pending', driver_id: null });

    console.log(`Found ${pendingShipments.length} dangling pending shipments.`);

    const results: any[] = [];
    for (const shipment of pendingShipments) {
        try {
            const driver = await assignDriver(shipment._id.toString());
            results.push({ id: shipment._id, success: true, driver });
        } catch (e: any) {
            results.push({ id: shipment._id, success: false, error: e.message, stack: e.stack });
        }
    }

    require('fs').writeFileSync('assign-output.json', JSON.stringify(results, null, 2));

    const count = results.filter(r => r.success).length;
    console.log(`\nFinished triggering assignment for ${count} shipments.`);

    // Give async event loops a bit of time
    setTimeout(() => {
        process.exit(0);
    }, 2000);
}

forceAssign().catch(console.error);
