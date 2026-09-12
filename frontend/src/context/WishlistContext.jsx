import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
  clearWishlistApi
} from "../services/wishlistApi";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadWishlist = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchWishlistApi(token);
      if (response.success && response.data) {
        setItems(response.data.items || []);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to load wishlist:", err.message);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      loadWishlist();
    }
  }, [authLoading, loadWishlist]);

  const isInWishlist = useCallback(
    (productId) => {
      const targetId = Number(productId);
      return items.some((item) => Number(item.product_id) === targetId);
    },
    [items]
  );

  const addToWishlist = useCallback(
    async (product) => {
      if (!isAuthenticated || !token) {
        const authErr = new Error("Please sign in to save items to your wishlist");
        authErr.requiresAuth = true;
        throw authErr;
      }

      const productId = typeof product === "object" ? product.id : product;
      const res = await addToWishlistApi(token, productId);

      // Optimistically or immediately reload wishlist
      await loadWishlist();
      return res;
    },
    [isAuthenticated, token, loadWishlist]
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!isAuthenticated || !token) return;

      const targetId = Number(productId);
      // Optimistically update UI
      setItems((prev) => prev.filter((it) => Number(it.product_id) !== targetId && Number(it.item_id) !== targetId));

      try {
        const res = await removeFromWishlistApi(token, targetId);
        return res;
      } catch (err) {
        console.error("Error removing from wishlist:", err.message);
        // Revert by re-fetching
        await loadWishlist();
        throw err;
      }
    },
    [isAuthenticated, token, loadWishlist]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      if (!isAuthenticated || !token) {
        const authErr = new Error("Please sign in to manage your wishlist");
        authErr.requiresAuth = true;
        throw authErr;
      }

      const productId = typeof product === "object" ? product.id : product;
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
        return { action: "removed", inWishlist: false };
      } else {
        await addToWishlist(product);
        return { action: "added", inWishlist: true };
      }
    },
    [isAuthenticated, token, isInWishlist, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback(async () => {
    if (!isAuthenticated || !token) return;

    setItems([]);
    try {
      const res = await clearWishlistApi(token);
      return res;
    } catch (err) {
      console.error("Error clearing wishlist:", err.message);
      await loadWishlist();
      throw err;
    }
  }, [isAuthenticated, token, loadWishlist]);

  const value = {
    wishlistItems: items,
    totalWishlistCount: items.length,
    loading,
    error,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    refreshWishlist: loadWishlist
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
