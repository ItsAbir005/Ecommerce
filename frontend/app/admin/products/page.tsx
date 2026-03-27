"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api";
import { useRouter } from "next/navigation";

type Product = {
    _id: string;
    title: string;
    description: string;
    price: number;
    stock: number;
    discount?: number;
    images?: string[];
};

export default function AdminProductsPage() {
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Product>>({ title: "", description: "", price: 0, stock: 0, discount: 0 });

    const loadProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("adminToken");
            const data = await fetchApi("/products?limit=100", { token: token || undefined });
            if (data && data.products) setProducts(data.products);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "price" || name === "stock" || name === "discount" ? Number(value) : value
        }));
    };

    const handleEdit = (product: Product) => {
        setIsEditing(true);
        setFormData(product);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            const token = localStorage.getItem("adminToken");
            await fetchApi(`/products/${id}`, { method: "DELETE", token: token || undefined });
            loadProducts();
        } catch (error) {
            alert("Failed to delete product");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && formData._id) {
                const token = localStorage.getItem("adminToken");
                await fetchApi(`/products/${formData._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    token: token || undefined,
                    body: JSON.stringify(formData),
                });
            } else {
                const token = localStorage.getItem("adminToken");
                await fetchApi(`/products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    token: token || undefined,
                    body: JSON.stringify(formData),
                });
            }
            setIsEditing(false);
            setFormData({ title: "", description: "", price: 0, stock: 0, discount: 0 });
            loadProducts();
        } catch (error) {
            alert("Failed to save product");
        }
    };

    if (loading) return <div className="container-custom pt-20 pb-12 text-center">Loading...</div>;

    return (
        <div className="container-custom py-12">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard: Products</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1 card h-fit">
                    <h2 className="text-xl font-semibold mb-4">{isEditing ? "Edit Product" : "Add New Product"}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input required name="title" value={formData.title} onChange={handleChange} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea required name="description" value={formData.description} onChange={handleChange} className="input-field" rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Price</label>
                                <input required type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange} className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Stock</label>
                                <input required type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} className="input-field" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Discount (%)</label>
                            <input type="number" min="0" max="100" name="discount" value={formData.discount} onChange={handleChange} className="input-field" />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="btn btn-primary flex-1">{isEditing ? "Update" : "Create"}</button>
                            {isEditing && (
                                <button type="button" onClick={() => { setIsEditing(false); setFormData({ title: "", description: "", price: 0, stock: 0, discount: 0 }); }} className="btn btn-outline flex-1">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="p-4 font-medium text-muted">Product</th>
                                    <th className="p-4 font-medium text-muted">Price</th>
                                    <th className="p-4 font-medium text-muted">Stock</th>
                                    <th className="p-4 font-medium text-muted text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product._id} className="border-b border-white/5 last:border-none hover:bg-white-[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium">{product.title}</div>
                                            <div className="text-sm text-muted truncate max-w-[200px]">{product.description}</div>
                                        </td>
                                        <td className="p-4 font-mono">${product.price}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                                                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => handleEdit(product)} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Edit</button>
                                            <button onClick={() => handleDelete(product._id)} className="text-sm text-red-500 hover:text-red-400 transition-colors">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted">No products found. Add one to get started!</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
