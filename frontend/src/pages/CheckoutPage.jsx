import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { fetchAddressesApi, createAddressApi } from "../services/addressApi";
import { createOrderApi } from "../services/orderApi";
import {
  ShoppingBag,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Package,
  ArrowLeft
} from "lucide-react";

export default function CheckoutPage() {
  const { token, isAuthenticated } = useAuth();
  const { items, subtotal, refreshCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Address creation form state
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    is_default: false
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressFormError, setAddressFormError] = useState("");

  // Order placement state
  const [notes, setNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  // 1. Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location,
          message: "Please sign in to proceed to checkout."
        }
      });
    }
  }, [isAuthenticated, navigate, location]);

  // 2. Load addresses
  useEffect(() => {
    async function loadAddresses() {
      if (!token) return;
      try {
        setLoadingAddresses(true);
        const res = await fetchAddressesApi(token);
        const addrList = res.data || [];
        setAddresses(addrList);

        if (addrList.length > 0) {
          const defaultAddr = addrList.find((a) => a.is_default) || addrList[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setShowNewAddressForm(true);
        }
      } catch (err) {
        console.error("Failed to load addresses:", err.message);
      } finally {
        setLoadingAddresses(false);
      }
    }

    if (isAuthenticated && token) {
      loadAddresses();
    }
  }, [isAuthenticated, token]);

  // Shipping fee calculation according to Project Rule 5
  const shippingFee = subtotal >= 1000 ? 0 : 50;
  const totalAmount = Number((subtotal + shippingFee).toFixed(2));

  // Handle Save New Address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressFormError("");

    if (!newAddress.full_name.trim()) {
      setAddressFormError("Recipient full name is required");
      return;
    }
    if (!newAddress.phone.trim()) {
      setAddressFormError("Phone number is required");
      return;
    }
    if (!newAddress.address_line1.trim()) {
      setAddressFormError("Street address is required");
      return;
    }
    if (!newAddress.city.trim() || !newAddress.state.trim() || !newAddress.postal_code.trim()) {
      setAddressFormError("City, State, and Postal Code are required");
      return;
    }

    setSavingAddress(true);
    try {
      const res = await createAddressApi(token, newAddress);
      const created = res.data;
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setShowNewAddressForm(false);
      setNewAddress({
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        is_default: false
      });
    } catch (err) {
      setAddressFormError(err.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle Place Order
  const handlePlaceOrder = async () => {
    setOrderError("");

    if (!selectedAddressId) {
      setOrderError("Please select or enter a delivery address");
      return;
    }

    if (items.length === 0) {
      setOrderError("Your shopping cart is empty");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await createOrderApi(token, {
        address_id: selectedAddressId,
        payment_method: "cod",
        notes: notes.trim() || null
      });

      if (res.success && res.data) {
        // Refresh cart state globally
        if (refreshCart) {
          await refreshCart();
        }
        navigate(`/orders/${res.data.order_number || res.data.order_id}`, {
          state: {
            successMessage: "Your order has been placed successfully! Cash on Delivery is confirmed."
          },
          replace: true
        });
      }
    } catch (err) {
      setOrderError(err.message || "Failed to place order. Please check item stock and try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Empty cart display
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8 text-center bg-slate-50/50">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Your Cart is Empty
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-md">
          You don't have any items in your cart to checkout. Please explore our products and add what you love!
        </p>
        <div className="mt-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-md shadow-indigo-600/20 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Explore Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Checkout
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review your delivery address and complete your order
            </p>
          </div>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
        </div>

        {/* Global Error Banner */}
        {orderError && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 font-medium">{orderError}</p>
          </div>
        )}

        {/* Main 2-Column Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Delivery Address & Payment Method */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Shipping Address Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Delivery Address</h2>
                </div>
                {!showNewAddressForm && (
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Address
                  </button>
                )}
              </div>

              {loadingAddresses ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Loading saved addresses...
                </div>
              ) : (
                !showNewAddressForm && (
                  <div className="space-y-3">
                    {addresses.length === 0 ? (
                      <p className="text-sm text-slate-500 py-4 text-center">
                        No saved delivery addresses found. Please add an address below.
                      </p>
                    ) : (
                      addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <label
                            key={addr.id}
                            className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <input
                              type="radio"
                              name="shipping_address"
                              value={addr.id}
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <div className="ml-3.5 flex-1 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{addr.full_name}</span>
                                {addr.is_default === 1 && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-600 mt-1">
                                {addr.address_line1}
                                {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                              </p>
                              <p className="text-slate-500 text-xs mt-0.5">
                                {addr.city}, {addr.state} - {addr.postal_code}, {addr.country}
                              </p>
                              <p className="text-slate-500 text-xs mt-1 font-mono">
                                Phone: {addr.phone}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                )
              )}

              {/* Inline Add Address Form */}
              {showNewAddressForm && (
                <form onSubmit={handleSaveAddress} className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Add New Delivery Address</h3>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {addressFormError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                      {addressFormError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.full_name}
                        onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Street Address (Line 1) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.address_line1}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                      placeholder="House/Flat No., Street, Landmark"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={newAddress.address_line2}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                      placeholder="Apartment, suite, area"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        placeholder="State"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        PIN / Postal *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        placeholder="560001"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={newAddress.is_default}
                      onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 rounded border-slate-300"
                    />
                    <label htmlFor="is_default" className="text-xs text-slate-700 cursor-pointer">
                      Save as default shipping address
                    </label>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm disabled:opacity-60 transition-colors"
                    >
                      {savingAddress ? "Saving..." : "Save Address"}
                    </button>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* 2. Payment Method Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h2 className="text-base font-bold text-slate-900">Payment Method</h2>
              </div>

              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Cash on Delivery (COD) / Test Payment
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      Zero Extra Fee
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Pay securely with cash or digital UPI upon product delivery to your doorstep. No advance card payment required.
                  </p>
                </div>
              </div>

              {/* Delivery Notes / Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Delivery Notes / Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please leave package with the security desk or ring the doorbell."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4">
                Order Review ({items.length} item{items.length === 1 ? "" : "s"})
              </h2>

              {/* Items List */}
              <div className="max-h-80 overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-bold text-slate-900 truncate">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-[11px] text-slate-500">{item.variant_name}</p>
                      )}
                      <p className="text-slate-500 mt-0.5">
                        Qty: <strong className="text-slate-800">{item.quantity}</strong> × ₹
                        {Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      ₹{Number(item.line_total).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span>Shipping Fee</span>
                    {subtotal >= 1000 ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                        Free Order (&gt;₹1,000)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        (Add ₹{(1000 - subtotal).toFixed(0)} for Free Shipping)
                      </span>
                    )}
                  </div>
                  <span className={shippingFee === 0 ? "text-emerald-600 font-bold" : "font-semibold text-slate-900"}>
                    {shippingFee === 0 ? "FREE" : `₹${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-indigo-600 text-base">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <div>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || !selectedAddressId}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 disabled:pointer-events-none"
                >
                  {isPlacingOrder ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                      Placing Your Order...
                    </>
                  ) : (
                    <>
                      Place Order (Cash on Delivery)
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                {!selectedAddressId && (
                  <p className="text-[11px] text-rose-600 text-center mt-2">
                    Please add or select a delivery address to place your order.
                  </p>
                )}
              </div>

              {/* Assurances */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-500">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Zero-risk ordering with free cancellation before shipment.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
