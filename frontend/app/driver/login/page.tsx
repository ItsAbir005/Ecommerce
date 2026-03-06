"use client";

import { useState } from "react";
import { useDriver } from "../../context/DriverContext";
import { useRouter } from "next/navigation";

export default function DriverLoginPage() {
    const { login } = useDriver();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await login(email, password);
            router.push("/driver/dashboard");
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "radial-gradient(ellipse at top, rgba(251,146,60,0.08) 0%, #0a0a0f 60%)",
            padding: "24px",
        }}>
            <div style={{
                width: "100%", maxWidth: "420px",
                background: "linear-gradient(135deg, rgba(251,146,60,0.07) 0%, rgba(19,19,31,0.9) 100%)",
                border: "1px solid rgba(251,146,60,0.2)",
                borderRadius: "20px", padding: "40px", backdropFilter: "blur(20px)",
            }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>🚚</div>
                    <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Driver Portal</h1>
                    <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>Sign in to your delivery account</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>Email</label>
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)} required
                            style={{
                                width: "100%", padding: "12px 14px", background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(251,146,60,0.2)", borderRadius: "10px",
                                color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                            }}
                            placeholder="driver@example.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>Password</label>
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)} required
                            style={{
                                width: "100%", padding: "12px 14px", background: "rgba(0,0,0,0.4)",
                                border: "1px solid rgba(251,146,60,0.2)", borderRadius: "10px",
                                color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "13px" }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={{
                        padding: "13px", borderRadius: "10px", border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg, #f97316, #ea580c)",
                        color: "#fff", fontSize: "15px", fontWeight: 700,
                        opacity: loading ? 0.7 : 1, transition: "all 0.2s",
                        marginTop: "4px",
                    }}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#64748b" }}>
                    New driver?{" "}
                    <a href="mailto:admin@aura.com" style={{ color: "#fb923c" }}>Contact admin to register</a>
                </p>
            </div>
        </div>
    );
}
