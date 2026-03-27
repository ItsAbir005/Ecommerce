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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabbitMQ = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const AMQP_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
class RabbitMQConfig {
    constructor() {
        this.connected = false;
    }
    async connect() {
        if (this.connected && this.channel)
            return;
        try {
            console.log('Connecting to RabbitMQ...');
            this.connection = await amqplib_1.default.connect(AMQP_URL);
            this.channel = await this.connection.createChannel();
            this.connected = true;
            console.log('✅ RabbitMQ Connected Successfully');
            // Define exchanges, queues and bindings
            await this.setupQueues();
            // ── Start all workers ───────────────────────────────────────────
            const { startOrderWorkers } = await Promise.resolve().then(() => __importStar(require('../modules/orders/order.subscriber')));
            await startOrderWorkers();
            const { startPaymentWorkers } = await Promise.resolve().then(() => __importStar(require('../modules/payment/payment.subscriber')));
            await startPaymentWorkers();
            const { startBackgroundJobWorkers } = await Promise.resolve().then(() => __importStar(require('../modules/jobs/job.subscriber')));
            await startBackgroundJobWorkers();
            const { startShipmentWorkers } = await Promise.resolve().then(() => __importStar(require('../modules/shipping/shipment.subscriber')));
            await startShipmentWorkers();
        }
        catch (error) {
            console.error('RabbitMQ Connection Error', error);
        }
    }
    async setupQueues() {
        // ── Topic exchange — routes events by pattern ────────────────────────
        await this.channel.assertExchange('ecommerce_events', 'topic', { durable: true });
        // ── Queues ──────────────────────────────────────────────────────────
        // 1. Order processing: stock reduction + email confirmation
        await this.channel.assertQueue('order_processing_queue', { durable: true });
        await this.channel.bindQueue('order_processing_queue', 'ecommerce_events', 'order.*');
        // 2. Payment events: payment.success → email + shipping trigger
        await this.channel.assertQueue('payment_queue', { durable: true });
        await this.channel.bindQueue('payment_queue', 'ecommerce_events', 'payment.*');
        // 3. Background jobs: reminders, refund emails
        await this.channel.assertQueue('background_jobs_queue', { durable: true });
        await this.channel.bindQueue('background_jobs_queue', 'ecommerce_events', 'job.*');
        // 4. Shipment events: driver assignment
        await this.channel.assertQueue('shipment_queue', { durable: true });
        await this.channel.bindQueue('shipment_queue', 'ecommerce_events', 'shipment.*');
        // 5. Shipment retry queue: messages wait 60s then re-enter shipment_queue via DLX
        //    Used when no driver is available — retry without losing FIFO order.
        await this.channel.assertExchange('shipment_retry_dlx', 'direct', { durable: true });
        await this.channel.assertQueue('shipment_retry_queue', {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': 'ecommerce_events',
                'x-dead-letter-routing-key': 'shipment.created',
                'x-message-ttl': 60000, // 60 seconds before re-entering queue
            },
        });
        console.log('📬 RabbitMQ queues ready: order | payment | background_jobs | shipment | shipment_retry');
    }
    /**
     * Publishes an event to the main ecommerce exchange.
     * @param routingKey Event type, e.g., 'order.created', 'payment.success', 'job.send_reminder'
     * @param data Payload
     */
    async publishEvent(routingKey, data) {
        if (!this.channel) {
            console.warn('RabbitMQ channel not ready. Trying to reconnect...');
            await this.connect();
        }
        try {
            this.channel.publish('ecommerce_events', routingKey, Buffer.from(JSON.stringify(data)), { persistent: true });
            console.log(`[x] Published event: ${routingKey}`, JSON.stringify(data).slice(0, 80));
        }
        catch (error) {
            console.error(`Failed to publish event ${routingKey}:`, error);
        }
    }
}
exports.rabbitMQ = new RabbitMQConfig();
//# sourceMappingURL=rabbitmq.js.map