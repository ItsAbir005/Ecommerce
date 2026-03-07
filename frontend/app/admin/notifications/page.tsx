"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Notification {
    _id: string;
    type: string;
    message: string;
    isRead: boolean;
    relatedId: string;
    createdAt: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleApproveDriver = async (driverId: string, notificationId: string) => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        try {
            const res = await fetch(`${API}/drivers/${driverId}/approve`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                alert("Driver approved successfully!");
                // Refresh list
                fetchNotifications();
            } else {
                const data = await res.json();
                alert(data.message || "Approval failed.");
            }
        } catch (err) {
            console.error("Failed to approve driver", err);
            alert("Approval failed due to a network error.");
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

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Notifications</h1>
                    <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Review alerts and pending approvals.</p>
                </div>
                <button
                    onClick={handleMarkAllRead}
                    style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#e2e8f0", padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
                        fontSize: "13px"
                    }}
                >
                    Mark All as Read
                </button>
            </div>

            {loading ? (
                <div style={{ padding: "40px", color: "#94a3b8", textAlign: "center" }}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
                    You're all caught up!
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {notifications.map(notif => (
                        <div key={notif._id} style={{
                            background: notif.isRead ? "rgba(255,255,255,0.02)" : "rgba(99,102,241,0.08)",
                            border: `1px solid ${notif.isRead ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.3)"}`,
                            borderRadius: "12px", padding: "16px 20px",
                            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px"
                        }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    {!notif.isRead && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />}
                                    <span style={{ fontSize: "15px", color: notif.isRead ? "#cbd5e1" : "#fff", fontWeight: 500 }}>
                                        {notif.message}
                                    </span>
                                </div>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                    {new Date(notif.createdAt).toLocaleString()}
                                </span>
                            </div>

                            {notif.type === "DRIVER_REGISTRATION" && !notif.isRead && (
                                <button
                                    onClick={() => handleApproveDriver(notif.relatedId, notif._id)}
                                    style={{
                                        background: "#22c55e", color: "#fff", border: "none",
                                        padding: "8px 16px", borderRadius: "8px", fontSize: "13px",
                                        fontWeight: 600, cursor: "pointer"
                                    }}
                                >
                                    Approve
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
