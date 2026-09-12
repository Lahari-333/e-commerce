import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchDashboardStatsApi } from "../../services/adminApi";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus
} from "lucide-react";

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetchDashboardStatsApi(token);
        setStats(res.data);
        setError(null);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err.message);
        setError(err.message || "Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadStats();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${Number(stats?.total_revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "From completed and pending orders",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100"
    },
    {
      title: "Total Orders",
      value: stats?.total_orders || 0,
      subtitle: `${stats?.pending_orders || 0} pending processing`,
      icon: ShoppingBag,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100"
    },
    {
      title: "Products Catalog",
      value: stats?.total_products || 0,
      subtitle: `${stats?.active_products || 0} active in storefront`,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100"
    },
    {
      title: "Registered Customers",
      value: stats?.total_customers || 0,
      subtitle: `${stats?.total_users || 0} total accounts`,
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time catalog metrics, inventory status, and order performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
          <Link
            to="/admin/inventory"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl shadow-sm transition-all"
          >
            Manage Stock
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {stats?.low_stock_count > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Low Stock Alert</p>
              <p className="text-xs text-amber-700">
                {stats.low_stock_count} item{stats.low_stock_count === 1 ? "" : "s"} have reached or fallen below their low-stock threshold.
              </p>
            </div>
          </div>
          <Link
            to="/admin/inventory"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl whitespace-nowrap transition-colors"
          >
            View Inventory →
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{card.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 text-center">
          <span className="text-[11px] font-semibold text-slate-500">Pending</span>
          <p className="text-lg font-black text-amber-600 mt-1">{stats?.pending_orders || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 text-center">
          <span className="text-[11px] font-semibold text-slate-500">Confirmed</span>
          <p className="text-lg font-black text-blue-600 mt-1">{stats?.confirmed_orders || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 text-center">
          <span className="text-[11px] font-semibold text-slate-500">Shipped</span>
          <p className="text-lg font-black text-indigo-600 mt-1">{stats?.shipped_orders || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 text-center">
          <span className="text-[11px] font-semibold text-slate-500">Delivered</span>
          <p className="text-lg font-black text-emerald-600 mt-1">{stats?.delivered_orders || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 text-center col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500">Cancelled</span>
          <p className="text-lg font-black text-rose-600 mt-1">{stats?.cancelled_orders || 0}</p>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Customer Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest purchases awaiting fulfillment</p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View All Orders
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recent_orders?.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No customer orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recent_orders?.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {ord.order_number}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{ord.customer_name}</p>
                      <p className="text-[11px] text-slate-400">{ord.customer_email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      ₹{Number(ord.total_amount).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-slate-100 text-slate-700">
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
