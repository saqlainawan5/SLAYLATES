// src/pages/CartPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../lib/supabase';
import type { CartItem } from '../types';
import { getSalePrice, formatPrice } from '../types';
import './CartPage.css';

function CartItemRow({
  item,
  onRemove,
  onQtyChange
}: {
  item: CartItem;
  onRemove: () => void;
  onQtyChange: (qty: number) => void;
}) {
  const product = item.product!;
  const unitPrice = getSalePrice(product);

  return (
    <div className="cart-item">
      <div className="cart-item__image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <div className="cart-item__image-placeholder">✦</div>
        )}
      </div>

      <div className="cart-item__info">
        <h3>{product.name}</h3>
        {item.size && <p>Size: {item.size}</p>}
        <p>{formatPrice(unitPrice)}</p>
      </div>

      <div className="cart-item__controls">
        <button onClick={() => onQtyChange(item.quantity - 1)}>-</button>
        <span>{item.quantity}</span>
        <button onClick={() => onQtyChange(item.quantity + 1)}>+</button>

        <button onClick={onRemove}>Remove</button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const {
    items,
    loading,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    discount,
    paymentMethod,
    setPaymentMethod
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [checkingOut, setCheckingOut] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [toast, setToast] = useState('');
  const [transactionId, setTransactionId] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const subtotal = items.reduce((sum, item) => {
    return sum + getSalePrice(item.product!) * item.quantity;
  }, 0);

  const shipping = subtotal > 0 ? 5.99 : 0;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + shipping - discountAmount;

  function handleCoupon() {
    const success = applyCoupon(couponCode);

    if (success) showToast('Coupon applied successfully 🎉');
    else showToast('Invalid coupon code');
  }

  async function handleCheckout() {
    if (!user) {
      navigate('/login');
      return;
    }

    if (
      (paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') &&
      !transactionId
    ) {
      showToast('Please enter transaction ID');
      return;
    }

    setCheckingOut(true);

    try {
      await ordersApi.createFromCart(user.id, items, {
        full_name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
      });

      await clearCart();

      showToast('Order placed successfully 🎉');
      setTimeout(() => navigate('/'), 2000);
    } catch {
      showToast('Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  }

  if (!user) {
    return (
      <div className="page cart-page">
        <div className="container">
          <h2>Please login to view cart</h2>
          <Link to="/login">Login</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page cart-page">
      <div className="container">
        <h1>Your Cart</h1>

        {items.length === 0 ? (
          <div>
            <h2>Cart is empty</h2>
            <Link to="/products">Shop Now</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div>
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onQtyChange={(qty) => updateQuantity(item.id, qty)}
                />
              ))}
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>

              <p>Subtotal: {formatPrice(subtotal)}</p>
              <p>Shipping: {formatPrice(shipping)}</p>

              {discount > 0 && (
                <p>Discount ({discount}%): -{formatPrice(discountAmount)}</p>
              )}

              <hr />

              <h3>Total: {formatPrice(total)}</h3>

              {/* Coupon */}
              <div>
                <input
                  type="text"
                  placeholder="Enter Coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button onClick={handleCoupon}>Apply</button>
              </div>

              {/* Payment Methods */}
              <div>
                <h4>Select Payment Method</h4>

                <label>
                  <input
                    type="radio"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  Cash on Delivery
                </label>

                <label>
                  <input
                    type="radio"
                    checked={paymentMethod === 'jazzcash'}
                    onChange={() => setPaymentMethod('jazzcash')}
                  />
                  JazzCash
                </label>

                <label>
                  <input
                    type="radio"
                    checked={paymentMethod === 'easypaisa'}
                    onChange={() => setPaymentMethod('easypaisa')}
                  />
                  Easypaisa
                </label>
              </div>

              {(paymentMethod === 'jazzcash' ||
                paymentMethod === 'easypaisa') && (
                <div>
                  <input
                    type="text"
                    placeholder="Enter Transaction ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
              )}

              <button onClick={handleCheckout} disabled={checkingOut}>
                {checkingOut ? 'Processing...' : 'Place Order'}
              </button>

              <button onClick={clearCart}>Clear Cart</button>
            </div>
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}