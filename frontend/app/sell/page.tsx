"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type Category = { _id: string; name: string };

type Variant = { size: string; color: string; stock: string };

export default function SellPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [discount, setDiscount] = useState("0");
    const [categories, setCategories] = useState<Category[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [dragging, setDragging] = useState(false);

    // Submit state
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        fetch(`${API_URL}/categories`)
            .then(r => r.json())
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, []);

    // Guard: redirect if not logged in
    useEffect(() => {
        if (mounted && !user) {
            router.push("/login?redirect=/sell");
        }
    }, [mounted, user, router]);

    // Handle file selection
    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const valid = Array.from(files).filter(f =>
            ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 5 * 1024 * 1024
        );
        const newImages = [...images, ...valid].slice(0, 5);
        setImages(newImages);
        setPreviews(newImages.map(f => URL.createObjectURL(f)));
    };

    const removeImage = (idx: number) => {
        const newImages = images.filter((_, i) => i !== idx);
        const newPreviews = previews.filter((_, i) => i !== idx);
        setImages(newImages);
        setPreviews(newPreviews);
    };

    const addVariant = () => {
        setVariants(v => [...v, { size: "", color: "", stock: "1" }]);
    };

    const updateVariant = (idx: number, field: keyof Variant, value: string) => {
        setVariants(v => v.map((vi, i) => i === idx ? { ...vi, [field]: value } : vi));
    };

    const removeVariant = (idx: number) => {
        setVariants(v => v.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title || !description || !price || !stock || !categoryId) {
            setError("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("price", price);
            formData.append("stock", stock);
            formData.append("category_id", categoryId);
            formData.append("discount", discount);
            if (variants.length > 0) {
                formData.append("variants", JSON.stringify(variants.map(v => ({
                    ...v, stock: Number(v.stock)
                }))));
            }
            images.forEach(img => formData.append("images", img));

            const res = await fetch(`${API_URL}/products/sell`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to submit listing");

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    if (!mounted) return null;

    if (success) {
        return (
            <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                <div style={{
                    background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(99,102,241,0.05))",
                    border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: "24px",
                    padding: "52px 48px",
                    textAlign: "center",
                    maxWidth: "480px",
                    width: "100%",
                }}>
                    <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
                    <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "12px", color: "#fff" }}>
                        Listing Submitted!
                    </h2>
                    <p style={{ color: "#94a3b8", marginBottom: "8px", lineHeight: 1.6 }}>
                        Your item is now <strong style={{ color: "#fbbf24" }}>under review</strong>.
                        Our team will approve it within 24 hours.
                    </p>
                    <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>
                        You'll be notified via your account once it's live in the store.
                    </p>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                            onClick={() => { setSuccess(false); setTitle(""); setDescription(""); setPrice(""); setStock(""); setCategoryId(""); setImages([]); setPreviews([]); setVariants([]); setDiscount("0"); }}
                            style={{
                                padding: "12px 24px", borderRadius: "10px", border: "none",
                                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                                color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px",
                            }}>
                            List Another Item
                        </button>
                        <button
                            onClick={() => router.push("/sell/my-listings")}
                            style={{
                                padding: "12px 24px", borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.15)",
                                background: "rgba(255,255,255,0.05)",
                                color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: "14px",
                            }}>
                            My Listings →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "80vh", padding: "48px 24px", maxWidth: "860px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "40px" }}>
                <h1 style={{
                    fontSize: "42px", fontWeight: 800, marginBottom: "10px",
                    background: "linear-gradient(135deg, #818cf8, #6366f1, #a78bfa)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                    Sell Your Item
                </h1>
                <p style={{ color: "#6b7280", fontSize: "15px" }}>
                    Submit a listing — our team reviews it within 24 hrs before it goes live.
                </p>
                <div style={{
                    marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
                    borderRadius: "8px", padding: "8px 14px", fontSize: "13px", color: "#fbbf24",
                }}>
                    🔍 Admin Review Required &nbsp;→&nbsp; Listings go live after approval
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

                {/* ── Image Upload ── */}
                <section style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "20px", padding: "28px",
                }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#e2e8f0", marginBottom: "18px" }}>
                        📷 Product Images <span style={{ color: "#6b7280", fontWeight: 400, fontSize: "13px" }}>(Up to 5, max 5 MB each)</span>
                    </h2>

                    {/* Drag & drop zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dragging ? "#6366f1" : "rgba(99,102,241,0.3)"}`,
                            borderRadius: "14px",
                            padding: "36px",
                            textAlign: "center",
                            cursor: "pointer",
                            background: dragging ? "rgba(99,102,241,0.06)" : "rgba(0,0,0,0.2)",
                            transition: "all 0.2s",
                            marginBottom: "16px",
                        }}>
                        <div style={{ fontSize: "36px", marginBottom: "8px" }}>🖼️</div>
                        <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "4px" }}>
                            Drag & drop images here, or <span style={{ color: "#818cf8", fontWeight: 600 }}>click to browse</span>
                        </p>
                        <p style={{ color: "#6b7280", fontSize: "12px" }}>JPG, PNG, WEBP — max 5 MB per file</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={e => handleFiles(e.target.files)}
                            style={{ display: "none" }}
                        />
                    </div>

                    {/* Previews */}
                    {previews.length > 0 && (
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            {previews.map((src, i) => (
                                <div key={i} style={{ position: "relative" }}>
                                    <img src={src} alt="" style={{
                                        width: "100px", height: "100px", objectFit: "cover",
                                        borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)",
                                    }} />
                                    {i === 0 && (
                                        <span style={{
                                            position: "absolute", bottom: "4px", left: "4px",
                                            background: "#6366f1", color: "#fff", fontSize: "9px",
                                            fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                                        }}>COVER</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        style={{
                                            position: "absolute", top: "-6px", right: "-6px",
                                            width: "20px", height: "20px", borderRadius: "50%",
                                            background: "#ef4444", border: "none", color: "#fff",
                                            fontSize: "11px", cursor: "pointer", display: "flex",
                                            alignItems: "center", justifyContent: "center",
                                        }}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Product Details ── */}
                <section style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "20px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px",
                }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#e2e8f0" }}>📝 Product Details</h2>

                    <div>
                        <label style={labelStyle}>Title <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Vintage Leather Jacket"
                            style={inputStyle}
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Description <span style={{ color: "#ef4444" }}>*</span></label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe your item — condition, size, materials, history…"
                            rows={4}
                            style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={labelStyle}>Price ($) <span style={{ color: "#ef4444" }}>*</span></label>
                            <input
                                type="number" min="0" step="0.01"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="0.00"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Stock <span style={{ color: "#ef4444" }}>*</span></label>
                            <input
                                type="number" min="1"
                                value={stock}
                                onChange={e => setStock(e.target.value)}
                                placeholder="1"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Discount (%)</label>
                            <input
                                type="number" min="0" max="100"
                                value={discount}
                                onChange={e => setDiscount(e.target.value)}
                                placeholder="0"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Category <span style={{ color: "#ef4444" }}>*</span></label>
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                style={inputStyle}>
                                <option value="">Select…</option>
                                {categories.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* ── Variants ── */}
                <section style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "20px", padding: "28px",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#e2e8f0" }}>🎨 Variants <span style={{ color: "#6b7280", fontWeight: 400, fontSize: "13px" }}>(optional)</span></h2>
                        <button
                            type="button"
                            onClick={addVariant}
                            style={{
                                padding: "7px 16px", borderRadius: "8px",
                                background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                                color: "#818cf8", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                            }}>
                            + Add Variant
                        </button>
                    </div>

                    {variants.length === 0 ? (
                        <p style={{ color: "#4b5563", fontSize: "13px" }}>No variants added. Add size/color options if applicable.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {variants.map((v, i) => (
                                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px auto", gap: "10px", alignItems: "center" }}>
                                    <input
                                        value={v.size}
                                        onChange={e => updateVariant(i, "size", e.target.value)}
                                        placeholder="Size (e.g. M)"
                                        style={inputStyle}
                                    />
                                    <input
                                        value={v.color}
                                        onChange={e => updateVariant(i, "color", e.target.value)}
                                        placeholder="Color (e.g. Red)"
                                        style={inputStyle}
                                    />
                                    <input
                                        type="number" min="0"
                                        value={v.stock}
                                        onChange={e => updateVariant(i, "stock", e.target.value)}
                                        placeholder="Stock"
                                        style={inputStyle}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(i)}
                                        style={{
                                            padding: "8px 12px", borderRadius: "8px",
                                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                                            color: "#f87171", cursor: "pointer", fontSize: "13px",
                                        }}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Error & Submit ── */}
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: "12px", padding: "14px 18px", color: "#f87171", fontSize: "14px",
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        onClick={() => router.push("/sell/my-listings")}
                        style={{
                            padding: "13px 24px", borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(255,255,255,0.04)",
                            color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: "15px",
                        }}>
                        My Listings
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            padding: "13px 36px", borderRadius: "12px", border: "none",
                            background: submitting
                                ? "rgba(99,102,241,0.4)"
                                : "linear-gradient(135deg, #6366f1, #818cf8)",
                            color: "#fff", fontWeight: 700, cursor: submitting ? "wait" : "pointer",
                            fontSize: "15px", boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
                            transition: "all 0.2s",
                        }}>
                        {submitting ? "Submitting…" : "🚀 Submit Listing"}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#e2e8f0",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
};
