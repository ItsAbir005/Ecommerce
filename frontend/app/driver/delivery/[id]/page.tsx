"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDriver } from "../../../context/DriverContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type ShipmentStatus = "assigned" | "picked_up" | "out_for_delivery" | "delivered" | "failed";

interface Shipment {
    _id: string;
    trackingCode: string;
    status: ShipmentStatus;
    otp: string;
    deliveryAddress: { street: string; city: string; state: string; zip: string; country: string };
    estimatedDelivery?: string;
    order_id?: { _id: string };
    assignedAt?: string;
    pickedUpAt?: string;
}

const STEPS: { key: ShipmentStatus; label: string; icon: string }[] = [
    { key: "assigned", label: "Assigned", icon: "📋" },
    { key: "picked_up", label: "Picked Up", icon: "📦" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: "🚚" },
    { key: "delivered", label: "Delivered", icon: "✅" },
];

const NEXT_STATUS: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
    assigned: "picked_up",
    picked_up: "out_for_delivery",
    out_for_delivery: "delivered",
};

const NEXT_LABEL: Partial<Record<ShipmentStatus, string>> = {
    assigned: "Mark as Picked Up",
    picked_up: "Mark as Out for Delivery",
    out_for_delivery: "Confirm Delivery (OTP)",
};

export default function DeliveryDetailPage() {
    const { id } = useParams() as { id: string };
    const { token } = useDriver();
    const router = useRouter();
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [showOtp, setShowOtp] = useState(false);

    const fetchShipment = async () => {
        try {
            const res = await fetch(`${API}/drivers/delivery/active`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setShipment(data);
        } catch { setShipment(null); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (token) fetchShipment(); }, [token]);

    const handleStatusUpdate = async () => {
        if (!shipment) return;
        const nextStatus = NEXT_STATUS[shipment.status];
        if (!nextStatus) return;

        if (nextStatus === "delivered") {
            setShowOtp(true);
            return;
        }
        setUpdating(true); setError("");
        try {
            await fetch(`${API}/shipping/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: nextStatus }),
            });
            await fetchShipment();
        } catch (e: any) { setError(e.message); }
        finally { setUpdating(false); }
    };

    const handleConfirmDelivery = async () => {
        setUpdating(true); setError("");
        try {
            const res = await fetch(`${API}/shipping/${id}/confirm-delivery`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            router.push("/driver/dashboard");
        } catch (e: any) { setError(e.message); }
        finally { setUpdating(false); }
    };

    if (loading) return (
        <div style={{ maxWidth: "700px", margin: "40px auto", padding: "0 24px" }}>
            <div style={{ height: "300px", background: "rgba(255,255,255,0.03)", borderRadius: "16px" }} />
        </div>
    );

    if (!shipment) return (
        <div style={{ textAlign: "center", padding: "80px 24px", color: "#94a3b8" }}>
            <p style={{ fontSize: "40px" }}>📭</p>
            <p>No active delivery found.</p>
        </div>
    );

    const currentStep = STEPS.findIndex(s => s.key === shipment.status);
    const nextLabel = NEXT_LABEL[shipment.status];
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${shipment.deliveryAddress.street}, ${shipment.deliveryAddress.city}`
    )}`;

    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 24px" }}>
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 4px" }}>← Delivery Detail</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                    <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", margin: "0 0 4px", fontFamily: "monospace" }}>
                        {shipment.trackingCode}
                    </h1>
                    {shipment.order_id && (
                        <span style={{ fontSize: "14px", color: "#94a3b8", fontFamily: "monospace", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "6px" }}>
                            Order #{shipment.order_id._id.slice(-10).toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            {/* Progress stepper */}
            <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px", padding: "24px", marginBottom: "20px",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                    <div style={{ position: "absolute", top: "16px", left: 0, right: 0, height: "2px", background: "rgba(255,255,255,0.08)" }} />
                    <div style={{ position: "absolute", top: "16px", left: 0, height: "2px", background: "#fb923c", width: `${(currentStep / (STEPS.length - 1)) * 100}%`, transition: "width 0.5s" }} />
                    {STEPS.map((step, i) => (
                        <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
                            <div style={{
                                width: "32px", height: "32px", borderRadius: "50%",
                                background: i <= currentStep ? "linear-gradient(135deg, #f97316, #ea580c)" : "rgba(255,255,255,0.05)",
                                border: i <= currentStep ? "none" : "1px solid rgba(255,255,255,0.1)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "14px",
                            }}>
                                {i < currentStep ? "✓" : step.icon}
                            </div>
                            <span style={{ fontSize: "11px", marginTop: "6px", color: i <= currentStep ? "#fb923c" : "#64748b" }}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Delivery address */}
            <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px", padding: "20px", marginBottom: "16px",
            }}>
                <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>📍 Delivery Address</p>
                <p style={{ margin: "0 0 4px", color: "#e2e8f0", fontSize: "15px", fontWeight: 500 }}>
                    {shipment.deliveryAddress.street}
                </p>
                <p style={{ margin: "0 0 12px", color: "#94a3b8", fontSize: "13px" }}>
                    {shipment.deliveryAddress.city}, {shipment.deliveryAddress.state} {shipment.deliveryAddress.zip}
                </p>
                <a href={mapsUrl} target="_blank" rel="noreferrer" style={{
                    display: "inline-block", padding: "8px 16px",
                    background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.3)",
                    borderRadius: "8px", color: "#fb923c", fontSize: "13px", fontWeight: 600,
                    textDecoration: "none",
                }}>
                    🗺️ Open in Google Maps
                </a>
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", color: "#f87171", fontSize: "13px", marginBottom: "14px" }}>
                    {error}
                </div>
            )}

            {/* OTP confirmation panel */}
            {showOtp && (
                <div style={{
                    background: "linear-gradient(135deg, rgba(251,146,60,0.08), rgba(0,0,0,0.5))",
                    border: "1px solid rgba(251,146,60,0.25)", borderRadius: "14px", padding: "20px", marginBottom: "16px",
                }}>
                    <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#fb923c" }}>Enter Customer OTP to Confirm Delivery</p>
                    <input
                        type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/, "").slice(0, 6))}
                        placeholder="6-digit OTP"
                        maxLength={6}
                        style={{
                            width: "100%", padding: "12px", background: "rgba(0,0,0,0.4)",
                            border: "1px solid rgba(251,146,60,0.3)", borderRadius: "10px",
                            color: "#fff", fontSize: "20px", fontFamily: "monospace", textAlign: "center",
                            letterSpacing: "0.3em", outline: "none", boxSizing: "border-box", marginBottom: "12px",
                        }}
                    />
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={handleConfirmDelivery} disabled={otp.length !== 6 || updating} style={{
                            flex: 1, padding: "12px", background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer",
                            opacity: otp.length !== 6 ? 0.5 : 1,
                        }}>
                            {updating ? "Confirming..." : "✅ Confirm Delivery"}
                        </button>
                        <button onClick={() => setShowOtp(false)} style={{
                            padding: "12px 16px", background: "none", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "10px", color: "#94a3b8", cursor: "pointer",
                        }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Status action button */}
            {nextLabel && !showOtp && shipment.status !== "delivered" && (
                <button onClick={handleStatusUpdate} disabled={updating} style={{
                    width: "100%", padding: "14px",
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    color: "#fff", border: "none", borderRadius: "12px",
                    fontWeight: 700, fontSize: "15px", cursor: "pointer", opacity: updating ? 0.7 : 1,
                }}>
                    {updating ? "Updating..." : nextLabel}
                </button>
            )}
        </div>
    );
}
