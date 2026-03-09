import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Shipment } from './src/models/Shipment';
import { Order } from './src/models/Order';
import { User } from './src/models/User';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aura_db';

async function check() {
    await mongoose.connect(uri);

    // Find the specific shipment the user mentioned
    const shipment = await Shipment.findOne({ trackingCode: 'TRKD6E63F61' }).lean();
    if (!shipment) {
        console.log("Shipment TRKD6E63F61 not found in DB.");

        // Find if the driver has ANY active shipment
        const activeShipment = await Shipment.findOne({ status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] } }).lean();
        if (activeShipment) {
            console.log(`Driver actually has active shipment: ${activeShipment.trackingCode} with OTP: ${activeShipment.otp}`);
            const order = await Order.findById(activeShipment.order_id).lean();
            if (order) {
                const user = await User.findById(order.user_id).lean();
                console.log(`Order User Email: ${user?.email}`);
            }
        }
        process.exit(0);
    }

    console.log(`Found Shipment: ${shipment.trackingCode}`);
    console.log(`OTP for this shipment is: ${shipment.otp}`);
    console.log(`Order ID: ${shipment.order_id}`);

    const order = await Order.findById(shipment.order_id).lean();
    if (order) {
        console.log(`Order User ID: ${order.user_id}`);
        const user = await User.findById(order.user_id).lean();
        console.log(`Order User Email: ${user?.email}`);
    } else {
        console.log("Order not found in DB! It might have been deleted.");
    }

    process.exit(0);
}

check().catch(console.error);
