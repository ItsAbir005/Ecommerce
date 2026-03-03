import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { Order } from '../../models/Order';

export const initializePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { order_id } = req.body;
        if (!order_id) {
            res.status(400).json({ success: false, message: 'order_id is required' });
            return;
        }

        const order = await Order.findById(order_id);
        if (!order) {
            res.status(404).json({ success: false, message: 'Order not found' });
            return;
        }

        if (order.payment_status === 'paid') {
            res.status(400).json({ success: false, message: 'Order is already paid' });
            return;
        }

        const session = await PaymentService.createCheckoutSession(
            order._id.toString(),
            order.total_amount,
            'usd' // You can make this dynamic if needed
        );

        res.status(200).json({
            success: true,
            checkout_url: session.url,
            session_id: session.id,
        });

    } catch (error: any) {
        console.error('Payment initialization error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

export const webhook = async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('Stripe webhook secret is not set.');
        res.status(500).send('Webhook secret not configured in the environment.');
        return;
    }

    if (!signature) {
        res.status(400).send('No signature found in headers.');
        return;
    }

    try {
        // Express must be configured to pass the raw body to this endpoint
        await PaymentService.handleWebhookEvent(req.body, signature, webhookSecret);
        res.status(200).json({ received: true });
    } catch (err: any) {
        console.error('Webhook processing failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

export const refund = async (req: Request, res: Response): Promise<void> => {
    try {
        const payment_id = req.params.payment_id as string;
        const refundResult = await PaymentService.processRefund(payment_id);

        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            data: refundResult,
        });
    } catch (error: any) {
        console.error('Refund error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};
