"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";

type Product = {
    _id: string;
    description: string;
    price: number;
    stock: number;
    title: string;
    images?: string[];
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchApi("/products");
                // API returns { products: Product[], page, pages, total }
                if (data && data.products) {
                    setProducts(data.products);
                }
            } catch (error) {
                console.error("Failed to fetch products:", error);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    const handleAddToCart = (id: string) => {
        alert(`Added product ${id} to cart!`);
    };

    if (loading) {
        return (
            <div className="container-custom flex justify-center pt-20 min-h-[80vh]">
                <p className="text-muted animate-pulse">Loading amazing products...</p>
            </div>
        );
    }

    return (
        <div className="container-custom py-12 min-h-[80vh]">
            <h1 className="text-5xl font-bold mb-4 gradient-text">Featured Collection</h1>
            <p className="text-muted mb-12 text-lg">Explore our latest premium arrivals designed for the future.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map(product => (
                    <div key={product._id} className="card flex flex-col h-full group">
                        <div className="h-48 bg-black/40 rounded-lg mb-6 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                            {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <span className="text-5xl opacity-50 group-hover:opacity-80 transition-opacity">📦</span>
                            )}
                        </div>
                        <div className="flex justify-between items-start mb-2 space-x-4">
                            <h3 className="text-xl font-semibold leading-tight">{product.title}</h3>
                            <span className="text-emerald-500 font-bold whitespace-nowrap">${product.price}</span>
                        </div>
                        <p className="text-muted flex-grow mb-6 text-sm leading-relaxed">{product.description}</p>
                        <button
                            onClick={() => handleAddToCart(product._id)}
                            className="btn btn-primary w-full"
                        >
                            Add to cart
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
