import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchAdminOrderByIdApi, updateAdminOrderStatusApi } from "../../services/adminApi";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CreditCard,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  RefreshCw,
  History,
  FileText,
  ExternalLink
} from "lucide-react";

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status update state
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState(null);

  const loadOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminOrderByIdApi(token, id);
      if (res.success) {
        setOrder(res.data);
        setNewStatus(res.data.status || res.data.order_status);
      } else {
        setError(res.message || "Failed to load order details");
      }
    } catch (err) {
      console.error("Fetch order details error:", err);
      setError(err.message || "Network error loading order details");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!order || !newStatus) return;

    try {
      setUpdating(true);
      setUpdateMsg(null);
      const res = await updateAdminOrderStatusApi(token, order.id, {
        status: newStatus,
        comment: statusComment
      });

      if (res.success) {
        setUpdateMsg({ type: "success", text: "Order status updated successfully!" });
        setStatusComment("");
        // Reload order to reflect updated history & payment status
        await loadOrderDetails();
      } else {
        setUpdateMsg({ type: "error", text: res.message || "Failed to update status" });
      }
    } catch (err) {
      setUpdateMsg({ type: "error", text: err.message || "Network error updating status" });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Package className="w-3.5 h-3.5" />
            Processing
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Truck className="w-3.5 h-3.5" />
            Shipped
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-lg mx-auto mt-10">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Unable to load order</h2>
        <p className="text-sm text-slate-500 mt-1">{error || "Order not found"}</p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/orders")}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to Orders"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Order #{order.order_number}
              </h1>
              {getStatusBadge(order.status || order.order_status)}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              Placed on {formattedDate}
            </p>
          </div>
        </div>

        <button
          onClick={loadOrderDetails}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Main Grid: Left side (Status update & items), Right side (Customer, Shipping & Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Update Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Update Fulfillment Status
            </h2>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    New Order Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Status Note / Tracking (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shipped via BlueDart AWB #84920"
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Status transition hint */}
              {newStatus === "delivered" && order.payment_method === "cod" && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  ℹ️ Marking this Cash on Delivery order as <strong>Delivered</strong> will automatically mark its payment status as <strong>Paid</strong>.
                </p>
              )}
              {newStatus === "cancelled" && (
                <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  ⚠️ Marking this order as <strong>Cancelled</strong> will automatically restore item quantities back into active inventory.
                </p>
              )}

              {updateMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    updateMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {updateMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  {updateMsg.text}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating || newStatus === order.status}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating Status...
                    </>
                  ) : (
                    "Apply Status Change"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Ordered Line Items Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Order Items ({order.items?.length || 0})
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {order.items?.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={item.product_slug ? `/products/${item.product_slug}` : "#"}
                      target="_blank"
                      className="text-sm font-semibold text-slate-900 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <span>{item.product_name}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      SKU: {item.product_sku || "N/A"}
                    </div>
                    {item.variant_name && (
                      <span className="inline-block px-2 py-0.5 mt-1 bg-slate-100 text-slate-700 text-[11px] font-medium rounded">
                        {item.variant_name}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      ₹{Number(item.line_total || item.unit_price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ₹{Number(item.unit_price).toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail / Status History */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Order Status History & Audit Log
            </h2>

            {order.history && order.history.length > 0 ? (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {order.history.map((h) => {
                  const hDate = new Date(h.created_at).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div key={h.id} className="relative group">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs uppercase tracking-wider text-indigo-700">
                            Status: {h.status}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{hDate}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {h.comment || "Status updated"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No status changes logged yet.</p>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Summary, Shipping & Customer */}
        <div className="space-y-6">
          {/* Cost Summary Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Payment & Totals
            </h2>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900">₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee:</span>
                <span className="font-medium text-slate-900">
                  {order.shipping_fee === 0 ? "FREE" : `₹${order.shipping_fee.toFixed(2)}`}
                </span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-indigo-600">₹{order.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Payment Method:</span>
                <span className="text-xs font-bold uppercase text-slate-800">
                  {order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-slate-500">Payment Status:</span>
                <span
                  className={`text-xs font-bold ${
                    order.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {order.payment_status === "paid" ? "Paid" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Details Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Customer Details
            </h2>

            <div className="text-sm">
              <p className="font-semibold text-slate-900">{order.customer_name || "Guest Customer"}</p>
              <p className="text-xs text-slate-500 mt-0.5">{order.customer_email}</p>
              <div className="mt-3">
                <Link
                  to={`/admin/users/${order.user_id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View Customer Profile →
                </Link>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Shipping Address
            </h2>

            {order.shipping_address ? (
              <div className="text-sm text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">{order.shipping_address.full_name}</p>
                <p className="text-xs text-slate-500">Phone: {order.shipping_address.phone}</p>
                <p className="pt-1 text-slate-600">{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && (
                  <p className="text-slate-600">{order.shipping_address.address_line2}</p>
                )}
                <p className="text-slate-600">
                  {order.shipping_address.city}, {order.shipping_address.state}{" "}
                  {order.shipping_address.postal_code}
                </p>
                <p className="text-slate-600 font-medium">{order.shipping_address.country || "India"}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No specific delivery address recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
