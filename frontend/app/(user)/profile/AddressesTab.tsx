"use client";

import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api";

interface Address {
    _id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

export default function AddressesTab() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        isDefault: false
    });

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const data = await fetchApi("/users/profile"); // We fetch the profile since it houses addresses
            setAddresses(data.addresses || []);
        } catch (error) {
            console.error("Failed to load addresses", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAddresses();
    }, []);

    const resetForm = () => {
        setFormData({ street: "", city: "", state: "", zipCode: "", country: "", isDefault: false });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEdit = (addr: Address) => {
        setFormData({
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country,
            isDefault: addr.isDefault
        });
        setEditingId(addr._id);
        setIsAdding(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                const res = await fetchApi(`/users/addresses/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify(formData),
                });
                setAddresses(res.addresses);
            } else {
                const res = await fetchApi(`/users/addresses`, {
                    method: "POST",
                    body: JSON.stringify(formData),
                });
                setAddresses(res.addresses);
            }
            resetForm();
        } catch (error: any) {
            alert(error.message || "Failed to save address.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this address?")) return;
        try {
            const res = await fetchApi(`/users/addresses/${id}`, {
                method: "DELETE",
            });
            setAddresses(res.addresses);
        } catch (error: any) {
            alert(error.message || "Failed to delete address.");
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const res = await fetchApi(`/users/addresses/${id}/default`, {
                method: "PUT",
            });
            setAddresses(res.addresses);
        } catch (error: any) {
            alert(error.message || "Failed to set default address.");
        }
    };

    if (loading) {
        return <div className="animate-pulse h-32 bg-indigo-500/10 rounded-lg"></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-card-border pb-4">
                <h3 className="text-xl font-semibold">Your Addresses</h3>
                {(!isAdding && !editingId) && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-sm bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-lg hover:bg-indigo-500/30 transition-colors"
                    >
                        + Add Address
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <form onSubmit={handleSave} className="bg-black/20 p-6 rounded-lg border border-indigo-500/30 space-y-4">
                    <h4 className="text-lg font-medium text-white mb-4">
                        {editingId ? "Edit Address" : "New Address"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm text-muted mb-1">Street Address</label>
                            <input required type="text" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} className="w-full p-2 bg-black/30 rounded border border-card-border text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-muted mb-1">City</label>
                            <input required type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full p-2 bg-black/30 rounded border border-card-border text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-muted mb-1">State / Province</label>
                            <input required type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full p-2 bg-black/30 rounded border border-card-border text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-muted mb-1">Postal / Zip Code</label>
                            <input required type="text" value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} className="w-full p-2 bg-black/30 rounded border border-card-border text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-muted mb-1">Country</label>
                            <input required type="text" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className="w-full p-2 bg-black/30 rounded border border-card-border text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="md:col-span-2 flex items-center mt-2">
                            <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={e => setFormData({ ...formData, isDefault: e.target.checked })} className="mr-2 rounded border-card-border bg-black/30 text-indigo-500 focus:ring-indigo-500" />
                            <label htmlFor="isDefault" className="text-sm text-white">Set as default shipping address</label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-muted hover:text-white transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors">Save Address</button>
                    </div>
                </form>
            )}

            {!isAdding && !editingId && addresses.length === 0 ? (
                <div className="text-center py-8 text-muted">
                    No addresses saved yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                        <div key={addr._id} className={`p-4 rounded-lg border ${addr.isDefault ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-card-border/50 bg-black/20'}`}>
                            <div className="flex justify-between items-start mb-2">
                                {addr.isDefault ? (
                                    <span className="text-xs font-semibold bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">Default</span>
                                ) : (
                                    <button onClick={() => handleSetDefault(addr._id)} className="text-xs text-muted hover:text-indigo-400 transition-colors">Set as Default</button>
                                )}
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(addr)} className="text-sm text-indigo-400 hover:text-indigo-300">Edit</button>
                                    <button onClick={() => handleDelete(addr._id)} className="text-sm text-red-500 hover:text-red-400">Delete</button>
                                </div>
                            </div>
                            <p className="text-white mt-3 font-medium">{addr.street}</p>
                            <p className="text-muted text-sm">{addr.city}, {addr.state} {addr.zipCode}</p>
                            <p className="text-muted text-sm">{addr.country}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
