"use client";

import { useEffect, useState, useRef } from "react";
import { useDriver } from "../../context/DriverContext";
import Link from "next/link";

interface ActiveDelivery {
    _id: string;
    trackingCode: string;
    status: string;
    deliveryAddress: { street: string; city: string; state: string; zip: string; country: string };
    estimatedDelivery?: string;
    order_id?: { _id: string };
}

interface PendingRequest {
    shipmentId: string;
    trackingCode: string;
    deliveryAddress: { street: string; city: string; state: string; zip: string };
    otp?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const STATUS_COLORS: Record<string, string> = {
    offline: "#64748b",
    online: "#22c55e",
    busy: "#fb923c",
};

export default function DriverDashboard() {
    const { driver, fetchWithAuth, token, loading: ctxLoading } = useDriver();
    const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);
    const [loadingDelivery, setLoadingDelivery] = useState(true);
    const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
    const [responding, setResponding] = useState(false);
    const locationWatchRef = useRef<number | null>(null);

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
        if (driver) {
            loadActiveDelivery();
        } else if (!ctxLoading) {
            // Context finished loading but no driver — stop spinner
            setLoadingDelivery(false);
        }
    }, [driver, ctxLoading]);

    // Listen for real-time delivery assigned via Socket.io
    useEffect(() => {
        const handler = (e: any) => {
            // Try to get the shipment data from the custom event
            const data = (e as CustomEvent).detail || {};
            setPendingRequest({
                shipmentId: data.shipmentId,
                trackingCode: data.trackingCode,
                deliveryAddress: data.deliveryAddress,
            });
            loadActiveDelivery();
        };
        window.addEventListener("deliveryAssigned", handler as EventListener);
        return () => window.removeEventListener("deliveryAssigned", handler as EventListener);
    }, []);

    // Share live location when driver is online (waiting or delivering)
    useEffect(() => {
        if (!token || !driver || (driver.status !== "online" && driver.status !== "busy")) return;

        const shareLocation = (lat: number, lng: number) => {
            fetch(`${API}/drivers/location`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ lat, lng }),
            }).catch(() => { });
        };

        if ("geolocation" in navigator) {
            locationWatchRef.current = navigator.geolocation.watchPosition(
                pos => shareLocation(pos.coords.latitude, pos.coords.longitude),
                () => { }, // ignore errors silently
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
            );
        }
        return () => {
            if (locationWatchRef.current !== null) {
                navigator.geolocation.clearWatch(locationWatchRef.current);
                locationWatchRef.current = null;
            }
        };
    }, [driver, token]);

    const handleAccept = async () => {
        if (!pendingRequest || !activeDelivery) return;
        setResponding(true);
        try {
            await fetch(`${API}/shipping/${pendingRequest.shipmentId}/accept`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            setPendingRequest(null);
        } catch (err) {
            console.error("Accept failed", err);
        } finally {
            setResponding(false);
        }
    };

    const handleReject = async () => {
        if (!pendingRequest) return;
        setResponding(true);
        try {
            await fetch(`${API}/shipping/${pendingRequest.shipmentId}/reject`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            setPendingRequest(null);
            setActiveDelivery(null);
        } catch (err) {
            console.error("Reject failed", err);
        } finally {
            setResponding(false);
        }
    };

    // While context is still hydrating from localStorage, show a spinner
    if (ctxLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
                <p style={{ color: "#94a3b8" }}>Loading...</p>
            </div>
        );
    }

    const statusColor = STATUS_COLORS[driver?.status || "offline"];

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                    Good day, {driver?.name.split(" ")[0]} 👋
                </h1>
                <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
                    Your delivery dashboard •{" "}
                    <span style={{ color: statusColor, fontWeight: 600 }}>
                        {driver?.status?.toUpperCase() || "OFFLINE"}
                    </span>
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

            {/* ── Pickup Request Card (new delivery assigned, driver must accept/reject) */}
            {pendingRequest && (
                <div style={{
                    marginBottom: "24px",
                    background: "linear-gradient(135deg, rgba(251,146,60,0.12), rgba(249,115,22,0.05))",
                    border: "2px solid rgba(251,146,60,0.45)",
                    borderRadius: "18px", padding: "24px",
                    animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                }}>
                    <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(251,146,60,0.3)} 50%{box-shadow:0 0 0 12px rgba(251,146,60,0)} }`}</style>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "28px" }}>🔔</span>
                            <div>
                                <p style={{ margin: "0 0 2px", fontWeight: 700, color: "#fb923c", fontSize: "16px" }}>New Pickup Request!</p>
                                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>{pendingRequest.trackingCode}</p>
                            </div>
                        </div>
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>📍 Delivery To</p>
                        <p style={{ margin: 0, color: "#e2e8f0", fontSize: "14px", fontWeight: 500 }}>
                            {pendingRequest.deliveryAddress?.street}<br />
                            <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                                {pendingRequest.deliveryAddress?.city}, {pendingRequest.deliveryAddress?.state} {pendingRequest.deliveryAddress?.zip}
                            </span>
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            onClick={handleAccept}
                            disabled={responding}
                            style={{
                                flex: 1, padding: "13px", background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px",
                                cursor: "pointer", opacity: responding ? 0.7 : 1,
                            }}
                        >
                            {responding ? "..." : "✓ Accept Delivery"}
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={responding}
                            style={{
                                flex: 1, padding: "13px", background: "rgba(239,68,68,0.15)",
                                color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px",
                                fontWeight: 700, fontSize: "15px", cursor: "pointer", opacity: responding ? 0.7 : 1,
                            }}
                        >
                            {responding ? "..." : "✗ Reject"}
                        </button>
                    </div>
                </div>
            )}

            {/* Active delivery card */}
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#e2e8f0", marginBottom: "16px" }}>Active Delivery</h2>
            {loadingDelivery ? (
                <div style={{ height: "120px", background: "rgba(255,255,255,0.03)", borderRadius: "14px" }} />
            ) : activeDelivery ? (
                <div style={{
                    background: "linear-gradient(135deg, rgba(251,146,60,0.07), rgba(19,19,31,0.95))",
                    border: "1px solid rgba(251,146,60,0.25)", borderRadius: "16px", padding: "24px",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                            <p style={{ margin: "0 0 4px", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>Tracking Code</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <p style={{ margin: 0, fontWeight: 700, color: "#fb923c", fontFamily: "monospace", fontSize: "18px" }}>{activeDelivery.trackingCode}</p>
                                {activeDelivery.order_id && (
                                    <span style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                                        Order #{activeDelivery.order_id._id.slice(-10).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span style={{
                            padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
                            background: "rgba(251,146,60,0.15)", color: "#fb923c",
                            border: "1px solid rgba(251,146,60,0.3)",
                        }}>
                            {activeDelivery.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                    </div>
                    <p style={{ margin: "0 0 8px", color: "#94a3b8", fontSize: "12px" }}>📡 Sharing your live location with customer</p>
                    <p style={{ margin: "0 0 16px", color: "#e2e8f0", fontSize: "14px" }}>
                        📍 {activeDelivery.deliveryAddress.street}, {activeDelivery.deliveryAddress.city}
                    </p>
                    <Link href={`/driver/delivery/${activeDelivery._id}`} style={{
                        display: "inline-block", padding: "10px 20px",
                        background: "linear-gradient(135deg, #f97316, #ea580c)",
                        color: "#fff", borderRadius: "10px", fontWeight: 600, fontSize: "14px",
                        textDecoration: "none",
                    }}>
                        View & Update Delivery →
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
                        {driver?.status === "online" ? "Waiting for a delivery to be assigned to you..." : "Go online to start receiving deliveries"}
                    </p>
                </div>
            )}
        </div>
    );
}
