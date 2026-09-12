import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchAdminUsersApi, fetchAdminUserByIdApi } from "../../services/adminApi";
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  UserCheck,
  Calendar,
  ShoppingBag,
  CreditCard,
  X,
  AlertCircle,
  Mail,
  MapPin,
  ExternalLink
} from "lucide-react";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // User detail modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (roleFilter !== "all") params.role = roleFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await fetchAdminUsersApi(token, params);
      if (res.success) {
        setUsers(res.data);
      } else {
        setError(res.message || "Failed to load users");
      }
    } catch (err) {
      console.error("Admin load users error:", err);
      setError(err.message || "Network error loading users");
    } finally {
      setLoading(false);
    }
  }, [token, roleFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const handleOpenUserDetail = async (userId) => {
    try {
      setLoadingUserDetail(true);
      const res = await fetchAdminUserByIdApi(token, userId);
      if (res.success) {
        setSelectedUser(res.data);
      }
    } catch (err) {
      alert("Failed to load user profile: " + err.message);
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // Metrics
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const customerCount = users.filter((u) => u.role === "customer").length;
  const totalRevenue = users.reduce((acc, curr) => acc + (curr.total_spent || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600" />
            Users & Customer Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer accounts, view administrative roles, and inspect purchase activity.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          Refresh Directory
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Accounts</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Customers</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{customerCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Administrators</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{adminCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Customer Spend</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1">Role:</span>
          {[
            { id: "all", label: "All Roles" },
            { id: "customer", label: "Customers" },
            { id: "admin", label: "Admins" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                roleFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading user records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadUsers}
              className="mt-3 px-4 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No users found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search criteria or role filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                {users.map((u) => {
                  const initials = (u.first_name?.[0] || u.name?.[0] || "U").toUpperCase();
                  const joinDate = new Date(u.created_at).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name || "Customer"}</span>
                              {u.is_active ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300" title="Inactive" />
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <Shield className="w-3 h-3" />
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            <UserCheck className="w-3 h-3" />
                            Customer
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                          {u.order_count}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        ₹{Number(u.total_spent).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{joinDate}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenUserDetail(u.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {(selectedUser.first_name?.[0] || "U").toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {selectedUser.name || `${selectedUser.first_name} ${selectedUser.last_name || ""}`}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Account Meta */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Role:</span>
                  <span className="ml-2 font-bold text-slate-800 uppercase">{selectedUser.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Account Status:</span>
                  <span className="ml-2 font-bold text-emerald-600">
                    {selectedUser.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">User ID:</span>
                  <span className="ml-2 font-mono text-slate-800">#{selectedUser.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Member Since:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {new Date(selectedUser.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })}
                  </span>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  Recent Orders ({selectedUser.orders?.length || 0})
                </h4>

                {selectedUser.orders && selectedUser.orders.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {selectedUser.orders.map((ord) => (
                      <div key={ord.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <Link
                            to={`/admin/orders/${ord.id}`}
                            className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <span>{ord.order_number}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>
                          <span className="text-slate-400 mt-0.5 block">
                            {new Date(ord.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold uppercase text-[10px]">
                            {ord.status}
                          </span>
                          <span className="font-bold text-slate-900">
                            ₹{Number(ord.total_amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-lg text-center">
                    This user has not placed any orders yet.
                  </p>
                )}
              </div>

              {/* Saved Addresses */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Saved Addresses ({selectedUser.addresses?.length || 0})
                </h4>

                {selectedUser.addresses && selectedUser.addresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedUser.addresses.map((addr) => (
                      <div key={addr.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <div className="font-semibold text-slate-900 flex items-center justify-between">
                          <span>{addr.full_name}</span>
                          {addr.is_default && (
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 mt-0.5">Phone: {addr.phone}</p>
                        <p className="text-slate-700 mt-1">
                          {addr.address_line1}
                          {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                        </p>
                        <p className="text-slate-700">
                          {addr.city}, {addr.state} {addr.postal_code}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-lg text-center">
                    No saved addresses.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
