/**
 * order.service.ts
 * Handles the full order lifecycle. Never touches payments directly.
 */

import mongoose from 'mongoose';
import { Order, OrderStatus } from '../../models/Order';
import { Cart } from '../../models/Cart';
import { Product } from '../../models/Product';

const TAX_RATE = 0.08;
const FREE_SHIPPING = 50;
const SHIPPING_COST = 5.99;

// ── Valid status transitions ───────────────────────────────────────────────────
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['paid', 'cancelled'],
    paid: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['returned'],
    cancelled: [],
    returned: [],
};

// ── 1. Create Order from Cart ─────────────────────────────────────────────────
export const createOrder = async (userId: string, shippingAddress: {
    street: string; city: string; state: string; zip: string; country: string;
}) => {
    const cart = await Cart.findOne({ user_id: userId }).populate<{
        items: Array<{
            _id: mongoose.Types.ObjectId;
            product_id: any;
            variant_id?: mongoose.Types.ObjectId;
            quantity: number;
            price_at_addition: number;
        }>;
    }>({ path: 'items.product_id', select: 'title price discount stock images variants' });

    if (!cart || cart.items.length === 0) throw new Error('Cart is empty');

    // ── Validate stock + build order items ────────────────────────────────────
    const orderItems = [];
    let subtotal = 0;
    let discountAmount = 0;

    for (const item of cart.items) {
        const product = item.product_id;
        if (!product) throw new Error('A product in your cart no longer exists');

        const available = item.variant_id
            ? product.variants?.find((v: any) => v._id?.toString() === item.variant_id?.toString())?.stock ?? 0
            : product.stock;

        if (available < item.quantity)
            throw new Error(`Insufficient stock for "${product.title}". Only ${available} left.`);

        const originalPrice = product.price;
        const discountedPrice = product.discount > 0
            ? parseFloat((originalPrice * (1 - product.discount / 100)).toFixed(2))
            : originalPrice;

        const lineOriginal = originalPrice * item.quantity;
        const lineDiscounted = discountedPrice * item.quantity;

        subtotal += lineDiscounted;
        discountAmount += (lineOriginal - lineDiscounted);

        orderItems.push({
            product_id: product._id,
            variant_id: item.variant_id ?? undefined,
            title: product.title,
            image: product.images?.[0] ?? '',
            price: discountedPrice,
            discount: product.discount ?? 0,
            quantity: item.quantity,
        });
    }

    // ── Temporarily reserve stock (soft reserve — permanent on payment) ────────
    for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product_id, { $inc: { stock: -item.quantity } });
    }

    const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_COST;
    const total = parseFloat((subtotal + tax + shipping).toFixed(2));

    const order = await Order.create({
        user_id: userId,
        order_items: orderItems,
        shipping_address: shippingAddress,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        tax_amount: tax,
        shipping_cost: shipping,
        total_amount: total,
        status: 'pending',
        payment_status: 'unpaid',
    });

    // ── Clear cart ────────────────────────────────────────────────────────────
    await Cart.findOneAndUpdate({ user_id: userId }, { $set: { items: [] } });

    return order;
};

// ── 2. Get User Orders (paginated) ────────────────────────────────────────────
export const getMyOrders = async (userId: string, page = 1, limit = 10, status?: string) => {
    const query: any = { user_id: userId };
    if (status) query.status = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return { orders, total, page, pages: Math.ceil(total / limit) };
};

// ── 3. Get Single Order ───────────────────────────────────────────────────────
export const getOrderById = async (orderId: string, userId: string, isAdmin = false) => {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new Error('Order not found');
    if (!isAdmin && order.user_id.toString() !== userId) throw new Error('Not your order');
    return order;
};

// ── 4. Cancel Order ───────────────────────────────────────────────────────────
export const cancelOrder = async (orderId: string, userId: string, reason?: string) => {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.user_id.toString() !== userId) throw new Error('Not your order');

    const cancellable: OrderStatus[] = ['pending', 'confirmed'];
    if (!cancellable.includes(order.status)) {
        throw new Error(`Cannot cancel an order with status "${order.status}"`);
    }

    // Restore stock
    for (const item of order.order_items) {
        await Product.findByIdAndUpdate(item.product_id, { $inc: { stock: item.quantity } });
    }

    order.status = 'cancelled';
    order.cancelled_at = new Date();
    order.cancellation_reason = reason ?? 'Cancelled by user';
    await order.save();
    return order;
};

// ── 5. Admin — Get All Orders ─────────────────────────────────────────────────
export const getAllOrders = async (page = 1, limit = 20, status?: string, userId?: string) => {
    const query: any = {};
    if (status) query.status = status;
    if (userId) query.user_id = userId;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
        .populate('user_id', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return { orders, total, page, pages: Math.ceil(total / limit) };
};

// ── 6. Admin — Update Order Status ───────────────────────────────────────────
export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
        throw new Error(`Cannot transition from "${order.status}" → "${newStatus}"`);
    }

    // If paid → mark payment
    if (newStatus === 'paid') order.payment_status = 'paid';

    // If cancelled via admin → restore stock
    if (newStatus === 'cancelled') {
        for (const item of order.order_items) {
            await Product.findByIdAndUpdate(item.product_id, { $inc: { stock: item.quantity } });
        }
        order.cancelled_at = new Date();
    }

    order.status = newStatus;
    await order.save();
    return order;
};
