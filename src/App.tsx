// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';

import { useAuth } from './context/AuthContext';

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading)
    return (
      <div className="loading-screen">
        <span>Loading...</span>
      </div>
    );

  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Core Pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedAdmin>
              <AdminPage />
            </ProtectedAdmin>
          }
        />

        {/* NEW FEATURE ROUTES (frontend hooks for your upgrades) */}
        <Route
          path="/wishlist"
          element={
            <div style={{ padding: '2rem' }}>
              <h1>Wishlist Page</h1>
              <p>We will connect wishlist UI next.</p>
            </div>
          }
        />

        <Route
          path="/orders"
          element={
            <div style={{ padding: '2rem' }}>
              <h1>Order Tracking</h1>
              <p>We will add order status system next.</p>
            </div>
          }
        />

        <Route
          path="/checkout"
          element={
            <div style={{ padding: '2rem' }}>
              <h1>Checkout</h1>
              <p>Payment system (COD / JazzCash / Easypaisa)</p>
            </div>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}