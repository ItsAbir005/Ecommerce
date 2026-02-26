"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";

type Product = {
    _id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // For now we will mock the backend products or just display empty if none exist yet.
        setLoading(false);
        setProducts([
            { _id: "1", name: "Nebula Smart Watch", description: "Stay connected with a universe of features on your wrist.", price: 299.99, stock: 10 },
            { _id: "2", name: "Aura Noise-Cancelling Headphones", description: "Immerse yourself in crystal clear sound with zero distractions.", price: 199.99, stock: 25 },
            { _id: "3", name: "Zenith Mechanical Keyboard", description: "Premium tactile feedback with a customizable RGB layout.", price: 149.99, stock: 5 },
            { _id: "4", name: "Lunar Wireless Charger", description: "Elegantly designed fast-charging pad for all your devices.", price: 49.99, stock: 50 },
            { _id: "5", name: "Echo Smart Speaker", description: "Your virtual assistant wrapped in a sleek, minimalist shell.", price: 89.99, stock: 15 },
            { _id: "6", name: "Quantum 4K Monitor", description: "Experience visual perfection with this ultra-wide display.", price: 499.99, stock: 8 },
        ]);
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
                            <span className="text-5xl opacity-50 group-hover:opacity-80 transition-opacity">📦</span>
                        </div>
                        <div className="flex justify-between items-start mb-2 space-x-4">
                            <h3 className="text-xl font-semibold leading-tight">{product.name}</h3>
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
