"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { fetchApi } from "../../lib/api";

import AddressesTab from "./AddressesTab";
import NotificationsTab from "./NotificationsTab";

export default function ProfilePage() {
    const { user, loading, logout, setUser } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    const [activeTab, setActiveTab] = useState<"account" | "addresses" | "notifications">("account");
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Password change states
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ... useEffects and return statements ...
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!loading && !user && mounted) {
            router.push("/login");
        } else if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user, loading, router, mounted]);

    if (!mounted || loading) {
        return (
            <div className="container-custom mt-16 flex justify-center items-center min-h-[60vh]">
                <div className="h-10 w-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const data = await fetchApi("/users/profile", {
                method: "PUT",
                body: JSON.stringify({ name, email }),
            });
            setUser(data.user);
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile.");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("profileImage", file);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/users/profile/image", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            setUser(data.user);
            alert("Profile image uploaded successfully!");
        } catch (error) {
            alert("Failed to upload image.");
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match!");
            return;
        }
        setChangingPassword(true);
        try {
            await fetchApi("/users/profile/password", {
                method: "PUT",
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            alert("Password changed successfully!");
            setShowPasswordChange(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            alert(error.message || "Failed to change password.");
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm("Are you ABSOLUTELY sure you want to delete your account? This cannot be undone.")) {
            try {
                await fetchApi("/users/profile", {
                    method: "DELETE",
                });
                alert("Account deleted.");
                logout();
            } catch (error: any) {
                alert(error.message || "Failed to delete account.");
            }
        }
    };

    return (
        <div className="container-custom mt-16 max-w-4xl min-h-[80vh]">
            <h1 className="text-4xl font-bold mb-8 gradient-text">Your Profile</h1>

            <div className="flex border-b border-card-border mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("account")}
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "account" ? "border-indigo-500 text-indigo-400 bg-indigo-500/10" : "border-transparent text-muted hover:text-white"}`}
                >
                    Account Settings
                </button>
                <button
                    onClick={() => setActiveTab("addresses")}
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "addresses" ? "border-indigo-500 text-indigo-400 bg-indigo-500/10" : "border-transparent text-muted hover:text-white"}`}
                >
                    Saved Addresses
                </button>
                <button
                    onClick={() => setActiveTab("notifications")}
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "notifications" ? "border-indigo-500 text-indigo-400 bg-indigo-500/10" : "border-transparent text-muted hover:text-white"}`}
                >
                    Notifications
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="card md:col-span-1 h-fit">
                    <div className="flex flex-col items-center text-center">
                        <div
                            className="relative w-32 h-32 rounded-full mb-4 bg-indigo-500/20 text-primary flex items-center justify-center text-4xl font-bold cursor-pointer overflow-hidden border-2 border-indigo-500/30 group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <div className="h-8 w-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                            ) : user.profileImage ? (
                                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user.name.charAt(0).toUpperCase()
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                                <span className="text-sm font-medium">Change</span>
                                <span className="text-xs">Photo</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />

                        <h2 className="text-2xl font-semibold mb-1">{user.name}</h2>
                        <p className="text-muted mb-6">{user.email}</p>

                        <button
                            onClick={logout}
                            className="btn bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 w-full"
                        >
                            Log Out
                        </button>
                    </div>
                </div>

                <div className="card md:col-span-2">
                    {activeTab === "account" && (
                        <>
                            <div className="flex justify-between items-center mb-6 border-b border-card-border pb-4">
                                <h3 className="text-xl font-semibold">Account Details</h3>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    {isEditing ? "Cancel" : "Edit Profile"}
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm text-muted mb-1">Full Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full p-3 bg-black/30 rounded-lg border border-indigo-500/30 text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    ) : (
                                        <div className="p-3 bg-black/20 rounded-lg border border-card-border/50 text-white">
                                            {user.name}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm text-muted mb-1">Email Address</label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full p-3 bg-black/30 rounded-lg border border-indigo-500/30 text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    ) : (
                                        <div className="p-3 bg-black/20 rounded-lg border border-card-border/50 text-white">
                                            {user.email}
                                        </div>
                                    )}
                                </div>

                                {isEditing && (
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="btn-primary w-full flex justify-center mt-4"
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                )}
                            </div>

                            <div className="mt-8 pt-8 border-t border-card-border">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-semibold">Security</h3>
                                    <button
                                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        {showPasswordChange ? "Cancel" : "Change Password"}
                                    </button>
                                </div>

                                {showPasswordChange && (
                                    <div className="space-y-4 mb-8 p-4 bg-black/20 rounded-lg border border-card-border/50">
                                        <div>
                                            <label className="block text-sm text-muted mb-1">Current Password</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full p-3 bg-black/30 rounded-lg border border-indigo-500/30 text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-muted mb-1">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full p-3 bg-black/30 rounded-lg border border-indigo-500/30 text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-muted mb-1">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full p-3 bg-black/30 rounded-lg border border-indigo-500/30 text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={changingPassword}
                                            className="btn-primary w-full flex justify-center mt-4"
                                        >
                                            {changingPassword ? "Updating..." : "Update Password"}
                                        </button>
                                    </div>
                                )}

                                <div className="mt-8 p-6 bg-red-500/10 rounded-xl border border-red-500/30 text-center">
                                    <h4 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h4>
                                    <p className="text-sm text-muted mb-6">
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="btn bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto px-8"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "addresses" && <AddressesTab />}
                    {activeTab === "notifications" && <NotificationsTab />}
                </div>
            </div>
        </div>
    );
}
