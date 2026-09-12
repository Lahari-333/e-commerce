import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchOrdersApi } from "../services/orderApi";
import {
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Calendar,
  CreditCard
} from "lucide-react";

export default function OrdersPage() {
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location,
          message: "Please sign in to view your orders."
        }
      });
      return;
    }

    async function loadOrders() {
      try {
        setLoading(true);
        const res = await fetchOrdersApi(token);
        setOrders(res.data || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch customer orders:", err.message);
        setError(err.message || "Failed to load your orders");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadOrders();
    }
  }, [isAuthenticated, token, navigate, location]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-full">
            <Truck className="w-3.5 h-3.5" />
            Shipped
          </span>
        );
      case "confirmed":
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Order Placed (Pending)
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-200 rounded-2xl w-full" />
          <div className="h-32 bg-slate-200 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="pb-8 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            My Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View details and tracking history for all your past purchases
          </p>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="mt-12 text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto px-4">
            <div className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-5">
              <Package className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">No orders found</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              You haven't placed any orders with Shop Express yet. When you complete checkout, your order history will appear here.
            </p>
            <div className="mt-8">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-md shadow-indigo-600/20 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Start Shopping Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Orders List */
          <div className="mt-8 space-y-4">
            {orders.map((order) => {
              const formattedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {order.order_number}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formattedDate}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        {order.payment_method?.toUpperCase() || "COD"} (
                        {order.payment_status || "Pending"})
                      </span>
                      <span>•</span>
                      <span>{order.total_items || 1} item(s)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Total Amount
                      </p>
                      <p className="text-base font-black text-slate-900">
                        ₹{Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>

                    <Link
                      to={`/orders/${order.order_number || order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                    >
                      View Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
