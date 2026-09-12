import React from "react";
import ProductCard from "./ProductCard";
import EmptyState from "./EmptyState";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ProductGrid({
  products = [],
  loading = false,
  error = null,
  onRetry = null,
  onClearFilters = null,
  emptyTitle = "No products found",
  emptyMessage = "Try searching for another keyword or selecting a different category.",
  onAddToCartClick = null,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-4 space-y-4 animate-pulse"
          >
            <div className="aspect-square bg-slate-200 rounded-xl w-full" />
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-3 bg-slate-200 rounded w-2/3" />
            </div>
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-9 bg-slate-200 rounded-xl" />
              <div className="h-9 bg-slate-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center bg-rose-50 border border-rose-200 rounded-2xl max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Service Temporarily Unavailable</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={onClearFilters ? "Reset Filters" : null}
        onAction={onClearFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCartClick={onAddToCartClick}
        />
      ))}
    </div>
  );
}
