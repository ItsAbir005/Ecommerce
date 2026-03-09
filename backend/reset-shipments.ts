import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Shipment } from './src/models/Shipment';
import { Driver } from './src/models/Driver';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function reset() {
    await mongoose.connect(uri);

    // Any shipments that were stuck in "assigned", "picked_up", or "out_for_delivery"
    // from previous bugs are now failed so the driver doesn't automatically resume them
    const result = await Shipment.updateMany(
        { status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] } },
        { status: 'failed', driver_id: null }
    );

    // Also reset the drivers themselves so they are free to accept new packages
    await Driver.updateMany(
        {},
        { status: 'online', isAvailable: true }
    );

    console.log(`Reset ${result.modifiedCount} stuck shipments`);
    process.exit(0);
}

reset().catch(console.error);
