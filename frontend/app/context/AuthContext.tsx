"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchApi } from "../lib/api";
import { useRouter } from "next/navigation";

interface User {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, redirectUrl?: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const userData = await fetchApi("/auth/me");
                setUser(userData);
            } catch (error) {
                console.error("Failed to fetch user", error);
                localStorage.removeItem("token");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (token: string, redirectUrl = "/products") => {
        localStorage.setItem("token", token);
        try {
            const userData = await fetchApi("/auth/me", { token });
            setUser(userData);
            router.push(redirectUrl);
        } catch (error) {
            console.error("Failed to fetch user after login", error);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
