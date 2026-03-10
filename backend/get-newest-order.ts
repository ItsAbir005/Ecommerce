import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Order } from './src/models/Order';
import * as fs from 'fs';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function check() {
    await mongoose.connect(uri);
    const order = await Order.findOne().sort({ createdAt: -1 }).lean();
    if (order) {
        fs.writeFileSync('newest-order.json', JSON.stringify({
            id: order._id,
            status: order.status,
            payment_status: order.payment_status,
            total: order.total_amount
        }, null, 2));
    }
    process.exit(0);
}

check().catch(console.error);
