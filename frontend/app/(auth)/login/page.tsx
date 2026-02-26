"use client";

import { useState } from "react";
import { fetchApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const data = await fetchApi("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            await login(data.token, "/products");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="container-custom flex justify-center items-center min-h-[80vh]">
            <div className="card w-full max-w-[400px]">
                <h2 className="text-3xl font-bold mb-6 text-center gradient-text">Sign In</h2>
                {error && (
                    <div className="text-red-500 mb-4 text-center p-2 bg-red-500/10 rounded-lg">
                        {error}
                    </div>
                )}
                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                    <div>
                        <label className="block mb-2 text-muted">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 rounded-lg border border-card-border bg-black/20 text-white outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-muted">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 rounded-lg border border-card-border bg-black/20 text-white outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full py-4 text-lg">Sign In</button>
                </form>
                <p className="mt-6 text-center text-muted">
                    Don't have an account? <a href="/register" className="text-primary hover:text-primary-hover transition-colors">Sign up</a>
                </p>
            </div>
        </div>
    );
}
