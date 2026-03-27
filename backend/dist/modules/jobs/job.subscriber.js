"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleReminderEmail = exports.startBackgroundJobWorkers = void 0;
const rabbitmq_1 = require("../../config/rabbitmq");
const Order_1 = require("../../models/Order");
const User_1 = require("../../models/User");
const mail_service_1 = require("../mail/mail.service");
/**
 * Background Job Worker
 * Handles delayed/background tasks from the background_jobs_queue.
 *
 * Events consumed:
 *   - job.send_reminder   → 24h pending order reminder email
 *   - job.process_refund  → send refund confirmation email
 *   - job.shipping_initiated → log shipping (extendable to notify warehouse)
 */
const startBackgroundJobWorkers = async () => {
    try {
        if (!rabbitmq_1.rabbitMQ.channel) {
            console.warn('RabbitMQ channel not initialized for job workers.');
            return;
        }
        console.log('⚙️  Starting Background Job Workers...');
        await rabbitmq_1.rabbitMQ.channel.consume('background_jobs_queue', async (msg) => {
            if (!msg)
                return;
            const routingKey = msg.fields.routingKey;
            const data = JSON.parse(msg.content.toString());
            console.log(`[⬇️] Job Worker received: ${routingKey}`);
            try {
                if (routingKey === 'job.send_reminder') {
                    // ----------------------------------------------------------
                    // 24-hour order reminder
                    // ----------------------------------------------------------
                    const order = await Order_1.Order.findById(data.orderId);
                    if (order && order.status === 'pending') {
                        const user = await User_1.User.findById(data.userId || order.user_id);
                        if (user?.email && user?.notificationSettings?.email !== false) {
                            await (0, mail_service_1.sendReminderEmail)(user.email, user.name, order._id.toString());
                        }
                    }
                    rabbitmq_1.rabbitMQ.channel.ack(msg);
                }
                else if (routingKey === 'job.process_refund') {
                    // ----------------------------------------------------------
                    // Refund confirmation email
                    // ----------------------------------------------------------
                    const order = await Order_1.Order.findById(data.orderId);
                    if (order) {
                        const user = await User_1.User.findById(data.userId || order.user_id);
                        if (user?.email && user?.notificationSettings?.email !== false) {
                            await (0, mail_service_1.sendRefundEmail)(user.email, user.name, order._id.toString(), data.amount ?? order.total_amount);
                        }
                    }
                    rabbitmq_1.rabbitMQ.channel.ack(msg);
                }
                else if (routingKey === 'job.shipping_initiated') {
                    // ----------------------------------------------------------
                    // Shipping initiated → create shipment record → driver assignment
                    // This is the key link: payment → shipping module
                    // ----------------------------------------------------------
                    console.log(`🚚 Shipping initiated for order: ${data.orderId}`);
                    try {
                        const { createShipment } = await Promise.resolve().then(() => __importStar(require('../shipping/shipping.service')));
                        await createShipment(data.orderId);
                    }
                    catch (shipErr) {
                        console.error(`⚠️  Shipment creation failed for order ${data.orderId}:`, shipErr.message);
                    }
                    rabbitmq_1.rabbitMQ.channel.ack(msg);
                }
                else {
                    // Unknown job — ack to avoid poison pill loop
                    console.warn(`Unknown job routing key: ${routingKey}`);
                    rabbitmq_1.rabbitMQ.channel.ack(msg);
                }
            }
            catch (error) {
                console.error(`❌ Background job failed for ${routingKey}:`, error);
                rabbitmq_1.rabbitMQ.channel.nack(msg, false, true);
            }
        });
    }
    catch (error) {
        console.error('Background Job Worker Initialization Error:', error);
    }
};
exports.startBackgroundJobWorkers = startBackgroundJobWorkers;
/**
 * Schedule a reminder email after a delay (e.g., 24 hours after order creation).
 * Uses setTimeout in the producer. In production, use RabbitMQ TTL + DLX for precision.
 */
const scheduleReminderEmail = (userId, orderId, delayMs = 24 * 60 * 60 * 1000) => {
    console.log(`⏰ Reminder scheduled for order ${orderId} in ${delayMs / 1000}s`);
    setTimeout(async () => {
        await rabbitmq_1.rabbitMQ.publishEvent('job.send_reminder', { userId, orderId });
    }, delayMs);
};
exports.scheduleReminderEmail = scheduleReminderEmail;
//# sourceMappingURL=job.subscriber.js.map