import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchAdminInventoryApi, updateAdminInventoryApi } from "../../services/adminApi";
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit3,
  Check,
  X,
  ArrowUpRight,
  TrendingDown,
  Layers
} from "lucide-react";

export default function AdminInventoryPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'low' | 'out' | 'ok'

  // Modal / Editing state
  const [editingItem, setEditingItem] = useState(null);
  const [editQty, setEditQty] = useState(0);
  const [editThreshold, setEditThreshold] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminInventoryApi(token);
      if (res.success) {
        setItems(res.data);
      } else {
        setError(res.message || "Failed to load inventory");
      }
    } catch (err) {
      console.error("Load inventory error:", err);
      setError(err.message || "Network error while loading inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [token]);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditQty(item.quantity);
    setEditThreshold(item.low_stock_threshold || 5);
    setSaveSuccessMsg("");
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSaving(true);
      setSaveSuccessMsg("");
      const res = await updateAdminInventoryApi(token, editingItem.id, {
        quantity: parseInt(editQty, 10),
        low_stock_threshold: parseInt(editThreshold, 10)
      });

      if (res.success) {
        setSaveSuccessMsg("Stock updated successfully!");
        // Update local items state
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingItem.id
              ? {
                  ...it,
                  quantity: Number(editQty),
                  available_stock: Number(editQty) - Number(it.reserved_quantity),
                  low_stock_threshold: Number(editThreshold),
                  is_low_stock: (Number(editQty) - Number(it.reserved_quantity)) <= Number(editThreshold)
                }
              : it
          )
        );
        setTimeout(() => {
          setEditingItem(null);
          setSaveSuccessMsg("");
        }, 1200);
      }
    } catch (err) {
      alert("Failed to update inventory: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // Metrics calculation
  const totalItemsCount = items.length;
  const outOfStockCount = items.filter((i) => i.available_stock <= 0).length;
  const lowStockCount = items.filter((i) => i.available_stock > 0 && i.is_low_stock).length;
  const healthyStockCount = items.filter((i) => i.available_stock > i.low_stock_threshold).length;
  const totalUnits = items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  // Filter items
  const filteredItems = items.filter((item) => {
    const nameMatch = (item.product_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const skuMatch = (item.product_sku || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                     (item.variant_sku || "").toLowerCase().includes(searchQuery.toLowerCase());
    const variantMatch = (item.variant_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || skuMatch || variantMatch;

    if (!matchesSearch) return false;

    if (filterStatus === "out") return item.available_stock <= 0;
    if (filterStatus === "low") return item.available_stock > 0 && item.is_low_stock;
    if (filterStatus === "ok") return item.available_stock > item.low_stock_threshold;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-indigo-600" />
            Inventory Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor real-time warehouse stock, track reserved quantities, and adjust thresholds.
          </p>
        </div>

        <button
          onClick={loadInventory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Products</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalItemsCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">{totalUnits.toLocaleString()} units stored</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">In Stock</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{healthyStockCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Stock is above threshold</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Low Stock</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{lowStockCount}</p>
            <p className="text-xs text-amber-700 mt-0.5">Needs reordering soon</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Out of Stock</p>
            <p className="text-2xl font-bold text-rose-900 mt-1">{outOfStockCount}</p>
            <p className="text-xs text-rose-700 mt-0.5">Unavailable for purchase</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
          {[
            { id: "all", label: "All Items" },
            { id: "low", label: "Low Stock" },
            { id: "out", label: "Out of Stock" },
            { id: "ok", label: "Optimal Stock" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading live inventory data...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <p className="font-semibold">Error: {error}</p>
            <button
              onClick={loadInventory}
              className="mt-3 px-4 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No inventory records found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Product / SKU</th>
                  <th className="py-3.5 px-4 text-center">Total Quantity</th>
                  <th className="py-3.5 px-4 text-center">Reserved</th>
                  <th className="py-3.5 px-4 text-center">Available Stock</th>
                  <th className="py-3.5 px-4 text-center">Min Threshold</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                {filteredItems.map((item) => {
                  const isOut = item.available_stock <= 0;
                  const isLow = !isOut && item.is_low_stock;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <Link
                              to={`/admin/products/${item.product_id}/edit`}
                              className="font-medium text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-1"
                            >
                              <span>{item.product_name}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs text-slate-500">
                                SKU: {item.variant_sku || item.product_sku || "N/A"}
                              </span>
                              {item.variant_name && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                                  {item.variant_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold text-slate-900">
                        {item.quantity}
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {item.reserved_quantity || 0}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-bold text-base ${
                            isOut
                              ? "text-rose-600"
                              : isLow
                              ? "text-amber-600"
                              : "text-emerald-700"
                          }`}
                        >
                          {item.available_stock}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {item.low_stock_threshold || 5}
                      </td>

                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Adjust
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

      {/* Quick Stock Adjustment Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Adjust Inventory</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Product</p>
                <p className="font-semibold text-slate-900 mt-0.5">{editingItem.product_name}</p>
                {editingItem.variant_name && (
                  <p className="text-xs text-indigo-600 font-medium">Variant: {editingItem.variant_name}</p>
                )}
                <p className="font-mono text-xs text-slate-500 mt-0.5">SKU: {editingItem.product_sku || "N/A"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Physical Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-1 mt-2">
                    {[+5, +10, +50].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setEditQty((prev) => Math.max(0, Number(prev) + inc))}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded font-medium"
                      >
                        +{inc}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editThreshold}
                    onChange={(e) => setEditThreshold(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Triggers low stock badge</p>
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {saveSuccessMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={saving}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
