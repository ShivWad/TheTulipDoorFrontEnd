"use client";

/**
 * Admin Subscriptions Page Component
 * 
 * Displays all flower subscriptions for administrative management.
 * Provides filtering by status and actions to pause/resume/cancel.
 * 
 * Features:
 * - Filter by status (All, Active, Paused, Cancelled)
 * - Display user info, plan, status, price, next billing date
 * - Color-coded status badges
 * - Action buttons to pause/resume/cancel subscriptions
 * - Confirmation dialogs for destructive actions
 * - Loading and empty states
 * 
 * API Endpoints:
 * - GET /api/admin/subscriptions - Fetch subscriptions list
 * - PUT /api/admin/subscriptions - Update subscription status
 */

import { useState, useEffect } from "react";

/**
 * Subscription interface matching API response
 */
interface Subscription {
  id: string;
  plan: string;
  status: string;
  price: number;
  nextBillingDate: Date | null;
  nextDeliveryDate: Date | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
}

export default function AdminSubscriptionsPage() {
  // Subscriptions list state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  // Loading state
  const [loading, setLoading] = useState(true);
  // Current status filter
  const [filter, setFilter] = useState("all");

  // Action confirmation modal state
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    subscriptionId: string | null;
    action: string;
    userName: string;
  }>({
    open: false,
    subscriptionId: null,
    action: "",
    userName: "",
  });

  /**
   * Fetch subscriptions from API
   * Called when filter changes
   */
  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`/api/admin/subscriptions?filter=${filter}`);
      const data = await res.json();
      
      if (!res.ok) {
        console.error("API error:", data.error);
        setSubscriptions([]);
        return;
      }
      
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscriptions when filter changes
  useEffect(() => {
    fetchSubscriptions();
  }, [filter]);

  /**
   * Open action confirmation modal
   */
  const confirmAction = (subscriptionId: string, action: string, userName: string) => {
    setActionModal({ open: true, subscriptionId, action, userName: userName || "this user" });
  };

  /**
   * Execute status update after confirmation
   */
  const updateStatus = async () => {
    if (!actionModal.subscriptionId || !actionModal.action) return;
    
    try {
      const res = await fetch(`/api/admin/subscriptions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: actionModal.subscriptionId, action: actionModal.action }),
      });

      if (res.ok) {
        fetchSubscriptions();
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
    } finally {
      setActionModal({ open: false, subscriptionId: null, action: "", userName: "" });
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-500 mt-1">Manage all subscriptions</p>
        </div>
        
        {/* Status Filter Buttons */}
        <div className="flex gap-2">
          {["all", "active", "paused", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                filter === status
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined text-4xl text-gray-400 animate-spin">
            sync
          </span>
        </div>
      ) : subscriptions.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 text-gray-500">
          No subscriptions found
        </div>
      ) : (
        /* Subscriptions Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Next Billing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  {/* User Info */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {sub.user.name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">{sub.user.email}</div>
                  </td>
                  
                  {/* Plan Name */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 capitalize">{sub.plan}</span>
                  </td>
                  
                  {/* Status - Color Coded */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sub.status === "active"
                          ? "bg-green-100 text-green-800"
                          : sub.status === "paused"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  
                  {/* Price (in paise, convert to INR) */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      ₹{(sub.price / 100).toFixed(0)}/mo
                    </span>
                  </td>
                  
                  {/* Next Billing Date */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {sub.nextBillingDate
                        ? new Date(sub.nextBillingDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </td>
                  
                  {/* Action Buttons */}
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {/* Pause button - shown for active subscriptions */}
                      {sub.status === "active" && (
                        <button
                          onClick={() => confirmAction(sub.id, "pause", sub.user.name || "")}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Pause
                        </button>
                      )}
                      {/* Resume button - shown for paused subscriptions */}
                      {sub.status === "paused" && (
                        <button
                          onClick={() => confirmAction(sub.id, "resume", sub.user.name || "")}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          Resume
                        </button>
                      )}
                      {/* Cancel button - shown for non-cancelled subscriptions */}
                      {sub.status !== "cancelled" && (
                        <button
                          onClick={() => confirmAction(sub.id, "cancel", sub.user.name || "")}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 capitalize">{actionModal.action} Subscription</h2>
              <button
                onClick={() => setActionModal({ open: false, subscriptionId: null, action: "", userName: "" })}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {actionModal.action} the subscription for <strong>{actionModal.userName}</strong>?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setActionModal({ open: false, subscriptionId: null, action: "", userName: "" })}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateStatus}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}