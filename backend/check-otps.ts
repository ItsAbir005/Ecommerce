import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Shipment } from './src/models/Shipment';
import { Order } from './src/models/Order';

dotenv.config();
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function check() {
    await mongoose.connect(uri);
    const shipments = await Shipment.find().sort({ createdAt: -1 }).limit(10).lean();

    require('fs').writeFileSync('otps.json', JSON.stringify(shipments.map(s => ({
        trackingCode: s.trackingCode,
        otp: s.otp,
        status: s.status,
        orderId: s.order_id
    })), null, 2));

    process.exit(0);
}

check().catch(console.error);
