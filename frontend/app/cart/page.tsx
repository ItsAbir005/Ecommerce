"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function CartPage() {
    const { user } = useAuth();
    const { items, summary, loading, updateItem, removeItem, clearCart, validateCart, refreshCart } = useCart();
    const [validating, setValidating] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [notifications, setNotifications] = useState<string[]>([]);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => { if (user) refreshCart(); }, [user]);

    const showNotifications = (msgs: string[]) => {
        setNotifications(msgs);
        setTimeout(() => setNotifications([]), 5000);
    };

    const handleValidate = async () => {
        setValidating(true);
        try {
            const result = await validateCart();
            if (result.changes.length > 0) showNotifications(result.changes);
            else showNotifications(["✅ Cart is valid — all items are in stock and prices are current."]);
        } finally {
            setValidating(false);
        }
    };

    const handleClear = async () => {
        if (!confirm("Clear your entire cart?")) return;
        setClearing(true);
        try { await clearCart(); }
        finally { setClearing(false); }
    };

    const handleQtyChange = async (itemId: string, newQty: number) => {
        if (newQty < 1) return;
        setUpdatingId(itemId);
        try { await updateItem(itemId, newQty); }
        finally { setUpdatingId(null); }
    };

    // ── Not logged in ─────────────────────────────────────────────────────────
    if (!user) {
        return (
            <div className="container-custom min-h-[80vh] flex flex-col items-center justify-center text-center py-20">
                <div className="text-7xl mb-6">🛒</div>
                <h2 className="text-3xl font-bold mb-3">Sign in to view your cart</h2>
                <p className="text-muted mb-8">Your cart items are saved when you're logged in.</p>
                <Link href="/login" className="btn btn-primary px-8 py-3 text-base">Sign In</Link>
            </div>
        );
    }

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading && items.length === 0) {
        return (
            <div className="container-custom py-12 min-h-[80vh]">
                <div className="h-10 w-48 bg-white/5 rounded-xl mb-10 animate-pulse" />
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card !p-6 animate-pulse flex gap-6">
                                <div className="w-24 h-24 bg-white/5 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-white/5 rounded w-3/4" />
                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                    <div className="h-8 bg-white/5 rounded w-32 mt-4" />
                                </div>
                                <div className="h-8 w-20 bg-white/5 rounded" />
                            </div>
                        ))}
                    </div>
                    <div className="lg:w-[380px] card animate-pulse h-64" />
                </div>
            </div>
        );
    }

    // ── Empty cart ────────────────────────────────────────────────────────────
    if (items.length === 0) {
        return (
            <div className="container-custom min-h-[80vh] flex flex-col items-center justify-center text-center py-20">
                <div className="text-7xl mb-6">🛒</div>
                <h2 className="text-3xl font-bold mb-3">Your cart is empty</h2>
                <p className="text-muted mb-8">Looks like you haven't added anything yet.</p>
                <Link href="/products" className="btn btn-primary px-8 py-3 text-base">Browse Products</Link>
            </div>
        );
    }

    // ── Full cart ─────────────────────────────────────────────────────────────
    return (
        <div className="container-custom py-12 min-h-[80vh]">
            {/* Notifications */}
            {notifications.length > 0 && (
                <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-1">
                    {notifications.map((msg, i) => (
                        <p key={i} className="text-yellow-300 text-sm">⚠ {msg}</p>
                    ))}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold gradient-text">Your Cart</h1>
                    <p className="text-muted mt-1">{summary?.itemCount ?? 0} item{(summary?.itemCount ?? 0) !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleValidate}
                        disabled={validating}
                        className="px-4 py-2 rounded-lg border border-card-border text-muted hover:text-white hover:border-white/30 text-sm transition-all disabled:opacity-50"
                    >
                        {validating ? "Validating…" : "✓ Validate Cart"}
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={clearing}
                        className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition-all disabled:opacity-50"
                    >
                        {clearing ? "Clearing…" : "🗑 Clear Cart"}
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* ── Cart Items ── */}
                <div className="flex-1 space-y-4">
                    {items.map((item, index) => {
                        const product = item.product_id;
                        const isUpdating = updatingId === item._id;
                        const finalPrice = item.price_at_addition;
                        const lineTotal = (finalPrice * item.quantity).toFixed(2);
                        const outOfStock = product.stock === 0;

                        return (
                            <div
                                key={item._id}
                                className={`card !p-5 flex flex-col sm:flex-row gap-5 transition-opacity ${isUpdating ? "opacity-60" : ""}`}
                            >
                                {/* Image */}
                                <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-black/40">
                                    {product.images?.[0] ? (
                                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-3xl opacity-30">📦</div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base leading-snug mb-1 line-clamp-2">{product.title}</h3>

                                    {outOfStock && (
                                        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Out of stock</span>
                                    )}

                                    {/* Quantity control */}
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex items-center border border-card-border rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => handleQtyChange(item._id, item.quantity - 1)}
                                                disabled={isUpdating || item.quantity <= 1}
                                                className="w-9 h-9 flex items-center justify-center text-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 text-lg font-medium"
                                            >
                                                −
                                            </button>
                                            <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                                            <button
                                                onClick={() => handleQtyChange(item._id, item.quantity + 1)}
                                                disabled={isUpdating || item.quantity >= product.stock}
                                                className="w-9 h-9 flex items-center justify-center text-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 text-lg font-medium"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item._id)}
                                            disabled={isUpdating}
                                            className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="text-right shrink-0">
                                    <p className="text-emerald-400 font-bold text-lg">${lineTotal}</p>
                                    <p className="text-muted text-xs mt-1">${finalPrice.toFixed(2)} each</p>
                                    {product.discount > 0 && (
                                        <p className="text-red-400 text-xs mt-0.5">-{product.discount}% off</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Order Summary ── */}
                {summary && (
                    <div className="lg:w-[380px] shrink-0 self-start sticky top-[90px]">
                        <div className="card !p-6 space-y-4">
                            <h3 className="text-xl font-bold">Order Summary</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-muted">
                                    <span>Subtotal ({summary.itemCount} items)</span>
                                    <span className="text-foreground">${summary.subtotal.toFixed(2)}</span>
                                </div>
                                {summary.discountAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-red-400">Discount</span>
                                        <span className="text-red-400">-${summary.discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-muted">
                                    <span>Tax (8%)</span>
                                    <span className="text-foreground">${summary.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-muted">
                                    <span>Shipping</span>
                                    <span className={summary.shipping === 0 ? "text-emerald-400 font-medium" : "text-foreground"}>
                                        {summary.shipping === 0 ? "Free" : `$${summary.shipping.toFixed(2)}`}
                                    </span>
                                </div>
                                {summary.shippingNote && (
                                    <p className="text-xs text-muted italic">{summary.shippingNote}</p>
                                )}
                            </div>

                            <div className="h-px bg-card-border" />

                            <div className="flex justify-between text-xl font-bold">
                                <span>Total</span>
                                <span className="gradient-text">${summary.total.toFixed(2)}</span>
                            </div>

                            <Link
                                href="/orders/checkout"
                                className="btn btn-primary w-full py-3 text-base mt-2 block text-center"
                            >
                                Proceed to Checkout →
                            </Link>

                            <Link
                                href="/products"
                                className="block text-center text-sm text-muted hover:text-white transition-colors mt-2"
                            >
                                ← Continue Shopping
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
