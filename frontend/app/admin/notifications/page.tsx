"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface DriverMeta {
    name: string;
    email: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    licenseNumber: string;
}

interface Notification {
    _id: string;
    type: string;
    message: string;
    isRead: boolean;
    relatedId: string;
    createdAt: string;
    metadata?: DriverMeta;
}

const VEHICLE_ICONS: Record<string, string> = {
    bike: "🏍️", car: "🚗", van: "🚐", truck: "🚛"
};

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchNotifications = async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return router.push("/admin/login");

        try {
            const res = await fetch(`${API}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const handleApproveDriver = async (driverId: string) => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setApproving(driverId);
        try {
            const res = await fetch(`${API}/drivers/${driverId}/approve`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                showToast("success", "Driver approved successfully! They can now log in.");
                fetchNotifications();
            } else {
                showToast("error", data.message || "Approval failed. Please try again.");
            }
        } catch (err) {
            showToast("error", "Network error. Please try again.");
        } finally {
            setApproving(null);
        }
    };

    const handleMarkAllRead = async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        try {
            const res = await fetch(`${API}/notifications/read-all`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px", position: "relative" }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: "80px", right: "24px", zIndex: 9999,
                    padding: "14px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: 500,
                    background: toast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                    color: toast.type === "success" ? "#4ade80" : "#f87171",
                    backdropFilter: "blur(10px)",
                }}>
                    {toast.type === "success" ? "✅" : "❌"} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                        Notifications
                        {unreadCount > 0 && (
                            <span style={{ marginLeft: "10px", background: "#ef4444", color: "#fff", fontSize: "13px", padding: "2px 8px", borderRadius: "999px" }}>
                                {unreadCount} new
                            </span>
                        )}
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Review pending driver registrations and other alerts.</p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#e2e8f0", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px"
                    }}>
                        Mark All as Read
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ padding: "60px", color: "#94a3b8", textAlign: "center" }}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#64748b", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
                    <p style={{ margin: 0, fontWeight: 500 }}>You're all caught up!</p>
                    <p style={{ margin: "4px 0 0", fontSize: "13px" }}>No notifications at this time.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {notifications.map(notif => {
                        const meta = notif.metadata as DriverMeta | undefined;
                        const isDriverNotif = notif.type === "DRIVER_REGISTRATION";
                        const vehicleIcon = meta ? (VEHICLE_ICONS[meta.vehicleType] || "🚗") : "🚗";

                        return (
                            <div key={notif._id} style={{
                                background: notif.isRead ? "rgba(255,255,255,0.02)" : "rgba(99,102,241,0.06)",
                                border: `1px solid ${notif.isRead ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.3)"}`,
                                borderRadius: "14px", padding: "20px 22px", transition: "all 0.2s",
                            }}>
                                {/* Top row: type badge + timestamp + unread dot */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        {!notif.isRead && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />}
                                        {isDriverNotif && (
                                            <span style={{ padding: "2px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: "rgba(99,102,241,0.15)", color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                                Driver Registration
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                                        {new Date(notif.createdAt).toLocaleString("en-IN")}
                                    </span>
                                </div>

                                {/* Driver details card */}
                                {isDriverNotif && meta ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: "48px", height: "48px", borderRadius: "50%",
                                                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "20px", fontWeight: 700, color: "#fff", flexShrink: 0,
                                            }}>
                                                {meta.name?.[0]?.toUpperCase() || "D"}
                                            </div>
                                            <div>
                                                <p style={{ margin: "0 0 3px", fontWeight: 700, color: "#fff", fontSize: "16px" }}>{meta.name}</p>
                                                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>{meta.email} · {meta.phone}</p>
                                            </div>
                                        </div>
                                        {/* Vehicle info */}
                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                            <span style={{ padding: "4px 12px", background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: "8px", fontSize: "12px", color: "#fb923c" }}>
                                                {vehicleIcon} {meta.vehicleType?.toUpperCase()}
                                            </span>
                                            <span style={{ padding: "4px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px", color: "#e2e8f0", fontFamily: "monospace" }}>
                                                {meta.vehicleNumber}
                                            </span>
                                            <span style={{ padding: "4px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px", color: "#94a3b8" }}>
                                                🪪 {meta.licenseNumber}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontSize: "14px", color: "#e2e8f0" }}>{notif.message}</p>
                                )}

                                {/* Action */}
                                {isDriverNotif && !notif.isRead && (
                                    <div style={{ marginTop: "14px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                        <button
                                            onClick={() => handleApproveDriver(notif.relatedId)}
                                            disabled={approving === notif.relatedId}
                                            style={{
                                                background: approving === notif.relatedId ? "rgba(34,197,94,0.4)" : "rgba(34,197,94,0.9)",
                                                color: "#fff", border: "none", padding: "9px 22px",
                                                borderRadius: "9px", fontSize: "13px", fontWeight: 700,
                                                cursor: approving === notif.relatedId ? "not-allowed" : "pointer",
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            {approving === notif.relatedId ? "Approving..." : "✓ Approve Driver"}
                                        </button>
                                    </div>
                                )}

                                {/* Already approved badge */}
                                {isDriverNotif && notif.isRead && (
                                    <p style={{ marginTop: "10px", fontSize: "12px", color: "#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
                                        ✓ Approved
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
