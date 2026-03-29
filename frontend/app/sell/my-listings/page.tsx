"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";


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
    rejectionReason?: string;
    category_id?: { _id: string; name: string } | string;
    createdAt: string;
};

const STATUS_MAP = {
    pending: { label: "Pending Review", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)", icon: "🕐" },
    approved: { label: "Approved — Live", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", icon: "✅" },
    rejected: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: "❌" },
};

export default function MyListingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (mounted && !user) {
            router.push("/login?redirect=/sell/my-listings");
        }
    }, [mounted, user, router]);

    const loadListings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/products/my-listings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setListings(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || "Failed to load listings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted && user) loadListings();
    }, [mounted, user]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this listing? This cannot be undone.")) return;
        setDeleting(id);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/products/my-listings/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setListings(l => l.filter(x => x._id !== id));
            setToast("Listing deleted successfully.");
            setTimeout(() => setToast(null), 3000);
        } catch (err: any) {
            setToast(`Error: ${err.message}`);
            setTimeout(() => setToast(null), 4000);
        } finally {
            setDeleting(null);
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ minHeight: "80vh", padding: "48px 24px", maxWidth: "920px", margin: "0 auto" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: "24px", right: "24px", zIndex: 999,
                    background: toast.startsWith("Error") ? "#ef4444" : "#10b981",
                    color: "#fff", padding: "12px 20px", borderRadius: "12px",
                    fontSize: "14px", fontWeight: 500, boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                }}>
                    {toast}
                </div>
            )}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "36px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h1 style={{
                        fontSize: "36px", fontWeight: 800, marginBottom: "8px",
                        background: "linear-gradient(135deg, #818cf8, #6366f1)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>My Listings</h1>
                    <p style={{ color: "#6b7280", fontSize: "14px" }}>
                        Track the status of your submitted sell listings.
                    </p>
                </div>
                <Link href="/sell" style={{
                    padding: "11px 22px", borderRadius: "10px", textDecoration: "none",
                    background: "linear-gradient(135deg, #6366f1, #818cf8)",
                    color: "#fff", fontWeight: 600, fontSize: "14px",
                    boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                }}>
                    + New Listing
                </Link>
            </div>

            {/* Status legend */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "28px" }}>
                {(Object.entries(STATUS_MAP) as [string, typeof STATUS_MAP["pending"]][]).map(([key, val]) => (
                    <div key={key} style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        background: val.bg, border: `1px solid ${val.border}`,
                        borderRadius: "8px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, color: val.color,
                    }}>
                        {val.icon} {val.label}
                    </div>
                ))}
            </div>

            {loading ? (
                <div style={{ display: "grid", gap: "16px" }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            height: "120px", borderRadius: "16px",
                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                            animation: "pulse 1.5s infinite",
                        }} />
                    ))}
                </div>
            ) : error ? (
                <div style={{
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "14px", padding: "24px", textAlign: "center", color: "#f87171",
                }}>
                    ⚠️ {error}
                </div>
            ) : listings.length === 0 ? (
                <div style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "20px", padding: "60px 24px", textAlign: "center",
                }}>
                    <div style={{ fontSize: "56px", marginBottom: "16px" }}>📭</div>
                    <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#e2e8f0", marginBottom: "8px" }}>No listings yet</h3>
                    <p style={{ color: "#6b7280", marginBottom: "24px" }}>Submit your first sell listing to get started.</p>
                    <Link href="/sell" style={{
                        padding: "11px 24px", borderRadius: "10px", textDecoration: "none",
                        background: "linear-gradient(135deg, #6366f1, #818cf8)",
                        color: "#fff", fontWeight: 600, fontSize: "14px",
                    }}>
                        Start Selling →
                    </Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {listings.map(listing => {
                        const st = STATUS_MAP[listing.status];
                        const canDelete = listing.status !== "approved";
                        const catName = typeof listing.category_id === "object"
                            ? listing.category_id?.name
                            : "";
                        const finalPrice = listing.discount > 0
                            ? (listing.price * (1 - listing.discount / 100)).toFixed(2)
                            : null;

                        return (
                            <div key={listing._id} style={{
                                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "16px", padding: "20px 24px",
                                display: "flex", gap: "20px", alignItems: "flex-start",
                                transition: "border-color 0.2s",
                            }}>
                                {/* Image */}
                                <div style={{
                                    width: "90px", height: "90px", borderRadius: "12px",
                                    flexShrink: 0, overflow: "hidden",
                                    background: "rgba(0,0,0,0.3)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}>
                                    {listing.images?.[0] ? (
                                        <img src={listing.images[0]} alt={listing.title}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "28px", opacity: 0.3 }}>📦</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
                                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#e2e8f0", flexShrink: 0 }}>
                                            {listing.title}
                                        </h3>
                                        <span style={{
                                            padding: "2px 10px", borderRadius: "6px", fontSize: "11px",
                                            fontWeight: 700, background: st.bg, border: `1px solid ${st.border}`, color: st.color,
                                        }}>
                                            {st.icon} {st.label}
                                        </span>
                                    </div>

                                    <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px", maxWidth: "560px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {listing.description}
                                    </p>

                                    <div style={{ display: "flex", gap: "18px", marginTop: "10px", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#10b981" }}>
                                            {finalPrice ? `$${finalPrice}` : `$${listing.price.toFixed(2)}`}
                                            {finalPrice && <span style={{ color: "#6b7280", fontWeight: 400, fontSize: "12px", marginLeft: "6px", textDecoration: "line-through" }}>${listing.price.toFixed(2)}</span>}
                                        </span>
                                        <span style={{ fontSize: "12px", color: "#6b7280" }}>Stock: {listing.stock}</span>
                                        {catName && <span style={{ fontSize: "12px", color: "#6b7280" }}>📂 {catName}</span>}
                                        <span style={{ fontSize: "12px", color: "#4b5563" }}>
                                            {new Date(listing.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                    </div>

                                    {/* Rejection reason */}
                                    {listing.status === "rejected" && listing.rejectionReason && (
                                        <div style={{
                                            marginTop: "10px",
                                            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                                            borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#fca5a5",
                                        }}>
                                            <strong>Reason:</strong> {listing.rejectionReason}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(listing._id)}
                                            disabled={deleting === listing._id}
                                            style={{
                                                padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.25)",
                                                background: "rgba(239,68,68,0.08)", color: "#f87171",
                                                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                                                opacity: deleting === listing._id ? 0.5 : 1,
                                            }}>
                                            {deleting === listing._id ? "Deleting…" : "Delete"}
                                        </button>
                                    )}
                                    {listing.status === "approved" && (
                                        <span style={{
                                            fontSize: "11px", color: "#4b5563", textAlign: "center",
                                            padding: "6px 10px",
                                        }}>
                                            Contact support to remove
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
