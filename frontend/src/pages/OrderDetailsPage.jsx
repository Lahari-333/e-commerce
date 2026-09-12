import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchOrderByIdApi } from "../services/orderApi";
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowLeft,
  Clock,
  ShieldCheck
} from "lucide-react";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const successMessage = location.state?.successMessage;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location,
          message: "Please sign in to view order details."
        }
      });
      return;
    }

    async function loadOrder() {
      try {
        setLoading(true);
        const res = await fetchOrderByIdApi(token, id);
        setOrder(res.data);
        setError(null);
      } catch (err) {
        console.error("Failed to load order details:", err.message);
        setError(err.message || "Order not found");
      } finally {
        setLoading(false);
      }
    }

    if (token && id) {
      loadOrder();
    }
  }, [id, token, isAuthenticated, navigate, location]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-full">
            <Truck className="w-4 h-4" />
            Shipped
          </span>
        );
      case "confirmed":
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
            <Clock className="w-4 h-4" />
            Confirmed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
            <AlertCircle className="w-4 h-4" />
            Cancelled
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
            <Clock className="w-4 h-4" />
            Order Placed (Pending)
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-slate-200 rounded-2xl" />
            <div className="h-64 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-sm text-slate-600 mt-2 max-w-sm">
          {error || "We couldn't retrieve the details for this order. It may not exist or does not belong to your account."}
        </p>
        <Link
          to="/orders"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Back button */}
        <div className="flex items-center justify-between">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <Link
            to="/products"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Order Placement Success Banner */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-900">Thank you for your order!</h3>
              <p className="text-xs text-emerald-800 mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Order Header Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {order.order_number}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Placed on {formattedDate}
            </p>
          </div>

          <div className="pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 flex items-center gap-3">
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Payment: {order.payment_method?.toUpperCase() || "COD"} ({order.payment_status})
            </span>
          </div>
        </div>

        {/* Main Content: 2-Column Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Items List */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Ordered Items ({order.items?.length || 0})
              </h2>
            </div>

            <div className="divide-y divide-slate-100 p-5 space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="pt-4 first:pt-0 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
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
                    {item.product_slug ? (
                      <Link
                        to={`/products/${item.product_slug}`}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                      >
                        {item.product_name}
                      </Link>
                    ) : (
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.product_name}</p>
                    )}

                    {item.variant_name && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Variant: <span className="text-slate-800 font-medium">{item.variant_name}</span>
                      </p>
                    )}

                    <p className="text-xs text-slate-500 mt-1">
                      Qty: <strong className="text-slate-800">{item.quantity}</strong> × ₹
                      {Number(item.unit_price).toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold text-slate-900">
                      ₹{Number(item.line_total).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {order.notes && (
              <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-700">Delivery Instructions:</p>
                <p className="text-xs text-slate-600 mt-1 italic">"{order.notes}"</p>
              </div>
            )}
          </div>

          {/* Right Column: Address & Price Breakdown */}
          <div className="lg:col-span-4 space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Delivery Address
                </h3>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900 text-sm">
                  {order.shipping_address?.full_name}
                </p>
                <p>{order.shipping_address?.address_line1}</p>
                {order.shipping_address?.address_line2 && (
                  <p>{order.shipping_address?.address_line2}</p>
                )}
                <p>
                  {order.shipping_address?.city}, {order.shipping_address?.state} -{" "}
                  {order.shipping_address?.postal_code}
                </p>
                <p>{order.shipping_address?.country}</p>
                <p className="pt-2 font-mono text-slate-500">
                  Phone: {order.shipping_address?.phone}
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
                Payment Summary
              </h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    ₹{Number(order.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className={Number(order.shipping_fee) === 0 ? "text-emerald-600 font-bold" : "font-semibold text-slate-900"}>
                    {Number(order.shipping_fee) === 0 ? "FREE" : `₹${Number(order.shipping_fee).toFixed(2)}`}
                  </span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-indigo-600 text-base">
                    ₹{Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Verified authentic order securely recorded in MySQL.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
