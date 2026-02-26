"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!loading && !user && mounted) {
            router.push("/login");
        }
    }, [user, loading, router, mounted]);

    if (!mounted || loading) {
        return (
            <div className="container-custom mt-16 flex justify-center items-center min-h-[60vh]">
                <div className="h-10 w-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="container-custom mt-16 max-w-4xl min-h-[80vh]">
            <h1 className="text-4xl font-bold mb-8 gradient-text">Your Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="card md:col-span-1 h-fit">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-indigo-500/20 text-primary flex items-center justify-center text-3xl font-bold mb-4">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-2xl font-semibold mb-1">{user.name}</h2>
                        <p className="text-muted mb-4">{user.role}</p>
                        <button
                            onClick={logout}
                            className="btn bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 w-full"
                        >
                            Log Out
                        </button>
                    </div>
                </div>

                <div className="card md:col-span-2">
                    <h3 className="text-xl font-semibold mb-6 border-b border-card-border pb-4">Account Details</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm text-muted mb-1">Full Name</label>
                            <div className="p-3 bg-black/20 rounded-lg border border-card-border/50 text-white">
                                {user.name}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-muted mb-1">Email Address</label>
                            <div className="p-3 bg-black/20 rounded-lg border border-card-border/50 text-white">
                                {user.email}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-muted mb-1">Account Role</label>
                            <div className="p-3 bg-black/20 rounded-lg border border-card-border/50 text-white capitalize">
                                {user.role}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
