// src/pages/CartPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../lib/supabase';
import type { CartItem } from '../types';
import { getSalePrice, formatPrice } from '../types';
import './CartPage.css';

function CartItemRow({ item, onRemove, onQtyChange }: {
  item: CartItem;
  onRemove: () => void;
  onQtyChange: (qty: number) => void;
}) {
  const product = item.product!;
  const unitPrice = getSalePrice(product);
  const hasDiscount = product.sale_active && product.sale_percentage;

  return (
    <div className="cart-item">
      <div className="cart-item__image">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} />
          : <div className="cart-item__image-placeholder">✦</div>
        }
      </div>
      <div className="cart-item__info">
        <h3 className="cart-item__name">{product.name}</h3>
        {item.size && <p className="cart-item__meta">Size: {item.size}</p>}
        <div className="cart-item__price-row">
          {hasDiscount ? (
            <>
              <span className="price-sale">{formatPrice(unitPrice)}</span>
              <span className="price-original">{formatPrice(product.price)}</span>
              <span className="badge badge-sale">-{product.sale_percentage}%</span>
            </>
          ) : (
            <span>{formatPrice(unitPrice)}</span>
          )}
        </div>
      </div>

      <div className="cart-item__controls">
        <div className="quantity-control">
          <button onClick={() => onQtyChange(item.quantity - 1)}>−</button>
          <span>{item.quantity}</span>
          <button onClick={() => onQtyChange(item.quantity + 1)}>+</button>
        </div>
        <p className="cart-item__subtotal">{formatPrice(unitPrice * item.quantity)}</p>
        <button className="cart-item__remove" onClick={onRemove} title="Remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6l-1,14a2,2 0,0 1-2,2H8a2,2 0,0 1-2-2L5,6"/>
            <path d="M10,11v6M14,11v6"/>
            <path d="M9,6V4a1,1 0,0 1,1-1h4a1,1 0,0 1,1,1v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, loading, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const subtotal = items.reduce((sum, item) => {
    const p = item.product!;
    return sum + getSalePrice(p) * item.quantity;
  }, 0);

  const savings = items.reduce((sum, item) => {
    const p = item.product!;
    if (p.sale_active && p.sale_percentage) {
      return sum + (p.price - getSalePrice(p)) * item.quantity;
    }
    return sum;
  }, 0);

  const shipping = subtotal > 0 ? 5.99 : 0;
  const total = subtotal + shipping;

  async function handleCheckout() {
    if (!user) { navigate('/login'); return; }
    setCheckingOut(true);
    try {
      await ordersApi.createFromCart(user.id, items, {
        full_name: '', street: '', city: '', state: '', zip: '', country: '',
      });
      showToast('Order placed successfully! 🎉');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      showToast('Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  }

  if (!user) {
    return (
      <div className="page cart-page">
        <div className="container cart-empty">
          <div className="cart-empty__icon">🛍️</div>
          <h2>Sign in to view your cart</h2>
          <p>You need to be logged in to add items and checkout.</p>
          <Link to="/login" className="btn btn-primary">Login</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div className="page cart-page">
      <div className="container">
        <div className="cart-page__header">
          <h1 className="cart-page__title">Your Cart</h1>
          {items.length > 0 && (
            <button className="btn btn-ghost" onClick={() => clearCart()}>
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty__icon">✦</div>
            <h2>Your cart is empty</h2>
            <p>Discover our handcrafted bracelets and add your favourites.</p>
            <Link to="/products" className="btn btn-primary">Shop Collection</Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Items */}
            <div className="cart-items-list">
              <div className="cart-items-header">
                <span>Product</span>
                <span>Quantity / Total</span>
              </div>
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onQtyChange={(qty) => updateQuantity(item.id, qty)}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="cart-summary">
              <h2 className="cart-summary__title">Order Summary</h2>

              <div className="cart-summary__rows">
                <div className="cart-summary__row">
                  <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {savings > 0 && (
                  <div className="cart-summary__row cart-summary__row--savings">
                    <span>You Save</span>
                    <span>-{formatPrice(savings)}</span>
                  </div>
                )}
                <div className="cart-summary__row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
              </div>

              <div className="divider"/>

              <div className="cart-summary__total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              <button
                className="btn btn-primary cart-summary__checkout"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>

              <Link to="/products" className="cart-summary__continue">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
