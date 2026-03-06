"use client";

import { DriverProvider, useDriver } from "../context/DriverContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function DriverNav() {
    const { driver, logout, setOnlineStatus } = useDriver();
    const router = useRouter();
    const pathname = usePathname();
    const [toggling, setToggling] = useState(false);
    const isOnline = driver?.status === "online" || driver?.status === "busy";

    const handleToggle = async () => {
        if (!driver) return;
        setToggling(true);
        try {
            if (isOnline) {
                await setOnlineStatus("offline");
            } else {
                // Request geolocation when going online
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            await setOnlineStatus("online", pos.coords.latitude, pos.coords.longitude);
                            setToggling(false);
                        },
                        async () => {
                            // Fallback with default location if permission denied
                            await setOnlineStatus("online", 22.5726, 88.3639);
                            setToggling(false);
                        }
                    );
                    return;
                }
                await setOnlineStatus("online", 22.5726, 88.3639);
            }
        } finally {
            setToggling(false);
        }
    };

    const handleLogout = () => { logout(); router.push("/driver/login"); };

    const navLinks = [
        { href: "/driver/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/driver/history", label: "History", icon: "📋" },
    ];

    return (
        <nav style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            background: "linear-gradient(135deg, rgba(15,10,5,0.97) 0%, rgba(25,15,5,0.95) 100%)",
            borderBottom: "1px solid rgba(251,146,60,0.2)",
            backdropFilter: "blur(20px)",
        }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {/* Logo */}
                <Link href="/driver/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                    <span style={{ fontSize: "22px" }}>🚚</span>
                    <span style={{ fontSize: "18px", fontWeight: 700, background: "linear-gradient(135deg, #fb923c, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Aura Driver
                    </span>
                </Link>

                {/* Nav links */}
                <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                    {navLinks.map(({ href, label, icon }) => (
                        <Link key={href} href={href} style={{
                            textDecoration: "none", fontSize: "14px",
                            color: pathname === href ? "#fb923c" : "#94a3b8",
                            fontWeight: pathname === href ? 600 : 400,
                            transition: "color 0.2s",
                        }}>
                            {icon} {label}
                        </Link>
                    ))}
                </div>

                {/* Online toggle + logout */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button onClick={handleToggle} disabled={toggling || driver?.status === "busy"} style={{
                        padding: "8px 18px", borderRadius: "999px", border: "none", cursor: "pointer",
                        fontWeight: 600, fontSize: "13px", transition: "all 0.25s",
                        background: isOnline
                            ? "linear-gradient(135deg, #22c55e, #16a34a)"
                            : "rgba(255,255,255,0.05)",
                        color: isOnline ? "#fff" : "#94a3b8",
                        border: isOnline ? "none" : "1px solid rgba(255,255,255,0.1)",
                        opacity: toggling ? 0.6 : 1,
                    }}>
                        {toggling ? "..." : isOnline ? "🟢 Online" : "⚫ Go Online"}
                    </button>
                    {driver && (
                        <span style={{ fontSize: "14px", color: "#fb923c", fontWeight: 600 }}>
                            {driver.name.split(" ")[0]}
                        </span>
                    )}
                    <button onClick={handleLogout} style={{
                        padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: "13px", cursor: "pointer",
                    }}>
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

function DriverLayoutInner({ children }: { children: React.ReactNode }) {
    const { driver, loading } = useDriver();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !driver && pathname !== "/driver/login") {
            router.push("/driver/login");
        }
    }, [driver, loading, pathname, router]);

    if (pathname === "/driver/login") {
        return <>{children}</>;
    }

    return (
        <>
            <DriverNav />
            <main style={{ paddingTop: "68px", minHeight: "100vh", background: "radial-gradient(ellipse at top, rgba(251,146,60,0.04) 0%, #0a0a0f 60%)" }}>
                {children}
            </main>
        </>
    );
}

export default function DriverLayout({ children }: { children: React.ReactNode }) {
    return (
        <DriverProvider>
            <DriverLayoutInner>{children}</DriverLayoutInner>
        </DriverProvider>
    );
}
