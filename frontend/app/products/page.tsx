"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// ── Types ─────────────────────────────────────────────────────────────────────
type Product = {
    _id: string;
    title: string;
    description: string;
    price: number;
    stock: number;
    images?: string[];
    discount: number;
    category_id: { _id: string; name: string } | string;
};

type Category = { _id: string; name: string };

const SORT_OPTIONS = [
    { label: "Newest First", value: "" },
    { label: "Price: Low → High", value: "price" },
    { label: "Price: High → Low", value: "-price" },
    { label: "Name: A → Z", value: "title" },
    { label: "Name: Z → A", value: "-title" },
];

const PAGE_SIZE_OPTIONS = [12, 24, 48];

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedCat, setSelectedCat] = useState("");
    const [sort, setSort] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [limit, setLimit] = useState(12);
    const [cartMsg, setCartMsg] = useState<string | null>(null);
    const [cartError, setCartError] = useState<string | null>(null);
    const [addingId, setAddingId] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { user } = useAuth();
    const { addItem } = useCart();

    // Debounce search input
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    // Fetch categories once
    useEffect(() => {
        fetchApi("/categories")
            .then((data) => setCategories(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, []);

    // Fetch products whenever filters change
    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
                ...(selectedCat ? { category: selectedCat } : {}),
                ...(sort ? { sort } : {}),
            });
            const data = await fetchApi(`/products?${params.toString()}`);
            setProducts(data.products ?? []);
            setTotalPages(data.pages ?? 1);
            setTotalCount(data.total ?? 0);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearch, selectedCat, sort]);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    const handleAddToCart = async (product: Product) => {
        if (product.stock === 0) return;
        if (!user) {
            setCartError("Please sign in to add items to your cart.");
            setTimeout(() => setCartError(null), 3000);
            return;
        }
        setAddingId(product._id);
        try {
            await addItem(product._id, 1);
            setCartMsg(`"${product.title.substring(0, 30)}" added to cart!`);
            setTimeout(() => setCartMsg(null), 2500);
        } catch (err: any) {
            setCartError(err.message || "Failed to add to cart");
            setTimeout(() => setCartError(null), 3000);
        } finally {
            setAddingId(null);
        }
    };

    const discountedPrice = (price: number, discount: number) =>
        discount > 0 ? (price * (1 - discount / 100)).toFixed(2) : null;

    const resetFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setSelectedCat("");
        setSort("");
        setPage(1);
        setLimit(12);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-[80vh] py-10">
            {/* Toast */}
            {cartMsg && (
                <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium">
                    🛒 {cartMsg}
                </div>
            )}
            {cartError && (
                <div className="fixed bottom-6 right-6 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium">
                    ⚠ {cartError}
                </div>
            )}

            <div className="container-custom">
                {/* ── Page Header ── */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">All Products</h1>
                    <p className="text-muted text-base">
                        {totalCount > 0 ? `Showing ${products.length} of ${totalCount} products` : "Browse our full collection"}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* ── Sidebar ── */}
                    <aside className="lg:w-64 flex-shrink-0 space-y-6">
                        {/* Search */}
                        <div className="card !p-4 space-y-2">
                            <label className="text-xs uppercase tracking-widest text-muted font-semibold">Search</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products…"
                                    className="w-full bg-black/30 border border-card-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                                />
                                {search && (
                                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white text-sm">✕</button>
                                )}
                            </div>
                        </div>

                        {/* Category filter */}
                        <div className="card !p-4 space-y-2">
                            <label className="text-xs uppercase tracking-widest text-muted font-semibold">Category</label>
                            <div className="space-y-1">
                                <button
                                    onClick={() => { setSelectedCat(""); setPage(1); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCat === "" ? "bg-primary text-white font-medium" : "text-muted hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    All Categories
                                </button>
                                {categories.map((c) => (
                                    <button
                                        key={c._id}
                                        onClick={() => { setSelectedCat(c._id); setPage(1); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCat === c._id ? "bg-primary text-white font-medium" : "text-muted hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="card !p-4 space-y-2">
                            <label className="text-xs uppercase tracking-widest text-muted font-semibold">Sort By</label>
                            <div className="space-y-1">
                                {SORT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setSort(opt.value); setPage(1); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${sort === opt.value ? "bg-primary text-white font-medium" : "text-muted hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reset */}
                        {(search || selectedCat || sort || limit !== 12) && (
                            <button
                                onClick={resetFilters}
                                className="w-full py-2 px-4 rounded-lg border border-card-border text-muted hover:text-white hover:border-white/30 text-sm transition-all"
                            >
                                ✕ Clear All Filters
                            </button>
                        )}
                    </aside>

                    {/* ── Main Content ── */}
                    <main className="flex-1 min-w-0">
                        {/* Top bar — items-per-page + count */}
                        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
                            <span className="text-muted text-sm">
                                Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
                            </span>
                            <div className="flex items-center gap-2 text-sm text-muted">
                                <span>Show</span>
                                {PAGE_SIZE_OPTIONS.map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => { setLimit(n); setPage(1); }}
                                        className={`px-3 py-1 rounded-lg border transition-colors ${limit === n
                                            ? "bg-primary border-primary text-white font-semibold"
                                            : "border-card-border text-muted hover:border-white/30 hover:text-white"
                                            }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                                <span>per page</span>
                            </div>
                        </div>

                        {/* Loading skeleton */}
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {Array.from({ length: limit > 12 ? 12 : limit }).map((_, i) => (
                                    <div key={i} className="card animate-pulse !p-0 overflow-hidden">
                                        <div className="h-48 bg-white/5" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-4 bg-white/5 rounded w-3/4" />
                                            <div className="h-3 bg-white/5 rounded w-full" />
                                            <div className="h-3 bg-white/5 rounded w-2/3" />
                                            <div className="h-9 bg-white/5 rounded mt-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                                <p className="text-muted mb-6">Try adjusting your search or filters.</p>
                                <button onClick={resetFilters} className="btn btn-primary">Clear Filters</button>
                            </div>
                        ) : (
                            <>
                                {/* Product Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {products.map((product) => {
                                        const finalPrice = discountedPrice(product.price, product.discount);
                                        const outOfStock = product.stock === 0;
                                        return (
                                            <div key={product._id} className="card flex flex-col h-full group !p-0 overflow-hidden">
                                                {/* Image */}
                                                <div className="relative h-52 bg-black/40 overflow-hidden">
                                                    {product.images?.[0] ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full">
                                                            <span className="text-5xl opacity-30">📦</span>
                                                        </div>
                                                    )}
                                                    {/* Badges */}
                                                    <div className="absolute top-3 left-3 flex gap-2">
                                                        {product.discount > 0 && (
                                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                                -{product.discount}%
                                                            </span>
                                                        )}
                                                        {outOfStock && (
                                                            <span className="bg-gray-700 text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">
                                                                Out of Stock
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex flex-col flex-1 p-4">
                                                    <h3 className="font-semibold text-base leading-snug mb-1 line-clamp-2">{product.title}</h3>
                                                    <p className="text-muted text-xs leading-relaxed flex-1 mb-3 line-clamp-2">{product.description}</p>

                                                    {/* Price */}
                                                    <div className="flex items-baseline gap-2 mb-3">
                                                        {finalPrice ? (
                                                            <>
                                                                <span className="text-emerald-400 font-bold text-lg">${finalPrice}</span>
                                                                <span className="text-muted line-through text-sm">${product.price.toFixed(2)}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-emerald-400 font-bold text-lg">${product.price.toFixed(2)}</span>
                                                        )}
                                                    </div>

                                                    {/* Stock indicator */}
                                                    <div className="flex items-center gap-1 mb-3">
                                                        <span className={`w-2 h-2 rounded-full ${outOfStock ? "bg-red-500" : product.stock < 10 ? "bg-yellow-400" : "bg-emerald-400"}`} />
                                                        <span className="text-xs text-muted">
                                                            {outOfStock ? "Out of stock" : product.stock < 10 ? `Only ${product.stock} left` : "In stock"}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => handleAddToCart(product)}
                                                        disabled={outOfStock || addingId === product._id}
                                                        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${outOfStock
                                                                ? "bg-white/5 text-muted cursor-not-allowed border border-card-border"
                                                                : addingId === product._id
                                                                    ? "bg-primary/60 text-white cursor-wait"
                                                                    : "bg-primary text-white hover:bg-primary-hover hover:-translate-y-0.5 shadow-md hover:shadow-indigo-500/40"
                                                            }`}
                                                    >
                                                        {addingId === product._id ? "Adding…" : outOfStock ? "Unavailable" : "Add to Cart"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ── Pagination Controls ── */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                                        <button
                                            onClick={() => setPage(1)}
                                            disabled={page === 1}
                                            className="px-3 py-2 rounded-lg border border-card-border text-muted hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
                                        >
                                            «
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-3 py-2 rounded-lg border border-card-border text-muted hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
                                        >
                                            ‹ Prev
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                                                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                                                acc.push(p);
                                                return acc;
                                            }, [])
                                            .map((p, i) =>
                                                p === "..." ? (
                                                    <span key={`ellipsis-${i}`} className="px-2 text-muted">…</span>
                                                ) : (
                                                    <button
                                                        key={p}
                                                        onClick={() => setPage(p as number)}
                                                        className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all ${page === p
                                                            ? "bg-primary border-primary text-white shadow-md shadow-indigo-500/40"
                                                            : "border-card-border text-muted hover:text-white hover:border-white/30"
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                )
                                            )}

                                        <button
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-3 py-2 rounded-lg border border-card-border text-muted hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
                                        >
                                            Next ›
                                        </button>
                                        <button
                                            onClick={() => setPage(totalPages)}
                                            disabled={page === totalPages}
                                            className="px-3 py-2 rounded-lg border border-card-border text-muted hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-sm transition-all"
                                        >
                                            »
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
