"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchApi } from "../lib/api";
import { useAuth } from "./AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────
export type CartItem = {
    _id: string;
    product_id: {
        _id: string;
        title: string;
        price: number;
        discount: number;
        stock: number;
        images: string[];
    };
    variant_id?: string;
    quantity: number;
    price_at_addition: number;
};

export type CartSummary = {
    itemCount: number;
    subtotal: number;
    discountAmount: number;
    tax: number;
    shipping: number;
    shippingNote: string;
    total: number;
};

type CartContextType = {
    items: CartItem[];
    summary: CartSummary | null;
    loading: boolean;
    itemCount: number;
    addItem: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
    updateItem: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    validateCart: () => Promise<{ valid: boolean; changes: string[] }>;
    refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [summary, setSummary] = useState<CartSummary | null>(null);
    const [loading, setLoading] = useState(false);

    const refreshCart = useCallback(async () => {
        if (!user) { setItems([]); setSummary(null); return; }
        try {
            const [cartData, summaryData] = await Promise.all([
                fetchApi("/cart"),
                fetchApi("/cart/summary"),
            ]);
            setItems(cartData.items ?? []);
            setSummary(summaryData);
        } catch {
            setItems([]);
            setSummary(null);
        }
    }, [user]);

    // Load cart when user changes
    useEffect(() => { refreshCart(); }, [refreshCart]);

    const addItem = async (productId: string, quantity = 1, variantId?: string) => {
        setLoading(true);
        try {
            await fetchApi("/cart", {
                method: "POST",
                body: JSON.stringify({ productId, quantity, variantId }),
            });
            await refreshCart();
        } finally {
            setLoading(false);
        }
    };

    const updateItem = async (itemId: string, quantity: number) => {
        setLoading(true);
        try {
            await fetchApi(`/cart/${itemId}`, {
                method: "PUT",
                body: JSON.stringify({ quantity }),
            });
            await refreshCart();
        } finally {
            setLoading(false);
        }
    };

    const removeItem = async (itemId: string) => {
        setLoading(true);
        try {
            await fetchApi(`/cart/${itemId}`, { method: "DELETE" });
            await refreshCart();
        } finally {
            setLoading(false);
        }
    };

    const clearCart = async () => {
        setLoading(true);
        try {
            await fetchApi("/cart", { method: "DELETE" });
            setItems([]);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    const validateCart = async () => {
        const data = await fetchApi("/cart/validate");
        await refreshCart();
        return { valid: data.valid, changes: data.changes ?? [] };
    };

    const itemCount = items.reduce((s, i) => s + i.quantity, 0);

    return (
        <CartContext.Provider value={{
            items, summary, loading, itemCount,
            addItem, updateItem, removeItem, clearCart, validateCart, refreshCart,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}
