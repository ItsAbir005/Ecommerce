import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Driver } from './src/models/Driver';
import { Order } from './src/models/Order';
import { Shipment } from './src/models/Shipment';
import { redisClient, connectRedis } from './src/config/redis';
import fs from 'fs';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function verifyState() {
    await mongoose.connect(uri);
    await connectRedis();

    const result: any = {};

    result.drivers = await Driver.find({}, 'name status isAvailable').lean();

    // Most recent 3 orders
    result.latestOrders = await Order.find({}).sort({ createdAt: -1 }).limit(3).lean();

    // Most recent 3 shipments
    result.latestShipments = await Shipment.find({}).sort({ createdAt: -1 }).limit(3).lean();

    // Check Redis just in case
    try {
        const GEO_KEY = 'drivers:online'; // Actually I noticed from earlier grep it's drivers:online but wait, let's check both
        const redisDrivers1 = await redisClient.zRange('drivers:online', 0, -1);
        const redisDrivers2 = await redisClient.zRange('driver:locations', 0, -1);
        result.redis_drivers_online = redisDrivers1;
        result.redis_driver_locations = redisDrivers2;
    } catch (e) { }

    fs.writeFileSync('verify.json', JSON.stringify(result, null, 2));
    process.exit(0);
}

verifyState().catch(console.error);
