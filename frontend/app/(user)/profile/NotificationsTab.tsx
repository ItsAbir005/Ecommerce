"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api";

type NotificationSettings = {
    email: boolean;
    sms: boolean;
    push: boolean;
};

export default function NotificationsTab() {
    const [settings, setSettings] = useState<NotificationSettings>({ email: true, sms: true, push: true });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await fetchApi("/users/profile");
                if (data.notificationSettings) {
                    setSettings(data.notificationSettings);
                }
            } catch (error) {
                console.error("Failed to load settings", error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleChange = async (key: keyof NotificationSettings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings); // Optimistically update UI

        setSaving(true);
        try {
            await fetchApi("/users/notifications", {
                method: "PUT",
                body: JSON.stringify(newSettings),
            });
        } catch (error: any) {
            // Revert on error
            setSettings(settings);
            alert("Failed to update preferences");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse h-32 bg-indigo-500/10 rounded-lg"></div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold border-b border-card-border pb-4">Notification Preferences</h3>

            <div className="bg-black/20 p-6 rounded-lg border border-card-border/50 space-y-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-medium">Email Notifications</h4>
                        <p className="text-sm text-muted">Receive updates, promotions, and account alerts via email.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.email} onChange={() => handleChange('email')} disabled={saving} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-card-border/50">
                    <div>
                        <h4 className="text-white font-medium">SMS Notifications</h4>
                        <p className="text-sm text-muted">Get order delivery updates directly to your phone.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.sms} onChange={() => handleChange('sms')} disabled={saving} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-card-border/50">
                    <div>
                        <h4 className="text-white font-medium">Push Notifications</h4>
                        <p className="text-sm text-muted">Allow browser notifications for immediate updates while active on the site.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.push} onChange={() => handleChange('push')} disabled={saving} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                </div>

            </div>
        </div>
    );
}
