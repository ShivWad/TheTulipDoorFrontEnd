"use client";

/**
 * Admin Orders Page Component
 * 
 * Displays all orders for administrative review.
 * Provides filtering by order type and displays order details.
 * 
 * Features:
 * - Filter by order type (All, Subscription, Gift)
 * - Display user info, order type, status, total, date
 * - Color-coded status badges
 * - Loading and empty states
 * 
 * API Endpoint: GET /api/admin/orders
 */

import { useState, useEffect } from "react";

/**
 * Order interface matching API response
 */
interface Order {
  id: string;
  orderType: string;
  status: string;
  total: number;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  subscription?: {
    plan: string;
  } | null;
}

export default function AdminOrdersPage() {
  // Orders list state
  const [orders, setOrders] = useState<Order[]>([]);
  // Loading state
  const [loading, setLoading] = useState(true);
  // Current filter selection
  const [filter, setFilter] = useState("all");

  /**
   * Fetch orders from API
   * Called when filter changes
   */
  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/admin/orders?filter=${filter}`);
      const data = await res.json();
      
      if (!res.ok) {
        console.error("API error:", data.error);
        setOrders([]);
        return;
      }
      
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when filter changes
  useEffect(() => {
    fetchOrders();
  }, [filter]);

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage all orders</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          {["all", "subscription", "gift"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                filter === type
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {type === "all" ? "All" : type === "subscription" ? "Subscription" : "Gift"}
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
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 text-gray-500">
          No orders found
        </div>
      ) : (
        /* Orders Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  {/* User Info */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.user.name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">{order.user.email}</div>
                  </td>
                  
                  {/* Order Type */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 capitalize">{order.orderType}</span>
                  </td>
                  
                  {/* Order Status - Color Coded */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "shipped"
                          ? "bg-indigo-100 text-indigo-800"
                          : order.status === "delivered"
                          ? "bg-indigo-100 text-indigo-800"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  
                  {/* Total Amount (in paise, convert to INR) */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      ₹{(order.total / 100).toFixed(2)}
                    </span>
                  </td>
                  
                  {/* Created Date */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </td>
                  
                  {/* Order Details */}
                  <td className="px-6 py-4">
                    {order.subscription ? (
                      <span className="text-sm text-gray-600">
                        {order.subscription.plan} Subscription
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600">
                        Gift Order
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}