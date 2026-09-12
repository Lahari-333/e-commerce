import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchCartApi,
  addItemToCartApi,
  updateCartItemQuantityApi,
  removeCartItemApi,
  clearCartApi
} from "../services/cartApi";

const CartContext = createContext(null);

const EMPTY_CART = {
  cart_id: null,
  items: [],
  subtotal: 0,
  total_item_count: 0
};

export function CartProvider({ children }) {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync cart whenever authentication status changes
  const loadCart = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setCart(EMPTY_CART);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchCartApi(token);
      if (response.success && response.data) {
        setCart(response.data);
      } else {
        setCart(EMPTY_CART);
      }
    } catch (err) {
      console.error("Failed to load user cart:", err.message);
      setError(err.message);
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      loadCart();
    }
  }, [authLoading, loadCart]);

  /**
   * Add item to cart
   * @param {number|string} productId
   * @param {number|string|null} variantId
   * @param {number} quantity
   */
  const addToCart = useCallback(async (productId, variantId = null, quantity = 1) => {
    if (!isAuthenticated || !token) {
      const authErr = new Error("Please sign in to add items to your cart");
      authErr.requiresAuth = true;
      throw authErr;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await addItemToCartApi(token, {
        product_id: productId,
        variant_id: variantId,
        quantity
      });
      if (response.success && response.data) {
        setCart(response.data);
        return response.data;
      }
      throw new Error(response.message || "Failed to add item to cart");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  /**
   * Update quantity of a cart item
   * @param {number|string} itemId
   * @param {number} quantity
   */
  const updateCartItem = useCallback(async (itemId, quantity) => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await updateCartItemQuantityApi(token, itemId, quantity);
      if (response.success && response.data) {
        setCart(response.data);
        return response.data;
      }
      throw new Error(response.message || "Failed to update item quantity");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Remove single item from cart
   * @param {number|string} itemId
   */
  const removeCartItem = useCallback(async (itemId) => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await removeCartItemApi(token, itemId);
      if (response.success && response.data) {
        setCart(response.data);
        return response.data;
      }
      throw new Error(response.message || "Failed to remove item from cart");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Clear all items from cart
   */
  const clearCart = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await clearCartApi(token);
      if (response.success && response.data) {
        setCart(response.data);
        return response.data;
      }
      throw new Error(response.message || "Failed to clear cart");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const value = {
    cart,
    items: cart.items || [],
    subtotal: cart.subtotal || 0,
    totalItemCount: cart.total_item_count || 0,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refreshCart: loadCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
