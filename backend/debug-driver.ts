import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Driver } from './src/models/Driver';
import { redisClient, connectRedis } from './src/config/redis';
import fs from 'fs';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function checkDrivers() {
    await mongoose.connect(uri);
    await connectRedis();

    const result: any = {};

    const allDrivers = await Driver.find({}, 'name isOnline status currentLocation').lean();
    result.mongoDrivers = allDrivers;

    try {
        const GEO_KEY = 'driver:locations';
        const redisDrivers = await redisClient.zRange(GEO_KEY, 0, -1);
        result.redisDriverIds = redisDrivers;

        result.redisDriversDetails = [];
        for (const driverId of redisDrivers) {
            const coords = await redisClient.geoPos(GEO_KEY, driverId);
            const statusKey = `driver:${driverId}:status`;
            const status = await redisClient.get(statusKey);
            result.redisDriversDetails.push({ driverId, longitude: coords?.[0]?.longitude, latitude: coords?.[0]?.latitude, status });
        }

        const pickupLat = 22.5726;
        const pickupLng = 88.3639;

        const nearbyDrivers = await redisClient.geoSearchWith(
            GEO_KEY,
            { longitude: pickupLng, latitude: pickupLat },
            { radius: 5000, unit: 'km' },
            ['WITHDIST'],
            { SORT: 'ASC' }
        );

        result.nearbyDrivers = nearbyDrivers;
    } catch (e: any) {
        result.error = e.message;
    }

    fs.writeFileSync('debug.json', JSON.stringify(result, null, 2));
    process.exit(0);
}

checkDrivers().catch(console.error);
