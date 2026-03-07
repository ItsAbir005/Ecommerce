import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function run() {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const shipments = await db!.collection('shipments').find({}).toArray();
    console.log('--- SHIPMENTS ---');
    console.log(JSON.stringify(shipments, null, 2));

    const orders = await (db as any).collection('orders').find({ status: { $ne: 'pending' } }).toArray();
    console.log('\n--- PAID/SHIPPED ORDERS ---');
    console.log(JSON.stringify(orders.slice(-5), null, 2)); // Last 5

    const drivers = await db!.collection('drivers').find({}).toArray();
    console.log('\n--- DRIVERS ---');
    console.log(JSON.stringify(drivers.map(d => ({ name: d.name, status: d.status, isAvailable: d.isAvailable, loc: d.currentLocation })), null, 2));

    process.exit(0);
}

run().catch(console.error);
