"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";

type Role = "customer" | "driver" | "admin";

const ROLES: { key: Role; icon: string; label: string; desc: string; gradient: string; border: string }[] = [
    {
        key: "customer",
        icon: "🛍️",
        label: "Customer",
        desc: "Shop products & track orders",
        gradient: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))",
        border: "rgba(99,102,241,0.4)",
    },
    {
        key: "driver",
        icon: "🚚",
        label: "Driver",
        desc: "Manage your deliveries",
        gradient: "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(251,146,60,0.05))",
        border: "rgba(251,146,60,0.4)",
    },
    {
        key: "admin",
        icon: "🛡️",
        label: "Admin",
        desc: "Manage the store",
        gradient: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))",
        border: "rgba(34,197,94,0.4)",
    },
];

const THEME: Record<Role, { color: string; focus: string; btn: string; accent: string }> = {
    customer: { color: "#818cf8", focus: "rgba(99,102,241,0.3)", btn: "linear-gradient(135deg,#6366f1,#4f46e5)", accent: "rgba(99,102,241,0.08)" },
    driver: { color: "#fb923c", focus: "rgba(251,146,60,0.3)", btn: "linear-gradient(135deg,#f97316,#ea580c)", accent: "rgba(251,146,60,0.08)" },
    admin: { color: "#22c55e", focus: "rgba(34,197,94,0.3)", btn: "linear-gradient(135deg,#22c55e,#16a34a)", accent: "rgba(34,197,94,0.08)" },
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [role, setRole] = useState<Role | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const theme = role ? THEME[role] : THEME.customer;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            if (role === "customer") {
                const data = await fetchApi("/auth/login", {
                    method: "POST",
                    body: JSON.stringify({ email, password }),
                });
                await login(data.token, "/products");

            } else if (role === "driver") {
                const res = await fetch(`${API}/drivers/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                localStorage.setItem("driverToken", data.token);
                localStorage.setItem("driverProfile", JSON.stringify(data.driver));
                router.push("/driver/dashboard");

            } else if (role === "admin") {
                const res = await fetch(`${API}/auth/admin/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                localStorage.setItem("adminToken", data.token);
                localStorage.setItem("adminProfile", JSON.stringify(data.admin));
                router.push("/admin");
            }
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "radial-gradient(ellipse at top, rgba(99,102,241,0.06) 0%, #0a0a0f 60%)",
            padding: "32px 16px",
        }}>
            <div style={{ width: "100%", maxWidth: "440px" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Welcome back</h1>
                    <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
                        {role ? `Signing in as ${role}` : "Who are you signing in as?"}
                    </p>
                </div>

                {/* Role selector */}
                {!role ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {ROLES.map(r => (
                            <button key={r.key} onClick={() => setRole(r.key)} style={{
                                display: "flex", alignItems: "center", gap: "16px",
                                padding: "18px 20px", borderRadius: "14px", border: `1px solid ${r.border}`,
                                background: r.gradient, cursor: "pointer", textAlign: "left",
                                transition: "all 0.2s", width: "100%",
                            }}>
                                <span style={{ fontSize: "30px" }}>{r.icon}</span>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "16px" }}>{r.label}</p>
                                    <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>{r.desc}</p>
                                </div>
                                <span style={{ marginLeft: "auto", color: "#64748b", fontSize: "20px" }}>→</span>
                            </button>
                        ))}

                        <p style={{ textAlign: "center", marginTop: "8px", fontSize: "13px", color: "#64748b" }}>
                            New customer?{" "}
                            <Link href="/register" style={{ color: "#818cf8" }}>Create account</Link>
                            {" · "}
                            <Link href="/driver/register" style={{ color: "#fb923c" }}>Register as driver</Link>
                        </p>
                    </div>
                ) : (
                    /* Login form */
                    <div style={{
                        background: theme.accent, border: `1px solid ${theme.focus}`,
                        borderRadius: "20px", padding: "32px", backdropFilter: "blur(12px)",
                    }}>
                        {/* Back button */}
                        <button onClick={() => { setRole(null); setError(""); setEmail(""); setPassword(""); }}
                            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px", marginBottom: "20px", padding: 0 }}>
                            ← Back
                        </button>

                        {/* Role badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                            <span style={{ fontSize: "26px" }}>{ROLES.find(r => r.key === role)?.icon}</span>
                            <div>
                                <p style={{ margin: 0, fontWeight: 700, color: "#fff" }}>
                                    {ROLES.find(r => r.key === role)?.label} Sign In
                                </p>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                                    {ROLES.find(r => r.key === role)?.desc}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {[
                                { label: "Email", type: "email", val: email, set: setEmail },
                                { label: "Password", type: "password", val: password, set: setPassword },
                            ].map(({ label, type, val, set }) => (
                                <div key={label}>
                                    <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>{label}</label>
                                    <input type={type} value={val} onChange={e => set(e.target.value)} required
                                        style={{
                                            width: "100%", padding: "12px 14px", background: "rgba(0,0,0,0.4)",
                                            border: `1px solid ${theme.focus}`, borderRadius: "10px",
                                            color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                                        }} />
                                </div>
                            ))}

                            {error && (
                                <div style={{ padding: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "13px" }}>
                                    {error}
                                </div>
                            )}

                            <button type="submit" disabled={loading} style={{
                                padding: "13px", borderRadius: "10px", border: "none", cursor: "pointer",
                                background: theme.btn, color: "#fff", fontSize: "15px", fontWeight: 700,
                                opacity: loading ? 0.7 : 1, marginTop: "4px",
                            }}>
                                {loading ? "Signing in..." : `Sign In as ${role?.charAt(0).toUpperCase()}${role?.slice(1)}`}
                            </button>
                        </form>

                        {role === "customer" && (
                            <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#64748b" }}>
                                Don't have an account?{" "}
                                <Link href="/register" style={{ color: theme.color }}>Sign up</Link>
                            </p>
                        )}
                        {role === "driver" && (
                            <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#64748b" }}>
                                New driver?{" "}
                                <Link href="/driver/register" style={{ color: theme.color }}>Register here</Link>
                            </p>
                        )}
                        {role === "admin" && (
                            <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#64748b" }}>
                                Need an account?{" "}
                                <Link href="/admin/register" style={{ color: theme.color }}>Register with secret key</Link>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
