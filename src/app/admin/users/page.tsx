"use client";

/**
 * Admin Users Page Component
 * 
 * Provides user management functionality for administrators:
 * - List users with pagination and search
 * - Create new users (including admin users)
 * - Edit existing users (TODO)
 * - Delete users (via API)
 * 
 * Features:
 * - Server-side pagination (20 users per page)
 * - Search by name or email
 * - Create user form with validation
 * - Subscription status display
 * 
 * API Endpoints:
 * - GET /api/admin/users - Fetch paginated users list
 * - POST /api/admin/users - Create new user
 */

import { useState, useEffect } from "react";

/**
 * User interface representing a user in the system
 */
interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  isAdmin: boolean;
  createdAt: Date;
  subscription?: {
    plan: string;
    status: string;
  } | null;
}

export default function AdminUsersPage() {
  // Users list state
  const [users, setUsers] = useState<User[]>([]);
  
  // Loading state for data fetching
  const [loading, setLoading] = useState(true);
  
  // Search filter state
  const [search, setSearch] = useState("");
  
  // Current page for pagination
  const [page, setPage] = useState(1);
  
  // Total pages available (from API)
  const [totalPages, setTotalPages] = useState(1);
  
  // Create mode toggle - shows/hides create user form
  const [createMode, setCreateMode] = useState(false);
  
  // Form data for creating new user
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    isAdmin: false,
  });
  
  // Loading state for form submission
  const [createLoading, setCreateLoading] = useState(false);
  
  // Error message state for form
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Success message state for form
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  /**
   * Fetch users from API
   * Called on mount and when page/search changes
   */
  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `/api/admin/users?page=${page}&search=${search}`
      );
      const data = await res.json();
      
      // Handle API error responses
      if (!res.ok) {
        console.error("API error:", data.error);
        setUsers([]);
        return;
      }
      
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch users when page or search changes
  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  /**
   * Handle new user creation form submission
   * Validates input and calls POST /api/admin/users
   */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setCreateLoading(true);

    try {
      const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setCreateSuccess(data.message);
        // Reset form after successful creation
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          isAdmin: false,
        });
        // Refresh user list to show new user
        fetchUsers();
      } else {
        const data = await res.json();
        setCreateError(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Create user error:", error);
      setCreateError("An unexpected error occurred");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">Manage registered users</p>
        </div>
        
        {/* Action Buttons and Search */}
        <div className="flex gap-4">
          {/* Toggle create mode button */}
          {!createMode && (
            <button
              onClick={() => setCreateMode(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Create New User
            </button>
          )}
          {/* Cancel button when in create mode */}
          {createMode && (
            <button
              onClick={() => setCreateMode(false)}
              className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
          
          {/* Search input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Create User Form */}
      {createMode && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div className="space-y-4">
              {/* Name and Email row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>
              
              {/* Phone and Password row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              {/* Admin checkbox */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isAdmin}
                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Make this user an administrator
                  </span>
                </label>
              </div>
            </div>

            {/* Error message display */}
            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-2 rounded">
                {createError}
              </div>
            )}
            
            {/* Success message display */}
            {createSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-500 px-4 py-2 rounded">
                {createSuccess}
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createLoading}
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {createLoading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      {!createMode && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Table Header */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="bg-white divide-y divide-gray-200">
                {(users || []).map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {user.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.subscription ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.subscription.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.subscription.plan} - {user.subscription.status}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No subscription</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => {
                          // TODO: Implement edit functionality
                          alert("Edit functionality not implemented yet");
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
