"use strict";
/**
 * driver.service.ts
 *
 * Core driver business logic:
 * - Go online/offline (updates Redis GeoSet for proximity search)
 * - Update location (Redis GEOADD)
 * - Get active delivery, history
 * - Driver assignment via GeoSearch (nearest available driver within radius)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriverProfile = exports.getDeliveryHistory = exports.getActiveDelivery = exports.findNearestDriver = exports.updateDriverLocation = exports.setDriverStatus = void 0;
const Driver_1 = require("../../models/Driver");
const Shipment_1 = require("../../models/Shipment");
const redis_1 = require("../../config/redis");
const GEO_KEY = 'drivers:online'; // Redis GeoSet key
// ── Go Online / Offline ───────────────────────────────────────────────────────
const setDriverStatus = async (driverId, status, lat, lng) => {
    const driver = await Driver_1.Driver.findById(driverId);
    if (!driver)
        throw new Error('Driver not found');
    driver.status = status === 'online' ? 'online' : 'offline';
    driver.isAvailable = status === 'online';
    if (status === 'online' && lat !== undefined && lng !== undefined) {
        driver.currentLocation = { lat, lng, updatedAt: new Date() };
        // Add to Redis GeoSet so we can find this driver by proximity
        await redis_1.redisClient.geoAdd(GEO_KEY, { longitude: lng, latitude: lat, member: driverId });
    }
    if (status === 'offline') {
        // Remove from GeoSet so they don't get assigned
        await redis_1.redisClient.zRem(GEO_KEY, driverId);
    }
    await driver.save();
    return { status: driver.status, isAvailable: driver.isAvailable };
};
exports.setDriverStatus = setDriverStatus;
// ── Update Location (called periodically from driver app) ─────────────────────
const updateDriverLocation = async (driverId, lat, lng) => {
    await Driver_1.Driver.findByIdAndUpdate(driverId, {
        'currentLocation.lat': lat,
        'currentLocation.lng': lng,
        'currentLocation.updatedAt': new Date(),
    });
    // Update position in Redis GeoSet
    await redis_1.redisClient.geoAdd(GEO_KEY, { longitude: lng, latitude: lat, member: driverId });
    return { lat, lng };
};
exports.updateDriverLocation = updateDriverLocation;
// ── Find Nearest Available Driver ─────────────────────────────────────────────
// Returns the closest online driver within `radiusKm` of the given coordinates.
// Uses Redis GEOSEARCH to get member IDs sorted nearest-first, then
// verifies each driver is still online+available in MongoDB.
const findNearestDriver = async (lat, lng, radiusKm = 50) => {
    // geoSearchWith returns array of { member: string, distance: number }
    const results = await redis_1.redisClient.geoSearchWith(GEO_KEY, { longitude: lng, latitude: lat }, { radius: radiusKm, unit: 'km' }, ['WITHDIST'], { SORT: 'ASC', COUNT: 10 });
    const driverIds = results.map(r => r.member);
    console.log(`[GEO] Found ${driverIds.length} candidate drivers within ${radiusKm}km`);
    // Verify each candidate is still online + available in DB (Redis can be stale)
    for (const driverId of driverIds) {
        const driver = await Driver_1.Driver.findOne({ _id: driverId, status: 'online', isAvailable: true });
        if (driver) {
            console.log(`[GEO] Selected available driver: ${driverId}`);
            return driverId;
        }
        else {
            console.log(`[GEO] Driver ${driverId} found in Redis but skipped (offline/busy in DB)`);
        }
    }
    return null;
};
exports.findNearestDriver = findNearestDriver;
// ── Get Driver's Active Delivery ──────────────────────────────────────────────
const getActiveDelivery = async (driverId) => {
    return Shipment_1.Shipment.findOne({
        driver_id: driverId,
        status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] },
    }).populate('order_id', 'total_amount order_items');
};
exports.getActiveDelivery = getActiveDelivery;
// ── Get Completed Deliveries ──────────────────────────────────────────────────
const getDeliveryHistory = async (driverId, page = 1, limit = 20) => {
    const total = await Shipment_1.Shipment.countDocuments({ driver_id: driverId, status: 'delivered' });
    const deliveries = await Shipment_1.Shipment.find({ driver_id: driverId, status: 'delivered' })
        .sort({ deliveredAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('order_id', 'total_amount createdAt');
    return { deliveries, total, page, pages: Math.ceil(total / limit) };
};
exports.getDeliveryHistory = getDeliveryHistory;
// ── Get Driver Profile ────────────────────────────────────────────────────────
const getDriverProfile = async (driverId) => {
    return Driver_1.Driver.findById(driverId).select('-password');
};
exports.getDriverProfile = getDriverProfile;
//# sourceMappingURL=driver.service.js.map