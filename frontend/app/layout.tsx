"use client";

import "./globals.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";

function Navigation() {
  const { user, logout } = useAuth();
  // Add mounted state to prevent hydration mismatch for authentication
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="glass-nav">
      <div className="container-custom flex justify-between items-center h-[70px]">
        <Link href="/" className="text-2xl font-bold tracking-tight gradient-text">
          Aura
        </Link>
        <div className="flex gap-8 items-center">
          <Link href="/" className="text-muted hover:text-white transition-colors duration-200">Home</Link>
          <Link href="/products" className="text-muted hover:text-white transition-colors duration-200">Products</Link>
          <Link href="/cart" className="text-muted hover:text-white transition-colors duration-200">Cart</Link>
          {mounted && user ? (
            <div className="flex gap-4 items-center">
              <Link href="/profile" className="text-primary hover:text-primary-hover transition-colors font-medium">
                Profile
              </Link>
              <button onClick={logout} className="btn bg-white/5 border border-card-border hover:bg-white/10 text-sm py-2">
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <Navigation />
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
