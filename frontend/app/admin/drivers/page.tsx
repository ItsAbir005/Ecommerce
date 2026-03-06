"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Driver {
    _id: string;
    name: string;
    email: string;
    phone: string;
    vehicleNumber: string;
    vehicleType: string;
    status: "offline" | "online" | "busy";
    isAvailable: boolean;
    isBlocked: boolean;
    createdAt: string;
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
    online: { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
    busy: { bg: "rgba(251,146,60,0.12)", text: "#fb923c" },
    offline: { bg: "rgba(100,116,139,0.12)", text: "#64748b" },
};

export default function AdminDriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [toggling, setToggling] = useState<string | null>(null);

    const load = async () => {
        const token = localStorage.getItem("adminToken");
        setLoading(true);
        try {
            const res = await fetch(`${API}/drivers/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setDrivers(Array.isArray(data) ? data : data.drivers || []);
        } catch { setDrivers([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const toggleBlock = async (driverId: string, currentlyBlocked: boolean) => {
        const token = localStorage.getItem("adminToken");
        setToggling(driverId);
        try {
            await fetch(`${API}/drivers/${driverId}/block`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isBlocked: !currentlyBlocked }),
            });
            setDrivers(prev => prev.map(d => d._id === driverId ? { ...d, isBlocked: !currentlyBlocked } : d));
        } catch (e) { alert("Failed to update driver status"); }
        finally { setToggling(null); }
    };

    const filtered = drivers.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.email.toLowerCase().includes(search.toLowerCase()) ||
        d.vehicleNumber.toLowerCase().includes(search.toLowerCase())
    );

    const online = drivers.filter(d => d.status === "online").length;
    const busy = drivers.filter(d => d.status === "busy").length;
    const blocked = drivers.filter(d => d.isBlocked).length;

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Driver Management</h1>
                <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>{drivers.length} registered drivers</p>
            </div>

            {/* Stat strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
                {[
                    { label: "Total", value: drivers.length, color: "#818cf8" },
                    { label: "Online", value: online, color: "#22c55e" },
                    { label: "Busy", value: busy, color: "#fb923c" },
                    { label: "Blocked", value: blocked, color: "#f87171" },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "12px", padding: "16px", textAlign: "center",
                    }}>
                        <p style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 700, color }}>{value}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ marginBottom: "16px" }}>
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="🔍  Search driver, email or vehicle number..."
                    style={{
                        width: "100%", padding: "11px 16px", background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
                        color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                    }}
                />
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: "60px", background: "rgba(255,255,255,0.02)", borderRadius: "10px" }} />)}
                </div>
            ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                                {["Driver", "Vehicle", "Status", "Joined", "Actions"].map(h => (
                                    <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No drivers found</td>
                                </tr>
                            )}
                            {filtered.map(driver => {
                                const sc = STATUS_COLOR[driver.status] || STATUS_COLOR.offline;
                                return (
                                    <tr key={driver._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                        {/* Driver info */}
                                        <td style={{ padding: "14px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                                                    {driver.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 600, color: driver.isBlocked ? "#64748b" : "#e2e8f0", fontSize: "14px" }}>
                                                        {driver.name} {driver.isBlocked && <span style={{ fontSize: "11px", color: "#f87171" }}>(Blocked)</span>}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{driver.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Vehicle */}
                                        <td style={{ padding: "14px 16px" }}>
                                            <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                                                {driver.vehicleType} · <span style={{ fontFamily: "monospace", color: "#e2e8f0" }}>{driver.vehicleNumber}</span>
                                            </p>
                                            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{driver.phone}</p>
                                        </td>
                                        {/* Status */}
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, background: sc.bg, color: sc.text }}>
                                                {driver.status.toUpperCase()}
                                            </span>
                                        </td>
                                        {/* Joined */}
                                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                                            {new Date(driver.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        {/* Actions */}
                                        <td style={{ padding: "14px 16px" }}>
                                            <button
                                                onClick={() => toggleBlock(driver._id, driver.isBlocked)}
                                                disabled={toggling === driver._id}
                                                style={{
                                                    padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                                                    background: driver.isBlocked ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                                                    color: driver.isBlocked ? "#22c55e" : "#f87171",
                                                    opacity: toggling === driver._id ? 0.6 : 1,
                                                }}
                                            >
                                                {toggling === driver._id ? "..." : driver.isBlocked ? "Unblock" : "Block"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
