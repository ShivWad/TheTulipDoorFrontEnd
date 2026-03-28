"use client";

import { useState, useEffect } from "react";

interface Settings {
  [key: string]: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    soloPrice: "1800",
    studioPrice: "3400",
    galleryPrice: "4800",
    deliveryDays: "monday,wednesday,friday",
    deliveryTimeSlot: "afternoon",
    orderNotifications: "true",
    deliveryNotifications: "true",
    newsletterNotifications: "true",
    businessName: "The Tulip Door",
    supportEmail: "support@thetulipdoor.com",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save settings" });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key: string, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: checked.toString() }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-symbols-outlined text-4xl text-gray-400 animate-spin">
          sync
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500 mt-1">Manage system-wide settings</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${
          message.type === "success" 
            ? "bg-green-50 border border-green-200 text-green-700" 
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 space-y-8">
            {/* Subscription Settings */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Solo Plan Price (₹/month)</label>
                  <input
                    type="number"
                    value={settings.soloPrice || ""}
                    onChange={(e) => handleChange("soloPrice", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Studio Plan Price (₹/month)</label>
                  <input
                    type="number"
                    value={settings.studioPrice || ""}
                    onChange={(e) => handleChange("studioPrice", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Plan Price (₹/month)</label>
                  <input
                    type="number"
                    value={settings.galleryPrice || ""}
                    onChange={(e) => handleChange("galleryPrice", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Settings */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Days</label>
                  <div className="flex flex-wrap gap-4">
                    {["monday", "wednesday", "friday"].map((day) => (
                      <label key={day} className="flex items-center gap-2 capitalize">
                        <input
                          type="checkbox"
                          checked={(settings.deliveryDays || "").includes(day)}
                          onChange={(e) => {
                            const current = (settings.deliveryDays || "").split(",").filter(Boolean);
                            const updated = e.target.checked
                              ? [...current, day]
                              : current.filter((d) => d !== day);
                            handleChange("deliveryDays", updated.join(","));
                          }}
                          className="h-4 w-4 text-indigo-600 rounded"
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time Slot</label>
                  <select
                    value={settings.deliveryTimeSlot || "afternoon"}
                    onChange={(e) => handleChange("deliveryTimeSlot", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 8 PM)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Settings</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.orderNotifications === "true"}
                    onChange={(e) => handleCheckboxChange("orderNotifications", e.target.checked)}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Order status notifications</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.deliveryNotifications === "true"}
                    onChange={(e) => handleCheckboxChange("deliveryNotifications", e.target.checked)}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Delivery notifications</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.newsletterNotifications === "true"}
                    onChange={(e) => handleCheckboxChange("newsletterNotifications", e.target.checked)}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Newsletter subscriptions</span>
                </label>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={settings.businessName || ""}
                    onChange={(e) => handleChange("businessName", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Support Email</label>
                  <input
                    type="email"
                    value={settings.supportEmail || ""}
                    onChange={(e) => handleChange("supportEmail", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}