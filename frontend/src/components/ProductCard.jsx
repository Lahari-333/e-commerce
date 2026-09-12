import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Eye, Star, ImageOff, Tag, Check, AlertCircle, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function ProductCard({ product, onAddToCartClick }) {
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const inWishlist = isInWishlist(product.id);

  const basePrice = Number(product.base_price || 0);
  const discountPrice = product.discount_price ? Number(product.discount_price) : null;
  const hasDiscount = discountPrice && discountPrice < basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((basePrice - discountPrice) / basePrice) * 100)
    : 0;

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location,
          message: "Please sign in to save items to your wishlist."
        }
      });
      return;
    }

    try {
      await toggleWishlist(product);
    } catch (err) {
      console.error("Wishlist toggle error:", err);
    }
  };

  const handleAddClick = async () => {
    if (onAddToCartClick) {
      onAddToCartClick(product);
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location,
          message: "Please sign in to add items to your cart."
        }
      });
      return;
    }

    setIsAdding(true);
    setErrorMessage("");
    try {
      await addToCart(product.id, null, 1);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2200);
    } catch (err) {
      setErrorMessage(err.message || "Failed to add to cart");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-slate-300 transition-all duration-300">
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        <Link to={`/products/${product.slug}`} className="block w-full h-full">
          {product.primary_image && !imageError ? (
            <img
              src={product.primary_image}
              alt={product.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 gap-2">
              <ImageOff className="w-8 h-8 stroke-1" />
              <span className="text-xs">Image Unavailable</span>
            </div>
          )}
        </Link>

        {/* Wishlist Toggle Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
            inWishlist
              ? "bg-rose-50 text-rose-600 border border-rose-200"
              : "bg-white/90 backdrop-blur-sm text-slate-400 hover:text-rose-600 hover:bg-white"
          }`}
          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              inWishlist ? "fill-rose-600 text-rose-600" : ""
            }`}
          />
        </button>

        {/* Featured Badge */}
        {product.is_featured && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-current" />
            Featured
          </div>
        )}

        {/* Discount Sale Badge */}
        {hasDiscount && (
          <div
            className={`absolute text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm bg-rose-600 ${
              product.is_featured ? "top-10 left-3" : "top-3 left-3"
            }`}
          >
            {discountPercent}% OFF
          </div>
        )}

        {/* Category Badge */}
        {product.category?.name && (
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />
            {product.category.name}
          </div>
        )}
      </div>

      {/* Product Info Block */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <Link
            to={`/products/${product.slug}`}
            className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
            title={product.name}
          >
            {product.name}
          </Link>

          {product.short_description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {product.short_description}
            </p>
          )}
        </div>

        {/* Rating Summary (if reviewed) */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[11px]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500 mr-1" />
              <span>{Number(product.avg_rating).toFixed(1)}</span>
            </div>
            <span className="text-slate-400 text-[11px]">
              ({product.review_count} {product.review_count === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}

        {/* Pricing Block */}
        <div className="pt-2 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-xl font-extrabold text-slate-900">
                ₹{discountPrice.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 line-through">
                ₹{basePrice.toFixed(2)}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Save ₹{(basePrice - discountPrice).toFixed(0)}
              </span>
            </>
          ) : (
            <span className="text-xl font-extrabold text-slate-900">
              ₹{basePrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Cart Action Feedback */}
        {addSuccess && (
          <div className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold py-1.5 px-2 rounded-lg text-center border border-emerald-200 flex items-center justify-center gap-1.5 animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            Added to Cart!
          </div>
        )}

        {errorMessage && (
          <div className="text-[11px] bg-rose-50 text-rose-700 font-medium py-1 px-2 rounded-lg text-center border border-rose-200 flex items-center justify-center gap-1 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 grid grid-cols-2 gap-2 border-t border-slate-100">
          <Link
            to={`/products/${product.slug}`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            View
          </Link>

          <button
            type="button"
            onClick={handleAddClick}
            disabled={isAdding}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl shadow-sm transition-colors"
          >
            {isAdding ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
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
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
