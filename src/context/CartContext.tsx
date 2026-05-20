// src/context/CartContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cartApi } from '../lib/supabase';
import type { CartItem } from '../types';
import { useAuth } from './AuthContext';

type PaymentMethod = 'cod' | 'jazzcash' | 'easypaisa';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  loading: boolean;

  wishlist: string[];
  recentlyViewed: string[];

  coupon: string | null;
  discount: number;

  paymentMethod: PaymentMethod;

  addItem: (productId: string, size: string | null, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;

  toggleWishlist: (productId: string) => void;
  addRecentlyViewed: (productId: string) => void;

  applyCoupon: (code: string) => boolean;
  setPaymentMethod: (method: PaymentMethod) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const VALID_COUPONS: Record<string, number> = {
  SLAY10: 10,
  WELCOME15: 15,
  FINAL20: 20,
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  const [coupon, setCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  useEffect(() => {
    if (user) refreshCart();
    else setItems([]);

    loadLocalData();
  }, [user]);

  function loadLocalData() {
    const savedWishlist = localStorage.getItem('wishlist');
    const savedViewed = localStorage.getItem('recentlyViewed');

    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    if (savedViewed) setRecentlyViewed(JSON.parse(savedViewed));
  }

  async function refreshCart() {
    if (!user) return;

    setLoading(true);
    try {
      const data = await cartApi.getCart(user.id);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  async function addItem(productId: string, size: string | null, quantity = 1) {
    if (!user) return;
    await cartApi.addItem(user.id, productId, size, quantity);
    await refreshCart();
  }

  async function removeItem(itemId: string) {
    await cartApi.removeItem(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return removeItem(itemId);

    const updated = await cartApi.updateQuantity(itemId, quantity);
    setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
  }

  async function clearCart() {
    if (!user) return;
    await cartApi.clearCart(user.id);
    setItems([]);
  }

  function toggleWishlist(productId: string) {
    const updated = wishlist.includes(productId)
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId];

    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  }

  function addRecentlyViewed(productId: string) {
    const updated = [
      productId,
      ...recentlyViewed.filter((id) => id !== productId),
    ].slice(0, 6);

    setRecentlyViewed(updated);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
  }

  function applyCoupon(code: string) {
    const upper = code.toUpperCase();

    if (VALID_COUPONS[upper]) {
      setCoupon(upper);
      setDiscount(VALID_COUPONS[upper]);
      return true;
    }

    return false;
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        loading,

        wishlist,
        recentlyViewed,

        coupon,
        discount,

        paymentMethod,

        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,

        toggleWishlist,
        addRecentlyViewed,

        applyCoupon,
        setPaymentMethod,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}