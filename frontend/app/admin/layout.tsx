"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Admin uses the same JWT as customer (role: 'admin'), stored as adminToken
// Falls back to customer token for backwards compat with existing admin/products page

function AdminNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [adminName, setAdminName] = useState("");

    useEffect(() => {
        const profile = localStorage.getItem("adminProfile");
        if (profile) {
            setAdminName(JSON.parse(profile).name?.split(" ")[0] || "Admin");
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminProfile");
        router.push("/admin/login");
    };

    const links = [
        { href: "/admin", label: "Dashboard", icon: "📊" },
        { href: "/admin/products", label: "Products", icon: "📦" },
        { href: "/admin/drivers", label: "Drivers", icon: "🚚" },
    ];

    return (
        <nav style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            background: "linear-gradient(135deg, rgba(8,8,20,0.97), rgba(15,12,35,0.95))",
            borderBottom: "1px solid rgba(99,102,241,0.2)",
            backdropFilter: "blur(20px)",
        }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", gap: "32px" }}>
                {/* Logo */}
                <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
                    <span style={{ fontSize: "20px" }}>🛡️</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, background: "linear-gradient(135deg, #818cf8, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Aura Admin
                    </span>
                </Link>

                {/* Nav links */}
                <div style={{ display: "flex", gap: "6px", flex: 1 }}>
                    {links.map(({ href, label, icon }) => {
                        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                        return (
                            <Link key={href} href={href} style={{
                                padding: "6px 14px", borderRadius: "8px", fontSize: "14px", textDecoration: "none",
                                fontWeight: active ? 600 : 400,
                                background: active ? "rgba(99,102,241,0.15)" : "transparent",
                                color: active ? "#818cf8" : "#94a3b8",
                                border: active ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                                transition: "all 0.15s",
                            }}>
                                {icon} {label}
                            </Link>
                        );
                    })}
                </div>

                {/* Admin info + logout */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    {adminName && (
                        <span style={{ fontSize: "13px", color: "#818cf8", fontWeight: 600 }}>
                            👤 {adminName}
                        </span>
                    )}
                    <button onClick={handleLogout} style={{
                        padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)", color: "#94a3b8", fontSize: "13px", cursor: "pointer",
                    }}>
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthPage = pathname === "/admin/login" || pathname === "/admin/register";

    useEffect(() => {
        if (!isAuthPage) {
            const token = localStorage.getItem("adminToken");
            if (!token) router.push("/admin/login");
        }
    }, [pathname, isAuthPage, router]);

    if (isAuthPage) return <>{children}</>;

    return (
        <>
            <AdminNav />
            <main style={{
                paddingTop: "64px", minHeight: "100vh",
                background: "radial-gradient(ellipse at top, rgba(99,102,241,0.05) 0%, #0a0a0f 60%)",
            }}>
                {children}
            </main>
        </>
    );
}
