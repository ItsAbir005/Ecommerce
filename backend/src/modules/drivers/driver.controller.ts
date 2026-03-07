import { Response } from 'express';
import { Request } from 'express';
import { DriverRequest } from '../../middleware/driverAuth.middleware';
import {
    setDriverStatus,
    updateDriverLocation,
    getActiveDelivery,
    getDeliveryHistory,
    getDriverProfile,
} from './driver.service';
import { Driver } from '../../models/Driver';
import { Notification } from '../../models/Notification';

// GET /api/drivers/me
export const getMe = async (req: DriverRequest, res: Response): Promise<any> => {
    try {
        const driver = await getDriverProfile(req.driver!._id.toString());
        res.json(driver);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/drivers/status  { status: 'online'|'offline', lat, lng }
export const setStatus = async (req: DriverRequest, res: Response): Promise<any> => {
    try {
        const { status, lat, lng } = req.body;
        if (!['online', 'offline'].includes(status)) {
            return res.status(400).json({ message: 'status must be "online" or "offline"' });
        }
        const result = await setDriverStatus(req.driver!._id.toString(), status, lat, lng);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/drivers/location  { lat, lng }
export const updateLocation = async (req: DriverRequest, res: Response): Promise<any> => {
    try {
        const { lat, lng } = req.body;
        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ message: 'lat and lng are required' });
        }
        const result = await updateDriverLocation(req.driver!._id.toString(), lat, lng);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/drivers/delivery/active
export const getActiveDeliveryHandler = async (req: DriverRequest, res: Response): Promise<any> => {
    try {
        const delivery = await getActiveDelivery(req.driver!._id.toString());
        res.json(delivery);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/drivers/delivery/history  — driver's completed deliveries
export const getHistoryHandler = async (req: DriverRequest, res: Response): Promise<any> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const result = await getDeliveryHistory(req.driver!._id.toString(), page);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// ── Admin handlers ────────────────────────────────────────────────────────────

// GET /api/drivers/all  — admin: list all registered drivers
export const getAllDriversHandler = async (_req: Request, res: Response): Promise<any> => {
    try {
        const drivers = await Driver.find({}).select('-password').sort({ createdAt: -1 }).lean();
        res.json(drivers);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/drivers/:id/block  — admin: block or unblock a driver
export const blockDriverHandler = async (req: Request, res: Response): Promise<any> => {
    try {
        const { isBlocked } = req.body;
        const update: any = { isBlocked: !!isBlocked };
        // Force driver offline when blocked
        if (isBlocked) update.status = 'offline';
        const driver = await Driver.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
        if (!driver) return res.status(404).json({ message: 'Driver not found' });
        res.json(driver);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/drivers/:id/approve  — admin: approve a new driver
export const approveDriverHandler = async (req: Request, res: Response): Promise<any> => {
    try {
        const driver = await Driver.findByIdAndUpdate(
            req.params.id,
            { isApproved: true },
            { new: true }
        ).select('-password');

        if (!driver) return res.status(404).json({ message: 'Driver not found' });

        // Mark associated notification as read if it exists
        await Notification.findOneAndUpdate(
            { relatedId: driver._id, type: 'DRIVER_REGISTRATION' },
            { isRead: true }
        );

        res.json({ message: 'Driver approved successfully', driver });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

