"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type Listing = {
    _id: string;
    title: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    discount: number;
    status: "pending" | "approved" | "rejected";
    seller_id?: { _id: string; name: string; email: string };
    category_id?: { _id: string; name: string } | string;
    createdAt: string;
};

export default function AdminPendingListingsPage() {
    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [tab, setTab] = useState<"pending" | "all">("pending");
    const [allListings, setAllListings] = useState<Listing[]>([]);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`${API_URL}/products/admin/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    router.push("/admin/login");
                    return;
                }
                throw new Error(data.message);
            }
            setListings(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleApprove = async (id: string, title: string) => {
        setActionId(id);
        try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`${API_URL}/products/admin/${id}/approve`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setListings(l => l.filter(x => x._id !== id));
            showToast(`✅ "${title}" is now live in the store!`);
        } catch (err: any) {
            showToast(`Error: ${err.message}`, "error");
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        setActionId(rejectModal.id);
        try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`${API_URL}/products/admin/${rejectModal.id}/reject`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ reason: rejectReason || undefined }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setListings(l => l.filter(x => x._id !== rejectModal.id));
            showToast(`❌ "${rejectModal.title}" has been rejected.`);
        } catch (err: any) {
            showToast(`Error: ${err.message}`, "error");
        } finally {
            setActionId(null);
            setRejectModal(null);
            setRejectReason("");
        }
    };

    return (
        <div style={{ padding: "40px 32px", maxWidth: "1100px", margin: "0 auto" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: "24px", right: "24px", zIndex: 999,
                    background: toast.type === "error" ? "#ef4444" : "#10b981",
                    color: "#fff", padding: "14px 22px", borderRadius: "12px",
                    fontSize: "14px", fontWeight: 500, boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                    animation: "fadeIn 0.2s ease",
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Reject Reason Modal */}
            {rejectModal && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
                }}>
                    <div style={{
                        background: "linear-gradient(135deg, rgba(8,8,20,0.98), rgba(15,12,35,0.96))",
                        border: "1px solid rgba(99,102,241,0.25)", borderRadius: "20px",
                        padding: "36px", maxWidth: "480px", width: "100%",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                    }}>
                        <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
                            Reject Listing
                        </h3>
                        <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "20px" }}>
                            Provide a reason (optional) — the seller will see this message.
                        </p>
                        <div style={{
                            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: "10px", padding: "12px 16px", marginBottom: "18px",
                            fontSize: "14px", color: "#f87171",
                        }}>
                            📋 "{rejectModal.title}"
                        </div>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g. Images are too blurry, price is not within acceptable range…"
                            rows={3}
                            style={{
                                width: "100%", background: "rgba(0,0,0,0.3)",
                                border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
                                padding: "10px 14px", color: "#e2e8f0", fontSize: "14px",
                                outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: "20px",
                            }}
                        />
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                                style={{
                                    padding: "10px 20px", borderRadius: "10px",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    background: "rgba(255,255,255,0.04)",
                                    color: "#94a3b8", cursor: "pointer", fontWeight: 600,
                                }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!!actionId}
                                style={{
                                    padding: "10px 24px", borderRadius: "10px", border: "none",
                                    background: "#ef4444", color: "#fff", fontWeight: 700,
                                    cursor: "pointer", opacity: actionId ? 0.5 : 1,
                                }}>
                                {actionId ? "Rejecting…" : "Reject Listing"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: "36px" }}>
                <h1 style={{
                    fontSize: "32px", fontWeight: 800, marginBottom: "6px",
                    background: "linear-gradient(135deg, #818cf8, #6366f1)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                    Pending Listings
                </h1>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                    Review customer-submitted sell listings before they go live.
                </p>
            </div>

            {/* Stats bar */}
            <div style={{
                display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap",
            }}>
                {[
                    { label: "Awaiting Review", value: listings.length, color: "#fbbf24", icon: "🕐" },
                ].map(s => (
                    <div key={s.label} style={{
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "12px", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px",
                    }}>
                        <span style={{ fontSize: "24px" }}>{s.icon}</span>
                        <div>
                            <div style={{ fontSize: "24px", fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Listings */}
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            height: "140px", borderRadius: "16px",
                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                        }} />
                    ))}
                </div>
            ) : listings.length === 0 ? (
                <div style={{
                    background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: "20px", padding: "60px 24px", textAlign: "center",
                }}>
                    <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
                    <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#10b981", marginBottom: "6px" }}>All Clear!</h3>
                    <p style={{ color: "#6b7280" }}>No pending listings to review right now.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {listings.map(listing => {
                        const seller = listing.seller_id;
                        const catName = typeof listing.category_id === "object"
                            ? listing.category_id?.name : "";

                        return (
                            <div key={listing._id} style={{
                                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(251,191,36,0.15)",
                                borderRadius: "18px", padding: "22px 24px",
                                display: "flex", gap: "20px", alignItems: "flex-start",
                            }}>
                                {/* Images carousel */}
                                <div style={{
                                    display: "flex", gap: "8px", flexShrink: 0,
                                }}>
                                    {listing.images.slice(0, 3).map((img, i) => (
                                        <div key={i} style={{
                                            width: "80px", height: "80px", borderRadius: "10px",
                                            overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
                                            background: "rgba(0,0,0,0.3)", flexShrink: 0,
                                        }}>
                                            <img src={img} alt=""
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        </div>
                                    ))}
                                    {listing.images.length === 0 && (
                                        <div style={{
                                            width: "80px", height: "80px", borderRadius: "10px",
                                            border: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "28px", opacity: 0.3,
                                        }}>📦</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0" }}>{listing.title}</h3>
                                        <span style={{
                                            padding: "2px 10px", borderRadius: "6px", fontSize: "11px",
                                            fontWeight: 700, background: "rgba(251,191,36,0.1)",
                                            border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24",
                                        }}>🕐 Pending</span>
                                    </div>

                                    <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "10px", maxWidth: "500px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {listing.description}
                                    </p>

                                    <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "13px" }}>
                                        <span style={{ color: "#10b981", fontWeight: 700 }}>${listing.price.toFixed(2)}</span>
                                        <span style={{ color: "#6b7280" }}>Stock: {listing.stock}</span>
                                        {listing.discount > 0 && <span style={{ color: "#f59e0b" }}>-{listing.discount}%</span>}
                                        {catName && <span style={{ color: "#6b7280" }}>📂 {catName}</span>}
                                        {listing.images.length > 0 && <span style={{ color: "#6b7280" }}>🖼 {listing.images.length} image{listing.images.length !== 1 ? "s" : ""}</span>}
                                    </div>

                                    {/* Seller info */}
                                    {seller && (
                                        <div style={{
                                            marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "8px",
                                            background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)",
                                            borderRadius: "8px", padding: "5px 12px", fontSize: "12px",
                                        }}>
                                            <span style={{ color: "#818cf8" }}>👤 {seller.name}</span>
                                            <span style={{ color: "#4b5563" }}>·</span>
                                            <span style={{ color: "#6b7280" }}>{seller.email}</span>
                                        </div>
                                    )}

                                    <div style={{ marginTop: "8px", fontSize: "11px", color: "#4b5563" }}>
                                        Submitted {new Date(listing.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                                    <button
                                        onClick={() => handleApprove(listing._id, listing.title)}
                                        disabled={!!actionId}
                                        style={{
                                            padding: "9px 20px", borderRadius: "9px", border: "none",
                                            background: "linear-gradient(135deg, #10b981, #059669)",
                                            color: "#fff", fontWeight: 700, fontSize: "13px",
                                            cursor: actionId ? "wait" : "pointer",
                                            opacity: actionId === listing._id ? 0.6 : 1,
                                            boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                                            transition: "all 0.15s",
                                        }}>
                                        {actionId === listing._id ? "…" : "✅ Approve"}
                                    </button>
                                    <button
                                        onClick={() => { setRejectModal({ id: listing._id, title: listing.title }); setRejectReason(""); }}
                                        disabled={!!actionId}
                                        style={{
                                            padding: "9px 20px", borderRadius: "9px",
                                            border: "1px solid rgba(239,68,68,0.3)",
                                            background: "rgba(239,68,68,0.08)",
                                            color: "#f87171", fontWeight: 700, fontSize: "13px",
                                            cursor: actionId ? "wait" : "pointer",
                                            opacity: actionId ? 0.6 : 1,
                                            transition: "all 0.15s",
                                        }}>
                                        ❌ Reject
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
