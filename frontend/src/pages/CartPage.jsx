import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Package,
  Lock
} from "lucide-react";

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { items, subtotal, totalItemCount, error, updateCartItem, removeCartItem, clearCart } = useCart();
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [actionError, setActionError] = useState("");

  // If user is guest, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8 text-center bg-slate-50/50">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Sign In to Access Your Cart
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-md">
          Your shopping cart is securely saved to your customer account. Sign in to view your items, update quantities, and prepare for checkout.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/login"
            state={{ from: { pathname: "/cart" } }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-md shadow-indigo-600/20 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Sign In to Continue
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Continue Browsing
          </Link>
        </div>
      </div>
    );
  }

  // Handle quantity modification
  const handleQuantityChange = async (itemId, currentQty, delta, maxStock) => {
    setActionError("");
    const newQty = currentQty + delta;
    if (newQty <= 0) return;
    if (newQty > maxStock) {
      setActionError(`Maximum available stock for this item is ${maxStock}`);
      return;
    }

    setUpdatingItemId(itemId);
    try {
      await updateCartItem(itemId, newQty);
    } catch (err) {
      setActionError(err.message || "Failed to update item quantity");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setActionError("");
    setUpdatingItemId(itemId);
    try {
      await removeCartItem(itemId);
    } catch (err) {
      setActionError(err.message || "Failed to remove item");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to empty your entire cart?")) {
      setActionError("");
      try {
        await clearCart();
      } catch (err) {
        setActionError(err.message || "Failed to clear cart");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Shopping Cart
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {totalItemCount === 0
                ? "Your cart is empty"
                : `You have ${totalItemCount} item${totalItemCount === 1 ? "" : "s"} in your cart`}
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Global Errors or Action Errors */}
        {(actionError || error) && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{actionError || error}</p>
          </div>
        )}

        {/* Empty Cart View */}
        {items.length === 0 ? (
          <div className="mt-12 text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto px-4">
            <div className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-5">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              Looks like you haven't added anything to your cart yet. Explore our curated collections to find what you love!
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
          /* Populated Cart Grid */
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Cart Items</h2>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
                >
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isUpdating = updatingItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-opacity ${
                        isUpdating ? "opacity-50 pointer-events-none" : "opacity-100"
                      }`}
                    >
                      {/* Product Thumbnail */}
                      <Link
                        to={`/products/${item.product_slug}`}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.product_name}
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product_slug}`}
                          className="text-sm sm:text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                        >
                          {item.product_name}
                        </Link>

                        {item.variant_name && (
                          <p className="text-xs font-medium text-slate-500 mt-1">
                            Variant: <span className="text-slate-800 font-semibold">{item.variant_name}</span>
                          </p>
                        )}

                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          ₹{Number(item.price).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity, -1, item.available_stock)}
                          disabled={item.quantity <= 1 || isUpdating}
                          className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs sm:text-sm font-semibold text-slate-900 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, item.quantity, 1, item.available_stock)}
                          disabled={item.quantity >= item.available_stock || isUpdating}
                          className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Total & Remove */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                        <span className="text-sm sm:text-base font-bold text-slate-900">
                          ₹{Number(item.line_total).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          disabled={isUpdating}
                          className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="sm:hidden">Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalItemCount} items)</span>
                  <span className="font-semibold text-slate-900">₹{Number(subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className={subtotal >= 1000 ? "text-emerald-600 font-semibold" : "text-slate-900 font-semibold"}>
                    {subtotal >= 1000 ? "Free" : "₹50.00"}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                  <span>Estimated Total</span>
                  <span className="text-indigo-600">
                    ₹{Number(subtotal + (subtotal >= 1000 ? 0 : 50)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Proceed to Checkout Link */}
              <div>
                <Link
                  to="/checkout"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="mt-2 text-[11px] text-center text-slate-500">
                  Cash on Delivery & Test Payment supported.
                </p>
              </div>

              {/* Security Badge */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-500">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Safe & secure 256-bit SSL encrypted storefront checkout.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
