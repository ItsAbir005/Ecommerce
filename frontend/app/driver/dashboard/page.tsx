"use client";

import { useEffect, useState } from "react";
import { useDriver } from "../../context/DriverContext";
import Link from "next/link";

interface ActiveDelivery {
    _id: string;
    trackingCode: string;
    status: string;
    deliveryAddress: { street: string; city: string; state: string; zip: string; country: string };
    estimatedDelivery?: string;
}

const STATUS_COLORS: Record<string, string> = {
    offline: "#64748b",
    online: "#22c55e",
    busy: "#fb923c",
};

export default function DriverDashboard() {
    const { driver, fetchWithAuth } = useDriver();
    const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);
    const [loadingDelivery, setLoadingDelivery] = useState(true);
    const [newAlert, setNewAlert] = useState(false);

    const loadActiveDelivery = async () => {
        try {
            const data = await fetchWithAuth("/drivers/delivery/active");
            setActiveDelivery(data);
        } catch {
            setActiveDelivery(null);
        } finally {
            setLoadingDelivery(false);
        }
    };

    useEffect(() => {
        if (driver) loadActiveDelivery();
    }, [driver]);

    // Listen for real-time delivery assigned via Socket.io
    useEffect(() => {
        const handler = () => {
            setNewAlert(true);
            loadActiveDelivery();
        };
        window.addEventListener("deliveryAssigned", handler);
        return () => window.removeEventListener("deliveryAssigned", handler);
    }, []);

    const statusColor = STATUS_COLORS[driver?.status || "offline"];

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                    Good morning, {driver?.name.split(" ")[0]} 👋
                </h1>
                <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
                    Your delivery dashboard
                </p>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
                {[
                    { label: "Status", value: driver?.status?.toUpperCase() || "—", icon: "🔄", color: statusColor },
                    { label: "Vehicle", value: `${driver?.vehicleType || "—"} · ${driver?.vehicleNumber || "—"}`, icon: "🏍️", color: "#fb923c" },
                    { label: "Active", value: activeDelivery ? "1 delivery" : "No delivery", icon: "📦", color: activeDelivery ? "#fb923c" : "#64748b" },
                ].map(({ label, value, icon, color }) => (
                    <div key={label} style={{
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "14px", padding: "20px",
                    }}>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{icon} {label}</p>
                        <p style={{ fontSize: "18px", fontWeight: 700, color, margin: 0 }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* New delivery alert */}
            {newAlert && (
                <div style={{
                    marginBottom: "20px", padding: "14px 18px",
                    background: "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(249,115,22,0.08))",
                    border: "1px solid rgba(251,146,60,0.35)", borderRadius: "12px",
                    display: "flex", alignItems: "center", gap: "12px",
                }}>
                    <span style={{ fontSize: "22px" }}>🔔</span>
                    <div>
                        <p style={{ margin: 0, fontWeight: 700, color: "#fb923c" }}>New delivery assigned!</p>
                        <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>Check the active delivery below.</p>
                    </div>
                    <button onClick={() => setNewAlert(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", fontSize: "18px", cursor: "pointer" }}>×</button>
                </div>
            )}

            {/* Active delivery card */}
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#e2e8f0", marginBottom: "16px" }}>Active Delivery</h2>
            {loadingDelivery ? (
                <div style={{ height: "120px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", animation: "pulse 2s infinite" }} />
            ) : activeDelivery ? (
                <div style={{
                    background: "linear-gradient(135deg, rgba(251,146,60,0.07), rgba(19,19,31,0.95))",
                    border: "1px solid rgba(251,146,60,0.25)", borderRadius: "16px", padding: "24px",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                            <p style={{ margin: "0 0 4px", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Tracking Code</p>
                            <p style={{ margin: 0, fontWeight: 700, color: "#fb923c", fontFamily: "monospace", fontSize: "16px" }}>{activeDelivery.trackingCode}</p>
                        </div>
                        <span style={{
                            padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
                            background: "rgba(251,146,60,0.15)", color: "#fb923c",
                            border: "1px solid rgba(251,146,60,0.3)",
                        }}>
                            {activeDelivery.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                    </div>
                    <p style={{ margin: "0 0 16px", color: "#e2e8f0", fontSize: "14px" }}>
                        📍 {activeDelivery.deliveryAddress.street}, {activeDelivery.deliveryAddress.city}
                    </p>
                    <Link href={`/driver/delivery/${activeDelivery._id}`} style={{
                        display: "inline-block", padding: "10px 20px",
                        background: "linear-gradient(135deg, #f97316, #ea580c)",
                        color: "#fff", borderRadius: "10px", fontWeight: 600, fontSize: "14px",
                        textDecoration: "none",
                    }}>
                        View Delivery →
                    </Link>
                </div>
            ) : (
                <div style={{
                    padding: "40px", textAlign: "center",
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "16px",
                }}>
                    <p style={{ fontSize: "40px", margin: "0 0 12px" }}>😴</p>
                    <p style={{ color: "#94a3b8", margin: 0 }}>
                        {driver?.status === "online" ? "Waiting for delivery assignment..." : "Go online to receive deliveries"}
                    </p>
                </div>
            )}
        </div>
    );
}
