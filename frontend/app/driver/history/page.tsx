"use client";

import { useEffect, useState } from "react";
import { useDriver } from "../../context/DriverContext";

interface HistoryItem {
    _id: string;
    trackingCode: string;
    status: string;
    deliveredAt?: string;
    deliveryAddress: { city: string; state: string };
    order_id?: { total_amount: number; createdAt: string };
}

export default function DriverHistoryPage() {
    const { fetchWithAuth } = useDriver();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    const load = async (p = 1) => {
        setLoading(true);
        try {
            const data = await fetchWithAuth(`/drivers/delivery/history?page=${p}`);
            setHistory(data.deliveries || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { load(page); }, [page]);

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Delivery History</h1>
                <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>{total} completed deliveries</p>
            </div>

            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: "80px", background: "rgba(255,255,255,0.03)", borderRadius: "14px" }} />
                    ))}
                </div>
            ) : history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                    <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📭</p>
                    <p>No deliveries completed yet.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {history.map((item) => (
                        <div key={item._id} style={{
                            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "14px", padding: "18px 20px",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                            <div>
                                <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#fb923c", fontFamily: "monospace" }}>
                                    {item.trackingCode}
                                </p>
                                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                                    📍 {item.deliveryAddress.city}, {item.deliveryAddress.state}
                                    {item.deliveredAt && ` · ${new Date(item.deliveredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                                </p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <span style={{
                                    display: "inline-block", padding: "3px 10px", borderRadius: "999px",
                                    background: "rgba(34,197,94,0.12)", color: "#22c55e",
                                    fontSize: "11px", fontWeight: 600, border: "1px solid rgba(34,197,94,0.2)",
                                }}>
                                    DELIVERED
                                </span>
                                {item.order_id?.total_amount && (
                                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                                        ₹{item.order_id.total_amount.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "24px" }}>
                    {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)} style={{
                            padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                            background: p === page ? "linear-gradient(135deg, #f97316, #ea580c)" : "rgba(255,255,255,0.05)",
                            color: p === page ? "#fff" : "#94a3b8",
                        }}>
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
