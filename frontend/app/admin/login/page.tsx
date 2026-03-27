"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const res = await fetch(`${API}/auth/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            // Store admin token separately from customer token
            localStorage.setItem("adminToken", data.token);
            // Also store as normal token so admin can access storefront seamlessly
            localStorage.setItem("token", data.token);
            localStorage.setItem("adminProfile", JSON.stringify(data.admin));
            router.push("/admin");
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "radial-gradient(ellipse at top, rgba(99,102,241,0.1) 0%, #0a0a0f 60%)",
            padding: "24px",
        }}>
            <div style={{
                width: "100%", maxWidth: "420px",
                background: "linear-gradient(135deg, rgba(99,102,241,0.07), rgba(19,19,31,0.95))",
                border: "1px solid rgba(99,102,241,0.2)", borderRadius: "20px",
                padding: "40px", backdropFilter: "blur(20px)",
            }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ fontSize: "44px", marginBottom: "10px" }}>🛡️</div>
                    <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Admin Portal</h1>
                    <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Sign in to manage your store</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[
                        { label: "Email", type: "email", val: email, set: setEmail, placeholder: "admin@aura.com" },
                        { label: "Password", type: "password", val: password, set: setPassword, placeholder: "••••••••" },
                    ].map(({ label, type, val, set, placeholder }) => (
                        <div key={label}>
                            <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>{label}</label>
                            <input type={type} value={val} onChange={e => set(e.target.value)} required placeholder={placeholder}
                                style={{
                                    width: "100%", padding: "12px 14px", background: "rgba(0,0,0,0.4)",
                                    border: "1px solid rgba(99,102,241,0.25)", borderRadius: "10px",
                                    color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                                }} />
                        </div>
                    ))}

                    {error && (
                        <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "13px" }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={{
                        padding: "13px", borderRadius: "10px", border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                        color: "#fff", fontSize: "15px", fontWeight: 700,
                        opacity: loading ? 0.7 : 1, marginTop: "4px",
                    }}>
                        {loading ? "Signing in..." : "Sign In as Admin"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#64748b" }}>
                    Need an admin account?{" "}
                    <Link href="/admin/register" style={{ color: "#818cf8" }}>Register with secret key</Link>
                </p>
            </div>
        </div>
    );
}
