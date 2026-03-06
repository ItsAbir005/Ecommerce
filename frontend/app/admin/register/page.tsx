"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminRegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "", adminSecret: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const res = await fetch(`${API}/auth/admin/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminProfile", JSON.stringify(data.admin));
            router.push("/admin");
        } catch (err: any) {
            setError(err.message || "Registration failed");
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
                width: "100%", maxWidth: "440px",
                background: "linear-gradient(135deg, rgba(99,102,241,0.07), rgba(19,19,31,0.95))",
                border: "1px solid rgba(99,102,241,0.2)", borderRadius: "20px",
                padding: "40px", backdropFilter: "blur(20px)",
            }}>
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{ fontSize: "44px", marginBottom: "10px" }}>🔐</div>
                    <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Create Admin Account</h1>
                    <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Requires the admin secret key from your server</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {[
                        { label: "Full Name", key: "name", type: "text", placeholder: "Admin Name" },
                        { label: "Email", key: "email", type: "email", placeholder: "admin@aura.com" },
                        { label: "Password (min 8 chars)", key: "password", type: "password", placeholder: "StrongPass@123" },
                    ].map(({ label, key, type, placeholder }) => (
                        <div key={key}>
                            <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>{label}</label>
                            <input type={type} value={(form as any)[key]} onChange={e => set(key, e.target.value)} required placeholder={placeholder}
                                style={{ width: "100%", padding: "12px 14px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                        </div>
                    ))}

                    {/* Secret key field */}
                    <div style={{ paddingTop: "4px" }}>
                        <label style={{ display: "block", fontSize: "13px", marginBottom: "6px", color: "#818cf8" }}>🔑 Admin Secret Key</label>
                        <input type="password" value={form.adminSecret} onChange={e => set("adminSecret", e.target.value)} required
                            placeholder="From your ADMIN_SECRET_KEY env variable"
                            style={{ width: "100%", padding: "12px 14px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                        <p style={{ fontSize: "11px", color: "#475569", marginTop: "5px" }}>
                            Set in backend .env as <code style={{ color: "#818cf8" }}>ADMIN_SECRET_KEY</code>
                        </p>
                    </div>

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
                        {loading ? "Creating..." : "Create Admin Account"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "18px", fontSize: "13px", color: "#64748b" }}>
                    Already have an account? <Link href="/admin/login" style={{ color: "#818cf8" }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
