"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextValue {
    toast: (type: ToastType, title: string, message?: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const ICONS: Record<ToastType, string> = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
};

const COLORS: Record<ToastType, { bar: string; border: string; bg: string }> = {
    success: {
        bar: "#34d399",
        border: "rgba(52,211,153,0.25)",
        bg: "rgba(52,211,153,0.06)",
    },
    error: {
        bar: "#f87171",
        border: "rgba(248,113,113,0.25)",
        bg: "rgba(248,113,113,0.06)",
    },
    info: {
        bar: "#818cf8",
        border: "rgba(129,140,248,0.25)",
        bg: "rgba(129,140,248,0.06)",
    },
    warning: {
        bar: "#fbbf24",
        border: "rgba(251,191,36,0.25)",
        bg: "rgba(251,191,36,0.06)",
    },
};

// ── Toast Item ─────────────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const c = COLORS[toast.type];
    return (
        <div
            style={{
                background: `linear-gradient(135deg, ${c.bg}, rgba(19,19,31,0.95))`,
                border: `1px solid ${c.border}`,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: "14px",
                padding: "14px 16px 14px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                minWidth: "320px",
                maxWidth: "420px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                position: "relative",
                overflow: "hidden",
                animation: "slideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
        >
            {/* Left color bar */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "4px",
                    background: c.bar,
                    borderRadius: "14px 0 0 14px",
                }}
            />

            {/* Icon */}
            <span style={{ fontSize: "18px", lineHeight: 1, marginTop: "1px", flexShrink: 0 }}>
                {ICONS[toast.type]}
            </span>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }}>
                    {toast.title}
                </p>
                {toast.message && (
                    <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#94a3b8", lineHeight: 1.4 }}>
                        {toast.message}
                    </p>
                )}
            </div>

            {/* Close button */}
            <button
                onClick={() => onRemove(toast.id)}
                style={{
                    background: "none",
                    border: "none",
                    color: "#475569",
                    cursor: "pointer",
                    fontSize: "16px",
                    lineHeight: 1,
                    padding: "2px 4px",
                    borderRadius: "6px",
                    flexShrink: 0,
                    transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
            >
                ×
            </button>
        </div>
    );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const remove = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        clearTimeout(timerRef.current[id]);
        delete timerRef.current[id];
    }, []);

    const toast = useCallback(
        (type: ToastType, title: string, message?: string) => {
            const id = Math.random().toString(36).slice(2);
            setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
            timerRef.current[id] = setTimeout(() => remove(id), 4500);
        },
        [remove]
    );

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            {/* Toast Container */}
            <div
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    alignItems: "flex-end",
                    pointerEvents: "none",
                }}
            >
                {toasts.map((t) => (
                    <div key={t.id} style={{ pointerEvents: "all" }}>
                        <ToastItem toast={t} onRemove={remove} />
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(40px) scale(0.9); }
                    to   { opacity: 1; transform: translateX(0) scale(1); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}
