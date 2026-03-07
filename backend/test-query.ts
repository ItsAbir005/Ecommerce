import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Driver } from './src/models/Driver';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function check() {
    await mongoose.connect(uri);

    // The exact query findNearestDriver uses
    const query = { _id: "69ac3617441d87414f614f3b", status: 'online', isAvailable: true };
    const driver = await Driver.findOne(query);

    // And print the actual DB object regardless of query
    const realDriver = await Driver.findById("69ac3617441d87414f614f3b").lean();

    require('fs').writeFileSync('test-query-output.json', JSON.stringify({
        matchedStrictQuery: !!driver,
        realDB_driverObj: realDriver
    }, null, 2));

    process.exit(0);
}

check().catch(console.error);
