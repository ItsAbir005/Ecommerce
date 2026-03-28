"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { fetchApi } from "../../lib/api";
import ChatBox from "../../components/ChatBox";
import MapTracker from "../../components/MapTracker";

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

type Shipment = {
    _id: string;
    trackingCode: string;
    status: string;
    otp?: string;
    estimatedDelivery?: string;
    driver_id?: {
        name: string;
        phone: string;
        vehicleNumber: string;
        vehicleType: string;
        currentLocation?: { lat: number; lng: number };
    };
};

const SHIPMENT_STATUS_STEPS = ["pending", "assigned", "picked_up", "out_for_delivery", "delivered"];
const SHIPMENT_STATUS_ICONS: Record<string, string> = {
    pending: "⏳",
    assigned: "🧑‍✈️",
    picked_up: "📦",
    out_for_delivery: "🚚",
    delivered: "✅",
    failed: "❌",
};

const STATUS_COLOR: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    confirmed: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", // Map legacy "confirmed" equivalent to paid
    paid: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    shipped: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    delivered: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
    returned: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const STATUS_STEPS = ["pending", "paid", "shipped", "delivered"];

export default function OrderDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id as string;

    const paymentSuccess = searchParams?.get("payment") === "success";
    const paymentCancel = searchParams?.get("payment") === "cancel";

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [paying, setPaying] = useState(false);
    const [reason, setReason] = useState("");
    const [showCancel, setShowCancel] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [token, setToken] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setToken(localStorage.getItem("token") || undefined);
        }
    }, []);

    // FIX: Only redirect if authentication has finished loading and user is still null
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || !id) return;

        const loadOrderData = async () => {
            try {
                // If payment=success, let's explicitly verify the payment to bypass webhook delays
                if (paymentSuccess) {
                    try {
                        await fetchApi(`/payments/verify/${id}`);
                    } catch (err) {
                        console.error("Payment verification fallback failed:", err);
                    }
                }

                const data = await fetchApi(`/orders/${id}`);
                setOrder(data);

                // Fetch live shipment tracking (only if order is shipped/delivered)
                try {
                    const shipData = await fetchApi(`/shipping/order/${id}`);
                    setShipment(shipData);
                } catch {
                    // No shipment yet — normal for pending/paid orders
                }
            } catch (err) {
                setError("Order not found.");
            } finally {
                setLoading(false);
            }
        };

        loadOrderData();
    }, [user, id, paymentSuccess]);

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

    const handlePayment = async () => {
        setPaying(true);
        setError(null);
        try {
            const data = await fetchApi("/payments", {
                method: "POST",
                body: JSON.stringify({ order_id: order._id }),
            });
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            }
        } catch (err: any) {
            setError(err.message || "Failed to initiate payment.");
            setPaying(false);
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

    const isCancellable = ["pending", "paid"].includes(order.status) || order.status === "confirmed";
    const displayStatus = order.status === "confirmed" ? "paid" : order.status;
    const currentStep = STATUS_STEPS.indexOf(displayStatus);

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

            {/* ── 🎉 Payment Success Banner (Queue Events) ───────────────────── */}
            {paymentSuccess && order.payment_status === "paid" && (
                <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-500/25"
                    style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.07) 0%, rgba(19,19,31,0.9) 100%)" }}>
                    <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-emerald-500/15">
                        <span style={{ fontSize: "28px" }}>🎉</span>
                        <div>
                            <p className="font-bold text-emerald-400 text-base">Payment Confirmed!</p>
                            <p className="text-sm text-muted mt-0.5">Your order is being processed. Here's what happened behind the scenes:</p>
                        </div>
                    </div>
                    {/* Queue event steps */}
                    <div className="px-6 py-4 space-y-3">
                        {[
                            { icon: "📦", label: "Inventory Reserved", desc: "Stock deducted from warehouse", done: true, delay: "0s" },
                            { icon: "📧", label: "Confirmation Email Sent", desc: "Order summary sent to your inbox", done: true, delay: "0.15s" },
                            { icon: "💳", label: "Payment Processed", desc: "Stripe payment confirmed via webhook", done: true, delay: "0.3s" },
                            { icon: "🚚", label: "Shipping Initiated", desc: "Preparing your package for dispatch", done: true, delay: "0.45s" },
                        ].map(({ icon, label, desc, done, delay }) => (
                            <div key={label} className="flex items-center gap-3 text-sm"
                                style={{ animation: `fadeInUp 0.4s ease ${delay} both` }}>
                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-base"
                                    style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)" }}>
                                    {icon}
                                </div>
                                <div className="flex-1">
                                    <span className="text-white font-medium">{label}</span>
                                    <span className="text-muted ml-2 text-xs">{desc}</span>
                                </div>
                                {done && <span className="text-emerald-400 font-bold text-base">✓</span>}
                            </div>
                        ))}
                    </div>
                    <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
                </div>
            )}
            {paymentSuccess && order.payment_status === "unpaid" && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium">
                    ✅ Payment successful! Your order will be confirmed shortly once validated by Stripe.
                </div>
            )}
            {paymentCancel && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm font-medium">
                    ⚠️ Payment was cancelled. You can try paying again when you're ready.
                </div>
            )}
            {/* ── 🚚 Live Shipment Tracking Card ─────────────────────────── */}
            {shipment && !['cancelled', 'returned'].includes(order.status) && (
                <div className="mb-6 overflow-hidden rounded-2xl border"
                    style={{ borderColor: 'rgba(251,146,60,0.25)', background: 'linear-gradient(135deg, rgba(251,146,60,0.06) 0%, rgba(19,19,31,0.9) 100%)' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-5 pb-4"
                        style={{ borderBottom: '1px solid rgba(251,146,60,0.12)' }}>
                        <div className="flex items-center gap-3">
                            <span style={{ fontSize: '24px' }}>🚚</span>
                            <div>
                                <p className="font-bold text-white text-sm">Live Shipment Tracking</p>
                                <p className="text-xs mt-0.5" style={{ color: '#fb923c', fontFamily: 'monospace' }}>
                                    {shipment.trackingCode}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs px-3 py-1 rounded-full font-semibold"
                            style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }}>
                            {SHIPMENT_STATUS_ICONS[shipment.status]} {shipment.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                    </div>

                    {/* Delivery OTP Badge */}
                    {shipment.otp && shipment.status !== 'delivered' && (
                        <div className="mx-6 mt-4 p-4 rounded-xl flex items-center justify-between"
                            style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(52,211,153,0.05) 100%)', border: '1px solid rgba(52,211,153,0.3)' }}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl text-emerald-400">🔒</span>
                                <div>
                                    <p className="font-bold text-white text-sm">Delivery PIN</p>
                                    <p className="text-xs text-muted mt-0.5">Share this OTP with your driver upon arrival</p>
                                </div>
                            </div>
                            <div className="font-mono text-xl font-black tracking-widest text-emerald-400 bg-emerald-950/50 px-4 py-1.5 rounded-lg border border-emerald-500/20 shadow-inner">
                                {shipment.otp}
                            </div>
                        </div>
                    )}

                    {/* Progress stepper */}
                    <div className="px-6 py-5">
                        <div className="flex items-start justify-between relative">
                            <div className="absolute top-4 left-0 right-0 h-0.5" style={{ background: 'rgba(255,255,255,0.06)' }} />
                            <div className="absolute top-4 left-0 h-0.5 transition-all duration-700"
                                style={{
                                    background: 'linear-gradient(90deg, #f97316, #fb923c)',
                                    width: `${(Math.max(0, SHIPMENT_STATUS_STEPS.indexOf(shipment.status)) / (SHIPMENT_STATUS_STEPS.length - 1)) * 100}%`
                                }} />
                            {SHIPMENT_STATUS_STEPS.map((step, i) => {
                                const curIdx = SHIPMENT_STATUS_STEPS.indexOf(shipment.status);
                                const done = i <= curIdx;
                                return (
                                    <div key={step} className="flex flex-col items-center z-10" style={{ flex: 1 }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: done ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'rgba(255,255,255,0.05)',
                                            border: done ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '13px', fontWeight: 700, color: '#fff'
                                        }}>
                                            {i < curIdx ? '✓' : SHIPMENT_STATUS_ICONS[step]}
                                        </div>
                                        <span className="text-center mt-2" style={{ fontSize: '10px', color: done ? '#fb923c' : '#64748b', maxWidth: '60px', lineHeight: '1.3' }}>
                                            {step.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Driver info (when assigned) */}
                    {shipment.driver_id && (
                        <div className="mx-6 mb-4 p-3 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-xs mb-2" style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Delivery Driver</p>
                            <div className="flex items-center gap-3">
                                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🧑‍✈️</div>
                                <div>
                                    <p className="font-semibold text-white text-sm">{shipment.driver_id.name}</p>
                                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                                        {shipment.driver_id.vehicleType} · {shipment.driver_id.vehicleNumber}
                                    </p>
                                </div>
                                <button onClick={() => setIsChatOpen(true)} className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium"
                                    style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', textDecoration: 'none', cursor: 'pointer' }}>
                                    💬 Chat
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ETA */}
                    {shipment.estimatedDelivery && shipment.status !== 'delivered' && (
                        <p className="px-6 pb-4 text-xs" style={{ color: '#64748b' }}>
                            Estimated delivery: <span style={{ color: '#94a3b8' }}>
                                {new Date(shipment.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                        </p>
                    )}

                    {/* Live Map Tracker */}
                    {['assigned', 'picked_up', 'out_for_delivery'].includes(shipment.status) && (
                        <div className="mx-6 mb-6">
                            <MapTracker 
                                orderId={order._id} 
                                deliveryAddress={order.shipping_address} 
                                initialDriverLocation={shipment.driver_id?.currentLocation} 
                            />
                        </div>
                    )}
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

                    {/* Pay button */}
                    {order.payment_status === "unpaid" && !["cancelled", "returned"].includes(order.status) && (
                        <button
                            onClick={handlePayment}
                            disabled={paying}
                            className="w-full mt-3 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all disabled:opacity-50"
                        >
                            {paying ? "Redirecting to Stripe..." : "Pay Now"}
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
            {isChatOpen && shipment && shipment.driver_id && (
                <ChatBox 
                    shipmentId={shipment._id}
                    userMode="customer"
                    userId={user?._id}
                    token={token}
                    recipientName={shipment.driver_id.name}
                    onClose={() => setIsChatOpen(false)}
                />
            )}
        </div>
    );
}
