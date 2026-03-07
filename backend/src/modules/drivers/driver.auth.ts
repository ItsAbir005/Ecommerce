/**
 * driver.auth.ts
 * Driver registration and login handlers.
 * Separate from customer auth — uses role: 'driver' in JWT.
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Driver } from '../../models/Driver';
import { Notification } from '../../models/Notification';

const signToken = (id: string) =>
    jwt.sign({ id, role: 'driver' }, process.env.JWT_SECRET as string, {
        expiresIn: '7d',
    });

// ── POST /api/drivers/register ────────────────────────────────────────────────
export const registerDriver = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, email, password, phone, vehicleNumber, vehicleType, licenseNumber } = req.body;

        if (!name || !email || !password || !phone || !vehicleNumber || !licenseNumber) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const exists = await Driver.findOne({ email });
        if (exists) return res.status(409).json({ message: 'Email already registered' });

        const driver = await Driver.create({
            name, email, password, phone,
            vehicleNumber, vehicleType: vehicleType || 'bike', licenseNumber,
        });

        // Create an admin notification instead of sending back a token for auto-login
        await Notification.create({
            type: 'DRIVER_REGISTRATION',
            message: `New driver registration: ${name} (${vehicleType || 'bike'})`,
            relatedId: driver._id,
            metadata: {
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                vehicleType: driver.vehicleType,
                vehicleNumber: driver.vehicleNumber,
                licenseNumber: driver.licenseNumber,
            },
        });

        res.status(201).json({
            message: 'Registration successful. Account pending admin approval.',
            driver: {
                id: driver._id,
                name: driver.name,
                email: driver.email,
                vehicleType: driver.vehicleType,
                status: driver.status,
            },
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/drivers/login ───────────────────────────────────────────────────
export const loginDriver = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const driver = await Driver.findOne({ email });
        if (!driver) return res.status(401).json({ message: 'Invalid credentials' });

        if (!driver.isApproved) return res.status(403).json({ message: 'Account is pending admin approval' });
        if (driver.isBlocked) return res.status(403).json({ message: 'Account is blocked' });

        const valid = await driver.comparePassword(password);
        if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

        const token = signToken(driver._id.toString());
        res.json({
            token,
            driver: {
                id: driver._id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                vehicleNumber: driver.vehicleNumber,
                vehicleType: driver.vehicleType,
                status: driver.status,
                isAvailable: driver.isAvailable,
            },
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
