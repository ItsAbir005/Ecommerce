"use client";

import { useState } from "react";
import { fetchApi } from "../../lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await fetchApi("/auth/register", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (success) {
        return (
            <div className="container-custom flex justify-center items-center min-h-[80vh]">
                <div className="card w-full max-w-[400px] text-center">
                    <div className="text-5xl text-emerald-500 mb-4">✓</div>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Registration Successful</h2>
                    <p className="text-muted">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-custom flex justify-center items-center min-h-[80vh]">
            <div className="card w-full max-w-[400px]">
                <h2 className="text-3xl font-bold mb-6 text-center gradient-text">Create Account</h2>
                {error && (
                    <div className="text-red-500 mb-4 text-center p-2 bg-red-500/10 rounded-lg">
                        {error}
                    </div>
                )}
                <form onSubmit={handleRegister} className="flex flex-col gap-6">
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
                    <button type="submit" className="btn btn-primary w-full py-4 text-lg">Sign Up</button>
                </form>
                <p className="mt-6 text-center text-muted">
                    Already have an account? <a href="/login" className="text-primary hover:text-primary-hover transition-colors">Sign in</a>
                </p>
            </div>
        </div>
    );
}
