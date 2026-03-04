import amqplib from 'amqplib';

const AMQP_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

class RabbitMQConfig {
    connection: any;
    channel: any;
    private connected = false;

    async connect() {
        if (this.connected && this.channel) return;
        try {
            console.log("Connecting to RabbitMQ...");
            this.connection = await amqplib.connect(AMQP_URL);
            this.channel = await this.connection.createChannel();
            this.connected = true;
            console.log("RabbitMQ Connected Successfully");

            // Define the exchanges and queues we will use
            await this.setupQueues();

            // Start workers
            const { startOrderWorkers } = await import('../modules/orders/order.subscriber');
            await startOrderWorkers();
        } catch (error) {
            console.error("RabbitMQ Connection Error", error);
        }
    }

    private async setupQueues() {
        // Assert an exchange to route events
        await this.channel.assertExchange('ecommerce_events', 'topic', { durable: true });

        // Assert queues
        await this.channel.assertQueue('order_processing_queue', { durable: true });

        // Bind queues to exchange based on routing keys
        await this.channel.bindQueue('order_processing_queue', 'ecommerce_events', 'order.*');
    }

    /**
     * Publishes an event to the main ecommerce exchange.
     * @param routingKey Event type, e.g., 'order.created', 'payment.success'
     * @param data Payload
     */
    async publishEvent(routingKey: string, data: any) {
        if (!this.channel) {
            console.warn("RabbitMQ channel not ready. Trying to reconnect...");
            await this.connect();
        }

        try {
            this.channel.publish(
                'ecommerce_events',
                routingKey,
                Buffer.from(JSON.stringify(data)),
                { persistent: true } // Ensure message survives broker restart
            );
            console.log(`[x] Sent event: ${routingKey}`);
        } catch (error) {
            console.error(`Failed to publish event ${routingKey}:`, error);
        }
    }
}

export const rabbitMQ = new RabbitMQConfig();
