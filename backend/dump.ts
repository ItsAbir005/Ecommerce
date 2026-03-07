import fs from 'fs';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function run() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const shipments = await db!.collection('shipments').find({}).toArray();
    const orders = await (db as any).collection('orders').find({ status: { $ne: 'pending' } }).toArray();
    const drivers = await db!.collection('drivers').find({}).toArray();

    const result = { shipments, orders, drivers };
    fs.writeFileSync('db_dump.json', JSON.stringify(result, null, 2));

    process.exit(0);
}

run().catch(console.error);
