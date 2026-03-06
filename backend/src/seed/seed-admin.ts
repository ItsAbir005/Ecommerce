/**
 * seed-admin.ts
 * 
 * One-time script to create the first admin account.
 * Run with: npx ts-node src/seed/seed-admin.ts
 *
 * Set these in your .env first:
 *   ADMIN_SEED_EMAIL=admin@yourapp.com
 *   ADMIN_SEED_PASSWORD=YourStrongPass123
 *   ADMIN_SEED_NAME=Super Admin
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function seedAdmin() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = process.env.ADMIN_SEED_EMAIL || 'admin@aura.com';
    const password = process.env.ADMIN_SEED_PASSWORD || 'Admin@12345';
    const name = process.env.ADMIN_SEED_NAME || 'Super Admin';

    const existing = await User.findOne({ email });
    if (existing) {
        if (existing.role === 'admin') {
            console.log(`ℹ️  Admin already exists: ${email}`);
        } else {
            // Upgrade existing user to admin
            existing.role = 'admin';
            await existing.save();
            console.log(`🔼 Upgraded ${email} to admin`);
        }
        await mongoose.disconnect();
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({ name, email, password: hashedPassword, role: 'admin' });

    console.log(`
    ✅ Admin account created!
    ─────────────────────────
    Email:    ${email}
    Password: ${password}
    ─────────────────────────
    ⚠️  Change the password after first login!
    `);

    await mongoose.disconnect();
}

seedAdmin().catch(console.error);
