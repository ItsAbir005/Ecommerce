"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "../lib/api";

type Category = {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
    image?: string;
    description?: string;
    children?: Category[];
};

const FALLBACK_ICONS: Record<string, string> = {
    electronics: "📱", fashion: "👗", footwear: "👟", books: "📚",
    home: "🏠", sports: "⚽", beauty: "💄", toys: "🧸",
    men: "👔", women: "👒", kitchen: "🍳", outdoors: "🏕️",
};

function getCategoryIcon(cat: Category): string {
    if (cat.icon) return cat.icon;
    const slug = cat.slug?.toLowerCase() || "";
    for (const [key, icon] of Object.entries(FALLBACK_ICONS)) {
        if (slug.includes(key)) return icon;
    }
    return "🏷️";
}

export default function CategoriesPage() {
    const [tree, setTree] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Category | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [prodLoading, setProdLoading] = useState(false);

    useEffect(() => {
        fetchApi("/categories/tree")
            .then(setTree)
            .catch(() => setTree([]))
            .finally(() => setLoading(false));
    }, []);

    const loadProducts = async (cat: Category) => {
        setSelected(cat);
        setProdLoading(true);
        try {
            const data = await fetchApi(`/categories/${cat._id}/products?limit=6`);
            setProducts(data.products || []);
        } catch { setProducts([]); }
        finally { setProdLoading(false); }
    };

    return (
        <div className="container-custom py-12 min-h-[80vh]">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">Categories</h1>
            <p className="text-muted mb-10">Browse our full product catalog by department</p>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="card !p-6 animate-pulse">
                            <div className="w-12 h-12 bg-white/5 rounded-xl mb-3" />
                            <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-white/5 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Category Grid */}
                    <div className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {tree.map((cat) => (
                                <div key={cat._id}>
                                    {/* Parent category */}
                                    <button
                                        onClick={() => loadProducts(cat)}
                                        className={`w-full text-left card !p-5 hover:border-primary/60 transition-all hover:-translate-y-0.5 cursor-pointer group ${selected?._id === cat._id ? "border-primary bg-primary/5" : ""}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {cat.image ? (
                                                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                                                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl shrink-0">
                                                    {getCategoryIcon(cat)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{cat.name}</h3>
                                                {cat.description && <p className="text-xs text-muted mt-1 line-clamp-2">{cat.description}</p>}
                                                {cat.children && cat.children.length > 0 && (
                                                    <p className="text-xs text-muted/60 mt-1">{cat.children.length} sub-categories</p>
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Sub-categories */}
                                    {selected?._id === cat._id && cat.children && cat.children.length > 0 && (
                                        <div className="mt-2 ml-2 space-y-1">
                                            {cat.children.map((sub) => (
                                                <button
                                                    key={sub._id}
                                                    onClick={() => loadProducts(sub)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${selected?._id === sub._id
                                                            ? "bg-primary/20 text-primary"
                                                            : "text-muted hover:text-white hover:bg-white/5"
                                                        }`}
                                                >
                                                    <span>{getCategoryIcon(sub)}</span>
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Preview Panel */}
                    {selected && (
                        <div className="lg:w-[360px] shrink-0">
                            <div className="card !p-5 sticky top-[90px]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg">{selected.name}</h3>
                                    <Link
                                        href={`/products?category=${selected._id}`}
                                        className="text-xs text-primary hover:text-primary-hover transition-colors"
                                    >
                                        View all →
                                    </Link>
                                </div>

                                {prodLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex gap-3 animate-pulse">
                                                <div className="w-14 h-14 bg-white/5 rounded-lg shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-white/5 rounded w-3/4" />
                                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="text-center py-8 text-muted">
                                        <div className="text-4xl mb-2">🏷️</div>
                                        <p className="text-sm">No products in this category yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {products.map((p) => (
                                            <Link href={`/products`} key={p._id} className="flex gap-3 group hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors">
                                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/40 shrink-0">
                                                    {p.images?.[0] ? (
                                                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-xl opacity-30">📦</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium line-clamp-2 leading-snug">{p.title}</p>
                                                    <p className="text-emerald-400 text-sm font-bold mt-1">
                                                        ${p.discount > 0
                                                            ? (p.price * (1 - p.discount / 100)).toFixed(2)
                                                            : p.price.toFixed(2)}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                        <Link
                                            href={`/products?category=${selected._id}`}
                                            className="block text-center py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium mt-2 transition-colors"
                                        >
                                            See all in {selected.name} →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
