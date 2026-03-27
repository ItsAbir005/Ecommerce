"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Stats {
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    totalRevenue: number;
    pendingOrders: number;
    activeDrivers: number;
    pendingShipments: number;
}

const StatCard = ({ icon, label, value, sub, color }: {
    icon: string; label: string; value: string | number; sub?: string; color: string;
}) => (
    <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px", padding: "22px", display: "flex", flexDirection: "column", gap: "8px",
    }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
            <span style={{ fontSize: "20px" }}>{icon}</span>
        </div>
        <p style={{ fontSize: "28px", fontWeight: 700, color, margin: 0, lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{sub}</p>}
    </div>
);

const QuickLink = ({ href, icon, label, desc, target }: { href: string; icon: string; label: string; desc: string; target?: string; }) => {
    const isExternal = target === "_blank";
    const commonStyle = {
        display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "14px", textDecoration: "none", transition: "all 0.2s",
    };
    const content = (
        <>
            <span style={{ fontSize: "28px" }}>{icon}</span>
            <div>
                <p style={{ margin: 0, fontWeight: 600, color: "#e2e8f0", fontSize: "15px" }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>{desc}</p>
            </div>
            <span style={{ marginLeft: "auto", color: "#64748b", fontSize: "18px" }}>→</span>
        </>
    );

    if (isExternal) {
        return (
            <a href={href} target={target} rel="noopener noreferrer" style={commonStyle}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
                {content}
            </a>
        );
    }

    return (
        <Link href={href} style={commonStyle}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
            {content}
        </Link>
    );
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [adminName, setAdminName] = useState("");

    useEffect(() => {
        const profile = localStorage.getItem("adminProfile");
        if (profile) setAdminName(JSON.parse(profile).name || "Admin");
    }, []);

    useEffect(() => {
        const load = async () => {
            const token = localStorage.getItem("adminToken");
            try {
                // Fetch stats in parallel
                const [ordersRes, productsRes, usersRes, driversRes] = await Promise.allSettled([
                    fetch(`${API}/orders?limit=1000`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
                    fetch(`${API}/products?limit=1`).then(r => r.json()),
                    fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
                    fetch(`${API}/drivers`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
                ]);

                const orders = ordersRes.status === "fulfilled" ? ordersRes.value : null;
                const products = productsRes.status === "fulfilled" ? productsRes.value : null;
                const users = usersRes.status === "fulfilled" ? usersRes.value : null;
                const drivers = driversRes.status === "fulfilled" ? driversRes.value : null;

                const orderList: any[] = orders?.orders || [];
                const revenue = orderList.filter(o => o.payment_status === "paid").reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
                const pending = orderList.filter(o => o.status === "pending").length;

                setStats({
                    totalOrders: orders?.total || orderList.length,
                    totalProducts: products?.total || 0,
                    totalUsers: Array.isArray(users) ? users.length : users?.total || 0,
                    totalRevenue: revenue,
                    pendingOrders: pending,
                    activeDrivers: Array.isArray(drivers) ? drivers.filter((d: any) => d.status === "online").length : 0,
                    pendingShipments: 0,
                });
            } catch (err) {
                console.error("Dashboard stats error:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                    Welcome back, {adminName.split(" ")[0]} 🛡️
                </h1>
                <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
                    Here's what's happening with your store today.
                </p>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ height: "110px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }} />
                    ))}
                </div>
            ) : stats && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "16px" }}>
                        <StatCard icon="💰" label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} sub="From paid orders" color="#22c55e" />
                        <StatCard icon="📋" label="Total Orders" value={stats.totalOrders} sub={`${stats.pendingOrders} pending`} color="#818cf8" />
                        <StatCard icon="📦" label="Products" value={stats.totalProducts} color="#fb923c" />
                        <StatCard icon="👥" label="Users" value={stats.totalUsers} color="#38bdf8" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
                        <StatCard icon="🚚" label="Online Drivers" value={stats.activeDrivers} sub="Currently active" color="#22c55e" />
                        <StatCard icon="⏳" label="Pending Orders" value={stats.pendingOrders} sub="Need attention" color="#facc15" />
                        <StatCard icon="🔄" label="System" value="Healthy" sub="All services running" color="#34d399" />
                    </div>
                </>
            )}

            {/* Quick Links */}
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#e2e8f0", marginBottom: "16px" }}>Quick Actions</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                <QuickLink href="/admin/products" icon="📦" label="Manage Products" desc="Add, edit or delete products" />
                <QuickLink href="/admin/drivers" icon="🚚" label="Manage Drivers" desc="View and block driver accounts" />
                <QuickLink href="/admin/register" icon="🔐" label="Create Admin Account" desc="Add another admin with secret key" />
                <QuickLink href="/" icon="🛍️" label="View Store" desc="See customer-facing storefront" target="_blank" />
            </div>
        </div>
    );
}
