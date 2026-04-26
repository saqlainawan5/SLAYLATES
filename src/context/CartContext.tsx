// src/context/CartContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cartApi } from '../lib/supabase';
import type { CartItem } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  loading: boolean;
  addItem: (productId: string, size: string | null, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) refreshCart();
    else setItems([]);
  }, [user]);

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
    const item = await cartApi.addItem(user.id, productId, size, quantity);
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

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, loading, addItem, removeItem, updateQuantity, clearCart, refreshCart }}
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
