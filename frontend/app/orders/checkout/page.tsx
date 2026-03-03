"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { fetchApi } from "../../lib/api";

export default function CheckoutPage() {
    const { user } = useAuth();
    const { items, summary, clearCart } = useCart();
    const router = useRouter();

    const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];

    const [form, setForm] = useState({
        street: defaultAddress?.street || "",
        city: defaultAddress?.city || "",
        state: defaultAddress?.state || "",
        zip: defaultAddress?.zipCode || "",
        country: defaultAddress?.country || "India",
    });
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) router.push("/login");
    }, [user]);

    const handlePlaceOrder = async () => {
        if (!form.street || !form.city || !form.zip || !form.country) {
            setError("Please fill in all address fields."); return;
        }
        setPlacing(true);
        setError(null);
        try {
            const order = await fetchApi("/orders", {
                method: "POST",
                body: JSON.stringify({ shippingAddress: form }),
            });
            router.push(`/orders/${order._id}`);
        } catch (err: any) {
            setError(err.message || "Failed to place order. Please try again.");
        } finally {
            setPlacing(false);
        }
    };

    if (!user || !items) return null;

    return (
        <div className="container-custom py-12 min-h-[80vh]">
            <h1 className="text-4xl font-bold gradient-text mb-2">Checkout</h1>
            <p className="text-muted mb-10">Almost there — confirm your shipping address to place the order.</p>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* ── Shipping Address Form ── */}
                <div className="flex-1">
                    <div className="card !p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span>📦</span> Shipping Address
                        </h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-muted mb-1">Street Address *</label>
                                <input
                                    type="text"
                                    placeholder="123 Main Street, Apt 4B"
                                    value={form.street}
                                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                                    className="w-full bg-black/30 border border-card-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-muted mb-1">City *</label>
                                    <input
                                        type="text"
                                        placeholder="Mumbai"
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                        className="w-full bg-black/30 border border-card-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-muted mb-1">State</label>
                                    <input
                                        type="text"
                                        placeholder="Maharashtra"
                                        value={form.state}
                                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                                        className="w-full bg-black/30 border border-card-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-muted mb-1">ZIP / PIN Code *</label>
                                    <input
                                        type="text"
                                        placeholder="400001"
                                        value={form.zip}
                                        onChange={(e) => setForm({ ...form, zip: e.target.value })}
                                        className="w-full bg-black/30 border border-card-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-muted mb-1">Country *</label>
                                    <select
                                        value={form.country}
                                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                                        className="w-full bg-black/30 border border-card-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                                    >
                                        <option>India</option>
                                        <option>United States</option>
                                        <option>United Kingdom</option>
                                        <option>Australia</option>
                                        <option>Canada</option>
                                        <option>Germany</option>
                                        <option>Singapore</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Order Summary ── */}
                <div className="lg:w-[400px] shrink-0">
                    <div className="card !p-6 sticky top-[90px]">
                        <h2 className="text-xl font-bold mb-5">Order Summary</h2>

                        {/* Items */}
                        <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
                            {items.map((item) => (
                                <div key={item._id} className="flex gap-3 items-center">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 shrink-0">
                                        {item.product_id?.images?.[0] ? (
                                            <img src={item.product_id.images[0]} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-xl opacity-30">📦</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium line-clamp-1">{item.product_id?.title}</p>
                                        <p className="text-xs text-muted">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-emerald-400 shrink-0">
                                        ${(item.price_at_addition * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {summary && (
                            <>
                                <div className="h-px bg-card-border mb-4" />
                                <div className="space-y-2 text-sm text-muted mb-4">
                                    <div className="flex justify-between"><span>Subtotal</span><span className="text-white">${summary.subtotal.toFixed(2)}</span></div>
                                    {summary.discountAmount > 0 && <div className="flex justify-between"><span className="text-red-400">Discount</span><span className="text-red-400">-${summary.discountAmount.toFixed(2)}</span></div>}
                                    <div className="flex justify-between"><span>Tax (8%)</span><span className="text-white">${summary.tax.toFixed(2)}</span></div>
                                    <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span className={summary.shipping === 0 ? "text-emerald-400" : "text-white"}>
                                            {summary.shipping === 0 ? "Free" : `$${summary.shipping.toFixed(2)}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-px bg-card-border mb-4" />
                                <div className="flex justify-between text-lg font-bold mb-6">
                                    <span>Total</span>
                                    <span className="gradient-text">${summary.total.toFixed(2)}</span>
                                </div>
                            </>
                        )}

                        <button
                            onClick={handlePlaceOrder}
                            disabled={placing || items.length === 0}
                            className="btn btn-primary w-full py-3 text-base disabled:opacity-50"
                        >
                            {placing ? "Placing Order…" : "✓ Place Order"}
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="mt-3 w-full text-center text-sm text-muted hover:text-white transition-colors"
                        >
                            ← Back to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
