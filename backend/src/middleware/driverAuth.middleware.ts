import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Driver, IDriver } from '../models/Driver';

export interface DriverRequest extends Request {
    driver?: IDriver;
    headers: Request['headers'];
    body: any;
    params: any;
    query: any;
}

/**
 * Driver-specific JWT middleware.
 * Separate from customer authMiddleware — verifies role === 'driver'.
 */
export const driverAuthMiddleware = async (
    req: DriverRequest,
    res: Response,
    next: NextFunction
): Promise<any> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No driver token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            id: string;
            role: string;
        };

        if (decoded.role !== 'driver') {
            return res.status(403).json({ message: 'Access denied: not a driver account' });
        }

        const driver = await Driver.findById(decoded.id).select('-password');
        if (!driver) {
            return res.status(401).json({ message: 'Driver not found' });
        }

        if (driver.isBlocked) {
            return res.status(403).json({ message: 'Driver account is blocked' });
        }

        req.driver = driver;
        next();
    } catch (err: any) {
        return res.status(401).json({ message: 'Invalid driver token', error: err.message });
    }
};
