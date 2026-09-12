import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { fetchProductBySlug } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ProductReviewsSection from "../components/ProductReviewsSection";
import {
  ChevronRight,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ImageOff,
  Tag,
  Check,
  Heart
} from "lucide-react";

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantRequiredError, setVariantRequiredError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccessMessage, setCartSuccessMessage] = useState("");
  const [cartErrorMessage, setCartErrorMessage] = useState("");
  const [wishlistToast, setWishlistToast] = useState("");

  const handleToggleWishlist = async () => {
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
      const res = await toggleWishlist(product);
      setWishlistToast(
        res.inWishlist
          ? `Added "${product.name}" to your wishlist!`
          : `Removed "${product.name}" from your wishlist.`
      );
      setTimeout(() => setWishlistToast(""), 3500);
    } catch (err) {
      console.error("Wishlist toggle error:", err);
    }
  };

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await fetchProductBySlug(slug);
        setProduct(data);
        setError(null);

        // Default to primary or first image
        if (data.images && data.images.length > 0) {
          const primary = data.images.find((img) => img.is_primary) || data.images[0];
          setSelectedImage(primary.image_url);
        }

        // Do not auto-select variant so user explicitly selects an option
        setSelectedVariant(null);
        setVariantRequiredError(false);
        setQuantity(1);
      } catch (err) {
        console.error("Failed to load product details:", err);
        setError(err.message || "Product not found");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadProduct();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-slate-200 rounded-3xl w-full" />
          <div className="space-y-6">
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-10 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-12 bg-slate-200 rounded w-1/3" />
            <div className="h-24 bg-slate-200 rounded w-full" />
            <div className="h-14 bg-slate-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Product Not Found</h2>
          <p className="text-sm text-slate-600">
            {error || "The requested item might be unavailable or removed from the catalog."}
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
      </div>
    );
  }

  const hasVariants = Boolean(product.variants && product.variants.length > 0);

  const basePrice = Number(product.base_price || 0);
  const discountPrice = product.discount_price ? Number(product.discount_price) : null;
  const priceModifier = selectedVariant ? Number(selectedVariant.price_modifier || 0) : 0;
  const currentBasePrice = basePrice + priceModifier;
  const currentPrice = discountPrice ? discountPrice + priceModifier : currentBasePrice;
  const hasDiscount = discountPrice && discountPrice < basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((currentBasePrice - currentPrice) / currentBasePrice) * 100)
    : 0;

  // Stock determination:
  // - If product has variants: stock is strictly the selected variant's available_stock
  // - If no variant is selected yet: general stock availability across all variants
  // - If product has NO variants: stock is the product-level inventory
  let availableStock = 0;
  let inStock = false;
  let isLowStock = false;

  if (hasVariants) {
    if (selectedVariant) {
      availableStock = Number(selectedVariant.available_stock || 0);
      inStock = Boolean(selectedVariant.in_stock && availableStock > 0);
      isLowStock = inStock && availableStock <= Number(selectedVariant.low_stock_threshold || 5);
    } else {
      availableStock = Number(product.inventory?.total_available ?? 0);
      inStock = availableStock > 0;
    }
  } else {
    availableStock = Number(product.inventory?.total_available ?? 0);
    inStock = Boolean(product.inventory?.in_stock ?? (availableStock > 0));
    const itemInv = product.inventory?.items?.[0];
    isLowStock = inStock && availableStock <= Number(itemInv?.low_stock_threshold || 5);
  }

  const variantTypeLabel = (() => {
    if (!product.variants || product.variants.length === 0) return "Available Options";
    const names = product.variants.map((v) => v.variant_name.toLowerCase());
    if (names.every((n) => n.includes("size"))) return "Select Size";
    if (names.every((n) => n.includes("black") || n.includes("white") || n.includes("blue") || n.includes("teal") || n.includes("color") || n.includes("band"))) return "Select Color / Style";
    if (names.every((n) => n.includes("ml") || n.includes("litre") || n.includes("liter") || n.includes("capacity") || n.includes("gb") || n.includes("tb"))) return "Select Capacity / Volume";
    return "Select Option / Variant";
  })();

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location,
          message: "Please sign in to add items to your cart."
        }
      });
      return;
    }

    // Require variant selection when product has variants
    if (hasVariants && !selectedVariant) {
      setVariantRequiredError(true);
      setCartErrorMessage(`Please choose an option (${variantTypeLabel.toLowerCase()}) before adding to cart.`);
      setTimeout(() => setCartErrorMessage(""), 5000);
      return;
    }

    if (!inStock || availableStock <= 0) {
      setCartErrorMessage("The selected item is currently out of stock.");
      setTimeout(() => setCartErrorMessage(""), 5000);
      return;
    }

    if (quantity > availableStock) {
      setCartErrorMessage(`Cannot add ${quantity} units. Only ${availableStock} available in stock.`);
      setTimeout(() => setCartErrorMessage(""), 5000);
      return;
    }

    setIsAddingToCart(true);
    setCartSuccessMessage("");
    setCartErrorMessage("");

    try {
      await addToCart(product.id, selectedVariant?.id || null, quantity);
      const variantSuffix = selectedVariant ? ` (${selectedVariant.variant_name})` : "";
      setCartSuccessMessage(`Added ${quantity} × "${product.name}${variantSuffix}" to your cart!`);
      setTimeout(() => setCartSuccessMessage(""), 5000);
    } catch (err) {
      setCartErrorMessage(err.message || "Failed to add item to cart");
      setTimeout(() => setCartErrorMessage(""), 5000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Controls: Back Button & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto">
          <Link to="/" className="hover:text-indigo-600 transition-colors whitespace-nowrap">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <Link to="/products" className="hover:text-indigo-600 transition-colors whitespace-nowrap">
            Products
          </Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <Link
                to={`/products?category=${encodeURIComponent(product.category.slug)}`}
                className="hover:text-indigo-600 transition-colors whitespace-nowrap"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="font-semibold text-slate-900 truncate max-w-xs">
            {product.name}
          </span>
        </nav>

        {/* Back to Products Navigation */}
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
        </Link>
      </div>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Gallery Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative shadow-sm">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                <ImageOff className="w-12 h-12 stroke-1" />
                <span className="text-sm">No Preview Available</span>
              </div>
            )}

            {product.is_featured && (
              <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                <Star className="w-3.5 h-3.5 fill-current" />
                Featured Product
              </span>
            )}

            {hasDiscount && (
              <span className="absolute top-4 right-4 bg-rose-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails strip */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImage === img.image_url
                      ? "border-indigo-600 ring-2 ring-indigo-600/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text || product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-3">
            {product.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                <Tag className="w-3 h-3" />
                {product.category.name}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>SKU: <strong className="text-slate-800 font-mono">{product.sku}</strong></span>
              <span>•</span>
              <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Authentic MySQL Stock</span>
              </div>
            </div>

            {product.short_description && (
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-2">
                {product.short_description}
              </p>
            )}
          </div>

          {/* Pricing Block */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Price
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">
                ₹{currentPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    ₹{currentBasePrice.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    Save ₹{(currentBasePrice - currentPrice).toFixed(0)} ({discountPercent}% off)
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500">Inclusive of all applicable taxes</p>
          </div>

          {/* Available Variants */}
          {hasVariants && (
            <div className={`space-y-3 p-4 rounded-2xl border transition-all ${
              variantRequiredError && !selectedVariant
                ? "bg-rose-50/60 border-rose-300 ring-2 ring-rose-400/20"
                : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>{variantTypeLabel}</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                {selectedVariant ? (
                  <span className="text-xs text-indigo-600 font-semibold">
                    Selected: <strong>{selectedVariant.variant_name}</strong>
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">
                    Required selection
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const isOutOfStock = !v.in_stock;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => {
                        setSelectedVariant(v);
                        setVariantRequiredError(false);
                        setCartErrorMessage("");
                        if (v.variant_image) {
                          setSelectedImage(v.variant_image);
                        }
                        if (v.available_stock > 0 && quantity > v.available_stock) {
                          setQuantity(v.available_stock);
                        }
                      }}
                      className={`relative px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20"
                          : isOutOfStock
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60 line-through"
                          : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <span>{v.variant_name}</span>
                      {Number(v.price_modifier) > 0 && (
                        <span className={isSelected ? "text-indigo-200 font-medium text-[11px]" : "text-indigo-600 font-bold text-[11px]"}>
                          (+₹{Number(v.price_modifier).toFixed(0)})
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isOutOfStock
                          ? "bg-slate-200 text-slate-500"
                          : v.available_stock <= (v.low_stock_threshold || 5)
                          ? isSelected ? "bg-amber-400 text-amber-950" : "bg-amber-100 text-amber-800"
                          : isSelected ? "bg-emerald-400 text-emerald-950" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {isOutOfStock ? "Sold Out" : v.available_stock <= (v.low_stock_threshold || 5) ? `${v.available_stock} left` : "In Stock"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {variantRequiredError && !selectedVariant && (
                <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Please select one of the available {variantTypeLabel.toLowerCase()} to continue.
                </p>
              )}
            </div>
          )}

          {/* Stock Availability Info */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs">
              {hasVariants && !selectedVariant ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Select an option above to check real-time variant stock
                </div>
              ) : inStock ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  In Stock ({availableStock} units available{selectedVariant ? ` for ${selectedVariant.variant_name}` : ""})
                  {isLowStock && (
                    <span className="ml-1 text-amber-700 font-bold">• Low Stock Warning</span>
                  )}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {selectedVariant ? `"${selectedVariant.variant_name}" is currently Out of Stock` : "Currently Out of Stock"}
                </div>
              )}
            </div>

            {/* Quantity Selector & Add Button */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || !inStock || (hasVariants && !selectedVariant)}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    disabled={!inStock || (hasVariants && !selectedVariant) || quantity >= availableStock}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={(hasVariants && selectedVariant && !inStock) || (!hasVariants && !inStock) || isAddingToCart}
                  className={`flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:pointer-events-none ${
                    hasVariants && !selectedVariant
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30"
                      : !inStock
                      ? "bg-slate-300 text-slate-500 shadow-none cursor-not-allowed opacity-60"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30"
                  }`}
                >
                  {isAddingToCart ? (
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
                      Adding to Cart...
                    </>
                  ) : hasVariants && !selectedVariant ? (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Select Option to Add
                    </>
                  ) : !inStock ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Out of Stock
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`px-4 py-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    isInWishlist(product.id)
                      ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-rose-600"
                  }`}
                  title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform active:scale-125 ${
                      isInWishlist(product.id) ? "fill-rose-600 text-rose-600" : ""
                    }`}
                  />
                  <span>{isInWishlist(product.id) ? "Saved" : "Wishlist"}</span>
                </button>
              </div>

              {/* Wishlist Notification Banner */}
              {wishlistToast && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl animate-fade-in">
                  <Heart className="w-4 h-4 flex-shrink-0 fill-rose-600 text-rose-600" />
                  <span className="font-medium">{wishlistToast}</span>
                </div>
              )}

              {/* Success Notification Banner with View Cart Action */}
              {cartSuccessMessage && (
                <div className="flex items-center justify-between gap-3 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                    <span className="font-medium">{cartSuccessMessage}</span>
                  </div>
                  <Link
                    to="/cart"
                    className="font-bold underline underline-offset-2 hover:text-emerald-900 whitespace-nowrap text-xs"
                  >
                    View Cart →
                  </Link>
                </div>
              )}

              {/* Error Notification Banner */}
              {cartErrorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl animate-fade-in">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{cartErrorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Value Assurance Pillars */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Fast Express Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>7-Day Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Description & Specifications Section */}
      <section className="pt-10 border-t border-slate-200 space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Product Overview & Full Description</h2>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <p className="text-slate-600 text-sm leading-relaxed">
            {product.description || "No full description provided for this item."}
          </p>
        </div>
      </section>

      {/* Customer Reviews & Ratings Section */}
      <ProductReviewsSection productId={product.id} />
    </div>
  );
}
