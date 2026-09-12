import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from "lucide-react";

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const { wishlistItems, totalWishlistCount, loading, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [movingId, setMovingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMoveToCart = async (item) => {
    try {
      setMovingId(item.product_id);
      await addToCart(item.product_id, null, 1);
      await removeFromWishlist(item.product_id);
      showToast(`Moved "${item.name}" to your cart!`);
    } catch (err) {
      showToast(err.message || "Failed to move item to cart", "error");
    } finally {
      setMovingId(null);
    }
  };

  const handleRemove = async (productId, productName) => {
    try {
      setRemovingId(productId);
      await removeFromWishlist(productId);
      showToast(`Removed "${productName}" from your wishlist.`);
    } catch (err) {
      showToast(err.message || "Failed to remove item", "error");
    } finally {
      setRemovingId(null);
    }
  };

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear your entire wishlist?")) {
      try {
        await clearWishlist();
        showToast("Wishlist cleared successfully");
      } catch (err) {
        showToast(err.message || "Failed to clear wishlist", "error");
      }
    }
  };

  // Not logged in view
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Your Wishlist Awaits</h2>
          <p className="text-sm text-slate-500 mt-2">
            Please sign in to save and manage your favorite items across all your devices.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/products"
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Explore Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-sm font-medium animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white border-slate-800"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
          {toastMessage.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-rose-600 fill-rose-600" />
            My Wishlist
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalWishlistCount === 1
              ? "1 saved product in your list"
              : `${totalWishlistCount} saved products in your list`}
          </p>
        </div>

        {totalWishlistCount > 0 && (
          <button
            onClick={handleClear}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg border border-rose-200 transition-colors self-start sm:self-auto"
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading your wishlist...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        /* Empty State */
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your wishlist is empty</h2>
          <p className="text-sm text-slate-500 mt-2">
            Explore our curated catalog and tap the heart icon on any product to save it for later.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Start Browsing
          </Link>
        </div>
      ) : (
        /* Wishlist Items Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {wishlistItems.map((item) => {
            const isMoving = movingId === item.product_id;
            const isRemoving = removingId === item.product_id;

            return (
              <div
                key={item.item_id || item.product_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow relative"
              >
                {/* Remove button floating at top-right */}
                <button
                  type="button"
                  onClick={() => handleRemove(item.product_id, item.name)}
                  disabled={isRemoving}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 shadow-sm transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Product Image */}
                <Link
                  to={`/products/${item.slug}`}
                  className="relative aspect-square bg-slate-100 overflow-hidden block"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Package className="w-12 h-12" />
                    </div>
                  )}

                  {/* Stock tag */}
                  <div className="absolute bottom-2.5 left-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${
                        item.in_stock
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {item.in_stock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </Link>

                {/* Info Container */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {item.category_name && (
                      <p className="text-[11px] uppercase font-bold tracking-wider text-indigo-600 mb-1">
                        {item.category_name}
                      </p>
                    )}

                    <Link
                      to={`/products/${item.slug}`}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600 line-clamp-2 transition-colors"
                    >
                      {item.name}
                    </Link>

                    {/* Price */}
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                      {item.discount_price && item.discount_price < item.base_price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{Number(item.base_price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleMoveToCart(item)}
                      disabled={!item.in_stock || isMoving}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                        item.in_stock
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {isMoving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Moving to Cart...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {item.in_stock ? "Move to Cart" : "Out of Stock"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
