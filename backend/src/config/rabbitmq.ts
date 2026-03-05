import amqplib from 'amqplib';

const AMQP_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

class RabbitMQConfig {
    connection: any;
    channel: any;
    private connected = false;

    async connect() {
        if (this.connected && this.channel) return;
        try {
            console.log('Connecting to RabbitMQ...');
            this.connection = await amqplib.connect(AMQP_URL);
            this.channel = await this.connection.createChannel();
            this.connected = true;
            console.log('✅ RabbitMQ Connected Successfully');

            // Define exchanges, queues and bindings
            await this.setupQueues();

            // ── Start all workers ───────────────────────────────────────────
            const { startOrderWorkers } = await import('../modules/orders/order.subscriber');
            await startOrderWorkers();

            const { startPaymentWorkers } = await import('../modules/payment/payment.subscriber');
            await startPaymentWorkers();

            const { startBackgroundJobWorkers } = await import('../modules/jobs/job.subscriber');
            await startBackgroundJobWorkers();

        } catch (error) {
            console.error('RabbitMQ Connection Error', error);
        }
    }

    private async setupQueues() {
        // ── Topic exchange — routes events by pattern ────────────────────────
        await this.channel.assertExchange('ecommerce_events', 'topic', { durable: true });

        // ── Queues ──────────────────────────────────────────────────────────
        // 1. Order processing: stock reduction + email confirmation
        await this.channel.assertQueue('order_processing_queue', { durable: true });
        await this.channel.bindQueue('order_processing_queue', 'ecommerce_events', 'order.*');

        // 2. Payment events: payment.success → email + shipping trigger
        await this.channel.assertQueue('payment_queue', { durable: true });
        await this.channel.bindQueue('payment_queue', 'ecommerce_events', 'payment.*');

        // 3. Background jobs: reminders, refund emails, shipping notifications
        await this.channel.assertQueue('background_jobs_queue', { durable: true });
        await this.channel.bindQueue('background_jobs_queue', 'ecommerce_events', 'job.*');

        console.log('📬 RabbitMQ queues ready: order_processing_queue | payment_queue | background_jobs_queue');
    }

    /**
     * Publishes an event to the main ecommerce exchange.
     * @param routingKey Event type, e.g., 'order.created', 'payment.success', 'job.send_reminder'
     * @param data Payload
     */
    async publishEvent(routingKey: string, data: any) {
        if (!this.channel) {
            console.warn('RabbitMQ channel not ready. Trying to reconnect...');
            await this.connect();
        }

        try {
            this.channel.publish(
                'ecommerce_events',
                routingKey,
                Buffer.from(JSON.stringify(data)),
                { persistent: true }
            );
            console.log(`[x] Published event: ${routingKey}`, JSON.stringify(data).slice(0, 80));
        } catch (error) {
            console.error(`Failed to publish event ${routingKey}:`, error);
        }
    }
}

export const rabbitMQ = new RabbitMQConfig();
