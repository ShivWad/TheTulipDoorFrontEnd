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
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    isAdmin: false,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  
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

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; userId: string | null; userName: string }>({
    open: false,
    userId: null,
    userName: "",
  });

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
   * Open edit modal for a user
   */
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email,
      phone: user.phone || "",
      isAdmin: user.isAdmin,
    });
    setEditMode(true);
    setEditError(null);
    setEditSuccess(null);
  };

  /**
   * Handle edit form submission
   */
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setEditError(null);
    setEditSuccess(null);
    setEditLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        const data = await res.json();
        setEditSuccess(data.message || "User updated successfully");
        // Refresh user list
        fetchUsers();
        // Close modal after short delay
        setTimeout(() => {
          setEditMode(false);
          setEditingUser(null);
        }, 1500);
      } else {
        const data = await res.json();
        setEditError(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Edit user error:", error);
      setEditError("An unexpected error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  /**
   * Handle delete user - open confirmation modal
   */
  const confirmDelete = (userId: string, userName: string) => {
    setDeleteModal({ open: true, userId, userName: userName || "this user" });
  };

  /**
   * Execute delete after confirmation
   */
  const handleDelete = async () => {
    if (!deleteModal.userId) return;
    
    try {
      const res = await fetch(`/api/admin/users/${deleteModal.userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete user error:", error);
      alert("An unexpected error occurred");
    } finally {
      setDeleteModal({ open: false, userId: null, userName: "" });
    }
  };

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
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(user.id, user.name || "")}
                          className="text-sm text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
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

      {/* Edit User Modal */}
      {editMode && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
                <button
                  onClick={() => { setEditMode(false); setEditingUser(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <form onSubmit={handleEditSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        checked={editFormData.isAdmin}
                        onChange={(e) => setEditFormData({ ...editFormData, isAdmin: e.target.checked })}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Administrator
                      </span>
                    </label>
                  </div>
                </div>

                {editError && (
                  <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-2 rounded">
                    {editError}
                  </div>
                )}

                {editSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-500 px-4 py-2 rounded">
                    {editSuccess}
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setEditingUser(null); }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
              <button
                onClick={() => setDeleteModal({ open: false, userId: null, userName: "" })}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteModal.userName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteModal({ open: false, userId: null, userName: "" })}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
