"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default function DriverRegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: "", email: "", password: "", phone: "",
        vehicleNumber: "", vehicleType: "bike", licenseNumber: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const res = await fetch(`${API}/drivers/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            // Show success message within the page UI
            setSuccessMessage("Registration successful! Your account is pending admin approval.");
        } catch (err: any) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const field = (label: string, key: string, type = "text", placeholder = "") => (
        <div>
            <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>{label}</label>
            <input
                type={type} value={(form as any)[key]} autoComplete={type === 'password' ? 'new-password' : type === 'email' ? 'email' : 'off'}
                onChange={e => set(key, e.target.value)} required placeholder={placeholder}
                style={{
                    width: "100%", padding: "11px 14px", background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(251,146,60,0.2)", borderRadius: "10px",
                    color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                }}
            />
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "radial-gradient(ellipse at top, rgba(251,146,60,0.08) 0%, #0a0a0f 60%)",
            padding: "40px 24px",
        }}>
            <div style={{
                width: "100%", maxWidth: "480px",
                background: "linear-gradient(135deg, rgba(251,146,60,0.07) 0%, rgba(19,19,31,0.9) 100%)",
                border: "1px solid rgba(251,146,60,0.2)", borderRadius: "20px",
                padding: "36px", backdropFilter: "blur(20px)",
            }}>
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{ fontSize: "44px", marginBottom: "10px" }}>🚚</div>
                    <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Become a Driver</h1>
                    <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Register your delivery account</p>
                </div>

                {successMessage ? (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", width: "64px", height: "64px", borderRadius: "50%", background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", fontSize: "32px", marginBottom: "20px" }}>
                            ✓
                        </div>
                        <h2 style={{ fontSize: "18px", color: "#fff", marginBottom: "12px", fontWeight: 600 }}>Registration Submitted</h2>
                        <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.5, marginBottom: "24px" }}>
                            {successMessage} We will notify you once your account is activated.
                        </p>
                        <Link href="/driver/login" style={{
                            display: "block", padding: "12px", background: "linear-gradient(135deg, #f97316, #ea580c)",
                            color: "#fff", textDecoration: "none", borderRadius: "10px", fontWeight: 600
                        }}>
                            Go to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                {field("Full Name", "name", "text", "Rahul Kumar")}
                                {field("Phone", "phone", "tel", "9876543210")}
                            </div>
                            {field("Email", "email", "email", "rahul@example.com")}
                            {field("Password", "password", "password", "min 6 chars")}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                {field("Vehicle Number", "vehicleNumber", "text", "WB01AB1234")}
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>Vehicle Type</label>
                                    <select value={form.vehicleType} onChange={e => set("vehicleType", e.target.value)}
                                        style={{
                                            width: "100%", padding: "11px 14px", background: "rgba(0,0,0,0.6)",
                                            border: "1px solid rgba(251,146,60,0.2)", borderRadius: "10px",
                                            color: "#fff", fontSize: "14px", outline: "none",
                                        }}>
                                        <option value="bike">🏍️ Bike</option>
                                        <option value="car">🚗 Car</option>
                                        <option value="van">🚐 Van</option>
                                        <option value="truck">🚛 Truck</option>
                                    </select>
                                </div>
                            </div>
                            {field("License Number", "licenseNumber", "text", "LIC123456")}

                            {error && (
                                <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "13px" }}>
                                    {error}
                                </div>
                            )}

                            <button type="submit" disabled={loading} style={{
                                padding: "13px", borderRadius: "10px", border: "none", cursor: "pointer",
                                background: "linear-gradient(135deg, #f97316, #ea580c)",
                                color: "#fff", fontSize: "15px", fontWeight: 700,
                                opacity: loading ? 0.7 : 1, marginTop: "4px",
                            }}>
                                {loading ? "Registering..." : "Register as Driver"}
                            </button>
                        </form>

                        <p style={{ textAlign: "center", marginTop: "18px", fontSize: "13px", color: "#64748b" }}>
                            Already have an account?{" "}
                            <Link href="/driver/login" style={{ color: "#fb923c" }}>Sign in</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
