/**
 * driver.service.ts
 *
 * Core driver business logic:
 * - Go online/offline (updates Redis GeoSet for proximity search)
 * - Update location (Redis GEOADD)
 * - Get active delivery, history
 * - Driver assignment via GeoSearch (nearest available driver within radius)
 */

import { Driver } from '../../models/Driver';
import { Shipment } from '../../models/Shipment';
import { redisClient } from '../../config/redis';

const GEO_KEY = 'drivers:online'; // Redis GeoSet key

// ── Go Online / Offline ───────────────────────────────────────────────────────
export const setDriverStatus = async (
    driverId: string,
    status: 'online' | 'offline',
    lat?: number,
    lng?: number
) => {
    const driver = await Driver.findById(driverId);
    if (!driver) throw new Error('Driver not found');

    driver.status = status === 'online' ? 'online' : 'offline';
    driver.isAvailable = status === 'online';

    if (status === 'online' && lat !== undefined && lng !== undefined) {
        driver.currentLocation = { lat, lng, updatedAt: new Date() };
        // Add to Redis GeoSet so we can find this driver by proximity
        await redisClient.geoAdd(GEO_KEY, { longitude: lng, latitude: lat, member: driverId });
    }

    if (status === 'offline') {
        // Remove from GeoSet so they don't get assigned
        await redisClient.zRem(GEO_KEY, driverId);
    }

    await driver.save();
    return { status: driver.status, isAvailable: driver.isAvailable };
};

// ── Update Location (called periodically from driver app) ─────────────────────
export const updateDriverLocation = async (driverId: string, lat: number, lng: number) => {
    await Driver.findByIdAndUpdate(driverId, {
        'currentLocation.lat': lat,
        'currentLocation.lng': lng,
        'currentLocation.updatedAt': new Date(),
    });
    // Update position in Redis GeoSet
    await redisClient.geoAdd(GEO_KEY, { longitude: lng, latitude: lat, member: driverId });
    return { lat, lng };
};

// ── Find Nearest Available Driver ─────────────────────────────────────────────
// Returns the closest online driver within `radiusKm` of the given coordinates.
// Uses Redis GEOSEARCH to get member IDs sorted nearest-first, then
// verifies each driver is still online+available in MongoDB.
export const findNearestDriver = async (
    lat: number,
    lng: number,
    radiusKm: number = 50
): Promise<string | null> => {
    // geoSearchWith returns array of { member: string, distance: number }
    const results = await redisClient.geoSearchWith(
        GEO_KEY,
        { longitude: lng, latitude: lat },
        { radius: radiusKm, unit: 'km' },
        ['WITHDIST'],
        { SORT: 'ASC', COUNT: 10 }
    );
    const driverIds = results.map(r => r.member);

    console.log(`[GEO] Found ${driverIds.length} candidate drivers within ${radiusKm}km`);

    // Verify each candidate is still online + available in DB (Redis can be stale)
    for (const driverId of driverIds) {
        const driver = await Driver.findOne({ _id: driverId, status: 'online', isAvailable: true });
        if (driver) {
            console.log(`[GEO] Selected available driver: ${driverId}`);
            return driverId;
        } else {
            console.log(`[GEO] Driver ${driverId} found in Redis but skipped (offline/busy in DB)`);
        }
    }
    return null;
};

// ── Get Driver's Active Delivery ──────────────────────────────────────────────
export const getActiveDelivery = async (driverId: string) => {
    return Shipment.findOne({
        driver_id: driverId,
        status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] },
    }).populate('order_id', 'total_amount order_items');
};

// ── Get Completed Deliveries ──────────────────────────────────────────────────
export const getDeliveryHistory = async (driverId: string, page = 1, limit = 20) => {
    const total = await Shipment.countDocuments({ driver_id: driverId, status: 'delivered' });
    const deliveries = await Shipment.find({ driver_id: driverId, status: 'delivered' })
        .sort({ deliveredAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('order_id', 'total_amount createdAt');
    return { deliveries, total, page, pages: Math.ceil(total / limit) };
};

// ── Get Driver Profile ────────────────────────────────────────────────────────
export const getDriverProfile = async (driverId: string) => {
    return Driver.findById(driverId).select('-password');
};
