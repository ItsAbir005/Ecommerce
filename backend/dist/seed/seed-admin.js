"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("../models/User");
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
async function seedAdmin() {
    await mongoose_1.default.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    const email = process.env.ADMIN_SEED_EMAIL || 'admin@aura.com';
    const password = process.env.ADMIN_SEED_PASSWORD || 'Admin@12345';
    const name = process.env.ADMIN_SEED_NAME || 'Super Admin';
    const existing = await User_1.User.findOne({ email });
    if (existing) {
        if (existing.role === 'admin') {
            console.log(`ℹ️  Admin already exists: ${email}`);
        }
        else {
            // Upgrade existing user to admin
            existing.role = 'admin';
            await existing.save();
            console.log(`🔼 Upgraded ${email} to admin`);
        }
        await mongoose_1.default.disconnect();
        return;
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 12);
    await User_1.User.create({ name, email, password: hashedPassword, role: 'admin' });
    console.log(`
    ✅ Admin account created!
    ─────────────────────────
    Email:    ${email}
    Password: ${password}
    ─────────────────────────
    ⚠️  Change the password after first login!
    `);
    await mongoose_1.default.disconnect();
}
seedAdmin().catch(console.error);
//# sourceMappingURL=seed-admin.js.map