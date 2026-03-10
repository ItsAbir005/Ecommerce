import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Driver } from './src/models/Driver';
import { redisClient, connectRedis } from './src/config/redis';
import { findNearestDriver } from './src/modules/drivers/driver.service';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function check() {
    await mongoose.connect(uri);
    await connectRedis();

    const pickupAddressLat = 22.5726; // Kolkata hardcoded in shipping.service.ts
    const pickupAddressLng = 88.3639;

    console.log("Searching for drivers near Kolkata...");
    const driverId = await findNearestDriver(pickupAddressLat, pickupAddressLng, 5000);
    
    if (driverId) {
        console.log(`Found Driver: ${driverId}`);
    } else {
        console.log("No driver found!");
    }

    const allDrivers = await Driver.find({ status: 'online' });
    console.log(`\nOnline drivers in DB: ${allDrivers.length}`);
    for (const d of allDrivers) {
        console.log(`- ${d.name} | Available: ${d.isAvailable} | Loc: ${d.currentLocation?.lat}, ${d.currentLocation?.lng}`);
    }

    // Check Redis GeoSet
    const geoMembers = await redisClient.zRange('drivers:online', 0, -1);
    console.log(`\nDrivers in Redis GeoSet: ${geoMembers.length}`);
    console.log(geoMembers);

    process.exit(0);
}

check().catch(console.error);
