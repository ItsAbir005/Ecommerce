"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../lib/api";
import { useToast } from "../components/Toast";

type Order = {
    _id: string;
    status: string;
    payment_status: string;
    total_amount: number;
    subtotal: number;
    order_items: { title: string; quantity: number; image?: string }[];
    createdAt: string;
};

const STATUS_COLOR: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    confirmed: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    paid: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    shipped: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    delivered: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
    returned: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const STATUS_ICON: Record<string, string> = {
    pending: "⏳", confirmed: "💳", paid: "💳", shipped: "🚚",
    delivered: "📦", cancelled: "❌", returned: "↩️",
};

export default function OrdersContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    // Read ?payment=success from the URL using native browser API
    // (avoids useSearchParams entirely — no build-time SSR issues)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("payment") === "success") {
            toast("success", "Payment Successful! 🎉", "Your order is confirmed and emails have been sent.");
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ page: String(page), limit: "8" });
                if (statusFilter) params.set("status", statusFilter);
                const data = await fetchApi(`/orders/my?${params}`);
                setOrders(data.orders || []);
                setTotalPages(data.pages || 1);
            } catch { setOrders([]); }
            finally { setLoading(false); }
        };
        load();
    }, [user, page, statusFilter]);

    const statuses = ["", "pending", "paid", "shipped", "delivered", "cancelled", "returned"];

    return (
        <div className="container-custom py-12 min-h-[80vh]">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-bold gradient-text">My Orders</h1>
                    <p className="text-muted mt-1">Track and manage your purchases</p>
                </div>
                <Link href="/products" className="btn btn-primary text-sm px-5 py-2">Shop More</Link>
            </div>

            {/* Status filter */}
            <div className="flex gap-2 flex-wrap mb-8">
                {statuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter === s
                            ? "bg-primary border-primary text-white"
                            : "border-card-border text-muted hover:text-white hover:border-white/30"
                            }`}
                    >
                        {s ? `${STATUS_ICON[s]} ${s.charAt(0).toUpperCase() + s.slice(1)}` : "All Orders"}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card !p-5 animate-pulse flex gap-4">
                            <div className="w-16 h-16 bg-white/5 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-white/5 rounded w-1/4" />
                                <div className="h-3 bg-white/5 rounded w-1/2" />
                                <div className="h-3 bg-white/5 rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-24">
                    <div className="text-6xl mb-4">📋</div>
                    <h2 className="text-2xl font-bold mb-2">No orders found</h2>
                    <p className="text-muted mb-6">
                        {statusFilter ? `No "${statusFilter}" orders yet.` : "You haven't placed any orders yet."}
                    </p>
                    <Link href="/products" className="btn btn-primary px-8 py-3">Start Shopping</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Link href={`/orders/${order._id}`} key={order._id} className="block">
                            <div className="card !p-5 hover:border-primary/50 transition-all hover:-translate-y-0.5 cursor-pointer">
                                <div className="flex items-start gap-4 flex-wrap">
                                    <div className="flex -space-x-2 shrink-0">
                                        {order.order_items.slice(0, 3).map((item, i) => (
                                            <div key={i} className="w-14 h-14 rounded-lg border border-card-border overflow-hidden bg-black/40">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-xl opacity-30">📦</div>
                                                )}
                                            </div>
                                        ))}
                                        {order.order_items.length > 3 && (
                                            <div className="w-14 h-14 rounded-lg border border-card-border bg-black/60 flex items-center justify-center text-xs text-muted font-medium">
                                                +{order.order_items.length - 3}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap mb-1.5">
                                            <span className="font-mono text-xs text-muted">#{order._id.slice(-8).toUpperCase()}</span>
                                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_COLOR[order.status]}`}>
                                                {STATUS_ICON[order.status]} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted line-clamp-1">
                                            {order.order_items.map(i => i.title).join(", ")}
                                        </p>
                                        <p className="text-xs text-muted mt-1">
                                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                day: "numeric", month: "long", year: "numeric",
                                            })}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-bold text-emerald-400">${order.total_amount.toFixed(2)}</p>
                                        <p className="text-xs text-muted mt-0.5">{order.order_items.reduce((s, i) => s + i.quantity, 0)} items</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-4 py-2 rounded-lg border border-card-border text-muted hover:text-white disabled:opacity-30 text-sm">← Prev</button>
                    <span className="px-4 py-2 text-sm text-muted">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg border border-card-border text-muted hover:text-white disabled:opacity-30 text-sm">Next →</button>
                </div>
            )}
        </div>
    );
}
