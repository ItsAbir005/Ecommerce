import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Shipment } from './src/models/Shipment';
import * as fs from 'fs';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function check() {
    await mongoose.connect(uri);
    const shipment = await Shipment.findOne({ trackingCode: 'TRK2C84B1BC' }).lean();
    if (shipment) {
        fs.writeFileSync('trk-otp.json', JSON.stringify({ otp: shipment.otp }, null, 2));
    } else {
        fs.writeFileSync('trk-otp.json', JSON.stringify({ error: 'Not found' }));
    }
    process.exit(0);
}

check().catch(console.error);
