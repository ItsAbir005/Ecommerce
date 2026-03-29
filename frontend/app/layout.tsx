"use client";

import "./globals.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { ToastProvider } from "./components/Toast";
import Link from "next/link";
import { useEffect, useState } from "react";


function Navigation() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <nav className="glass-nav">
      <div className="container-custom flex justify-between items-center h-[70px]">
        <Link href="/" className="text-2xl font-bold tracking-tight gradient-text">
          Aura
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/" className="text-muted hover:text-white transition-colors duration-200 text-sm">Home</Link>
          <Link href="/categories" className="text-muted hover:text-white transition-colors duration-200 text-sm">Categories</Link>
          <Link href="/products" className="text-muted hover:text-white transition-colors duration-200 text-sm">Products</Link>
          {mounted && user && (
            <Link href="/orders" className="text-muted hover:text-white transition-colors duration-200 text-sm">Orders</Link>
          )}
          {mounted && user && (
            <Link href="/sell" className="text-muted hover:text-white transition-colors duration-200 text-sm flex items-center gap-1">
              <span>🏷️</span> Sell
            </Link>
          )}


          {/* Cart icon with live badge */}
          <Link href="/cart" className="relative text-muted hover:text-white transition-colors duration-200 text-sm flex items-center gap-1.5">
            <span className="text-base">🛒</span>
            <span>Cart</span>
            {mounted && itemCount > 0 && (
              <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md shadow-indigo-500/50">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          {mounted && user ? (
            <div className="flex gap-4 items-center">
              <Link href="/profile" className="text-primary hover:text-primary-hover transition-colors font-medium text-sm">
                {user.name.split(" ")[0]}
              </Link>
              <button onClick={logout} className="btn bg-white/5 border border-card-border hover:bg-white/10 text-sm py-2">
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary text-sm py-2">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Navigation />
              <main>{children}</main>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
