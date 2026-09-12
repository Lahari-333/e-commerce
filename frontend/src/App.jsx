import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

// Storefront Components
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import ProductListingPage from "./pages/ProductListingPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import WishlistPage from "./pages/WishlistPage";

// Admin Portal Components
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./admin/layouts/AdminLayout";
import AdminDashboardPage from "./admin/pages/AdminDashboardPage";
import AdminProductsPage from "./admin/pages/AdminProductsPage";
import AdminProductFormPage from "./admin/pages/AdminProductFormPage";
import AdminInventoryPage from "./admin/pages/AdminInventoryPage";
import AdminOrdersPage from "./admin/pages/AdminOrdersPage";
import AdminOrderDetailsPage from "./admin/pages/AdminOrderDetailsPage";
import AdminUsersPage from "./admin/pages/AdminUsersPage";
import AdminReviewsPage from "./admin/pages/AdminReviewsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
              {/* Customer Storefront Routes */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductListingPage />} />
                <Route path="/products/:slug" element={<ProductDetailsPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailsPage />} />
                {/* Aliases */}
                <Route path="/shop" element={<Navigate to="/products" replace />} />
              </Route>

              {/* Admin Management Routes (Protected by RBAC) */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="products/new" element={<AdminProductFormPage />} />
                  <Route path="products/:id/edit" element={<AdminProductFormPage />} />
                  <Route path="inventory" element={<AdminInventoryPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="reviews" element={<AdminReviewsPage />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
