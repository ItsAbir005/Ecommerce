import { Response } from 'express';
import { Request } from 'express';
import { DriverRequest } from '../../middleware/driverAuth.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
    getShipmentByOrder,
    updateShipmentStatus,
    confirmDelivery,
    acceptDelivery,
    rejectDelivery,
} from './shipping.service';
import { ShipmentStatus } from '../../models/Shipment';

// GET /api/shipping/order/:orderId  — customer tracking
export const getTracking = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const shipment = await getShipmentByOrder(req.params.orderId as string);
        if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
        res.json(shipment);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/shipping/:id/status  — driver updates status
export const updateStatus = async (req: DriverRequest, res: Response): Promise<any> => {
    try {
        const { status } = req.body;
        const validStatuses: ShipmentStatus[] = ['picked_up', 'out_for_delivery', 'failed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Status must be one of: ${validStatuses.join(', ')}`,
            });
        }
        const shipment = await updateShipmentStatus(
            req.params.id as string,
            req.driver!._id.toString(),
            status
        );
        res.json(shipment);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};

// POST /api/shipping/:id/confirm-delivery  — driver submits OTP
export const confirmDeliveryHandler = async (req: DriverRequest, res: Response): Promise<any> => {
    try {
        const { otp } = req.body;
        if (!otp) return res.status(400).json({ message: 'OTP is required' });
        const shipment = await confirmDelivery(
            req.params.id as string,
            req.driver!._id.toString(),
            otp
        );
        res.json({ message: 'Delivery confirmed!', shipment });
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};

// POST /api/shipping/:id/accept  — driver accepts delivery
export const acceptDeliveryHandler = async (req: DriverRequest, res: Response): Promise<any> => {
    try {
        const shipment = await acceptDelivery(
            req.params.id as string,
            req.driver!._id.toString()
        );
        res.json(shipment);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};

// POST /api/shipping/:id/reject  — driver rejects delivery so it can be re-assigned
export const rejectDeliveryHandler = async (req: DriverRequest, res: Response): Promise<any> => {
    try {
        const shipment = await rejectDelivery(
            req.params.id as string,
            req.driver!._id.toString()
        );
        res.json(shipment);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};
