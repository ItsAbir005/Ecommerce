"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { fetchApi } from "../../lib/api";

type OrderDetail = {
    _id: string;
    status: string;
    payment_status: string;
    total_amount: number;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    shipping_cost: number;
    shipping_address: { street: string; city: string; state: string; zip: string; country: string };
    order_items: { _id: string; product_id: string; title: string; image?: string; price: number; discount: number; quantity: number }[];
    createdAt: string;
    cancelled_at?: string;
    cancellation_reason?: string;
};

const STATUS_COLOR: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    confirmed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    paid: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    shipped: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    delivered: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
    returned: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const STATUS_STEPS = ["pending", "confirmed", "paid", "shipped", "delivered"];

export default function OrderDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [reason, setReason] = useState("");
    const [showCancel, setShowCancel] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { if (!user) router.push("/login"); }, [user]);

    useEffect(() => {
        if (!user || !id) return;
        fetchApi(`/orders/${id}`)
            .then(setOrder)
            .catch(() => setError("Order not found."))
            .finally(() => setLoading(false));
    }, [user, id]);

    const handleCancel = async () => {
        setCancelling(true);
        setError(null);
        try {
            const updated = await fetchApi(`/orders/${id}/cancel`, {
                method: "PUT",
                body: JSON.stringify({ reason }),
            });
            setOrder(updated);
            setShowCancel(false);
        } catch (err: any) {
            setError(err.message || "Failed to cancel order.");
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="container-custom py-12">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-white/5 rounded" />
                    <div className="card !p-6 space-y-4">
                        <div className="h-4 bg-white/5 rounded w-1/4" />
                        <div className="h-4 bg-white/5 rounded w-1/2" />
                        <div className="h-4 bg-white/5 rounded w-1/3" />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="container-custom py-12 text-center">
                <div className="text-5xl mb-4">❌</div>
                <h2 className="text-2xl font-bold mb-4">{error}</h2>
                <Link href="/orders" className="btn btn-primary">My Orders</Link>
            </div>
        );
    }

    if (!order) return null;

    const isCancellable = ["pending", "confirmed"].includes(order.status);
    const currentStep = STATUS_STEPS.indexOf(order.status);

    return (
        <div className="container-custom py-12 min-h-[80vh]">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                <div>
                    <Link href="/orders" className="text-muted hover:text-white text-sm mb-2 block transition-colors">← My Orders</Link>
                    <h1 className="text-3xl font-bold">Order Detail</h1>
                    <p className="text-muted font-mono text-sm mt-1">#{order._id.slice(-10).toUpperCase()}</p>
                </div>
                <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${STATUS_COLOR[order.status]}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
            )}

            {/* Status Timeline (only if not cancelled/returned) */}
            {!["cancelled", "returned"].includes(order.status) && (
                <div className="card !p-6 mb-6">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-card-border z-0" />
                        {STATUS_STEPS.map((step, i) => (
                            <div key={step} className="flex flex-col items-center z-10">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${i <= currentStep
                                        ? "bg-primary border-primary text-white"
                                        : "bg-card-bg border-card-border text-muted"
                                    }`}>
                                    {i < currentStep ? "✓" : i + 1}
                                </div>
                                <span className={`text-xs mt-2 text-center ${i <= currentStep ? "text-white" : "text-muted"}`}>
                                    {step.charAt(0).toUpperCase() + step.slice(1)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cancellation info */}
            {order.status === "cancelled" && order.cancellation_reason && (
                <div className="card !p-4 mb-6 border-red-500/20">
                    <p className="text-red-400 text-sm">❌ Cancelled: {order.cancellation_reason}</p>
                    {order.cancelled_at && (
                        <p className="text-xs text-muted mt-1">
                            on {new Date(order.cancelled_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    )}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Order Items */}
                <div className="flex-1 space-y-4">
                    <h2 className="font-semibold text-lg">Items Ordered</h2>
                    {order.order_items.map((item) => (
                        <div key={item._id} className="card !p-4 flex gap-4">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/40 shrink-0">
                                {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-3xl opacity-30">📦</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium line-clamp-2 mb-1">{item.title}</h3>
                                <p className="text-muted text-xs">Qty: {item.quantity}</p>
                                {item.discount > 0 && <p className="text-red-400 text-xs">{item.discount}% off applied</p>}
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-emerald-400 font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                                <p className="text-xs text-muted mt-0.5">${item.price.toFixed(2)} each</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right sidebar */}
                <div className="lg:w-[340px] space-y-4 shrink-0">
                    {/* Price breakdown */}
                    <div className="card !p-5">
                        <h3 className="font-semibold mb-4">Price Breakdown</h3>
                        <div className="space-y-2 text-sm text-muted">
                            <div className="flex justify-between"><span>Subtotal</span><span className="text-white">${order.subtotal.toFixed(2)}</span></div>
                            {order.discount_amount > 0 && <div className="flex justify-between"><span className="text-red-400">Discount</span><span className="text-red-400">-${order.discount_amount.toFixed(2)}</span></div>}
                            <div className="flex justify-between"><span>Tax</span><span className="text-white">${order.tax_amount.toFixed(2)}</span></div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span className={order.shipping_cost === 0 ? "text-emerald-400" : "text-white"}>
                                    {order.shipping_cost === 0 ? "Free" : `$${order.shipping_cost.toFixed(2)}`}
                                </span>
                            </div>
                        </div>
                        <div className="h-px bg-card-border my-3" />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="gradient-text">${order.total_amount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Shipping address */}
                    <div className="card !p-5">
                        <h3 className="font-semibold mb-3">Shipping Address</h3>
                        <p className="text-sm text-muted leading-relaxed">
                            {order.shipping_address.street}<br />
                            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}<br />
                            {order.shipping_address.country}
                        </p>
                    </div>

                    {/* Order info */}
                    <div className="card !p-5 text-sm text-muted space-y-2">
                        <div className="flex justify-between">
                            <span>Ordered</span>
                            <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Payment</span>
                            <span className={order.payment_status === "paid" ? "text-emerald-400" : "text-yellow-400"}>
                                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                            </span>
                        </div>
                    </div>

                    {/* Cancel button */}
                    {isCancellable && !showCancel && (
                        <button
                            onClick={() => setShowCancel(true)}
                            className="w-full px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition-all"
                        >
                            Cancel Order
                        </button>
                    )}

                    {showCancel && (
                        <div className="card !p-4 border-red-500/20">
                            <p className="text-sm font-medium mb-3">Reason for cancellation (optional)</p>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Let us know why..."
                                rows={3}
                                className="w-full bg-black/30 border border-card-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-500/50 mb-3"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleCancel} disabled={cancelling}
                                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 transition-colors">
                                    {cancelling ? "Cancelling…" : "Confirm Cancel"}
                                </button>
                                <button onClick={() => setShowCancel(false)}
                                    className="px-4 py-2 rounded-lg border border-card-border text-muted hover:text-white text-sm transition-colors">
                                    Keep
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
