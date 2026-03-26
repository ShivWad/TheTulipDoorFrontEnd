"use client";

/**
 * Admin Payments Page Component
 * 
 * Displays all payment transactions for administrative review.
 * Shows user info, payment amount, status, and date.
 * 
 * Features:
 * - Display all payment transactions
 * - Color-coded status badges (captured, failed, pending)
 * - Loading and empty states
 * 
 * API Endpoint: GET /api/admin/payments
 */

import { useState, useEffect } from "react";

/**
 * Payment interface matching API response
 */
interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
}

export default function AdminPaymentsPage() {
  // Payments list state
  const [payments, setPayments] = useState<Payment[]>([]);
  // Loading state
  const [loading, setLoading] = useState(true);

  /**
   * Fetch payments from API on component mount
   */
  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      
      if (!res.ok) {
        console.error("API error:", data.error);
        setPayments([]);
        return;
      }
      
      setPayments(data.payments || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payments on mount
  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">View all payment transactions</p>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined text-4xl text-gray-400 animate-spin">
            sync
          </span>
        </div>
      ) : payments.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 text-gray-500">
          No payments found
        </div>
      ) : (
        /* Payments Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  {/* User Info */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.user.name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">{payment.user.email}</div>
                  </td>
                  
                  {/* Payment Amount (in paise, convert to INR) */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      ₹{(payment.amount / 100).toFixed(2)}
                    </span>
                  </td>
                  
                  {/* Payment Status - Color Coded */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === "captured"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  
                  {/* Payment Date */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleString()}
                    </span>
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