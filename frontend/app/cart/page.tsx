"use client";

import { useState } from "react";

export default function CartPage() {
    const [items, setItems] = useState([
        { id: "1", name: "Nebula Smart Watch", price: 299.99, quantity: 1 },
        { id: "2", name: "Zenith Mechanical Keyboard", price: 149.99, quantity: 2 },
    ]);

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <div className="container-custom py-12 min-h-[80vh]">
            <h1 className="text-5xl font-bold mb-10 gradient-text">Your Cart</h1>

            {items.length === 0 ? (
                <p className="text-muted text-xl">Your cart is empty.</p>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">

                    <div className="flex-grow bg-card-bg rounded-2xl border border-card-border overflow-hidden h-fit">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className={`flex flex-col sm:flex-row justify-between sm:items-center p-6 gap-4 ${index !== items.length - 1 ? 'border-b border-card-border' : ''}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="h-20 w-20 bg-black/40 rounded-xl flex items-center justify-center text-3xl shrink-0">
                                        📦
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                                        <p className="text-muted text-sm">Quantity: {item.quantity}</p>
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-emerald-400">
                                    ${(item.price * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="w-full lg:w-[400px] shrink-0 bg-card-bg rounded-2xl border border-card-border p-8 h-fit self-start sticky top-[100px]">
                        <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                        <div className="flex justify-between mb-4 text-lg">
                            <span className="text-muted">Subtotal</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-6 text-lg">
                            <span className="text-muted">Shipping</span>
                            <span className="text-emerald-400 font-medium">Free</span>
                        </div>
                        <div className="h-[1px] w-full bg-card-border mb-6"></div>
                        <div className="flex justify-between mb-8 text-2xl font-bold">
                            <span>Total</span>
                            <span className="gradient-text">${total.toFixed(2)}</span>
                        </div>
                        <button className="btn btn-primary w-full py-4 text-lg">
                            Proceed to Checkout
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}
