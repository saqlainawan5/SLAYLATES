// src/components/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { getSalePrice, formatPrice } from '../types';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const salePrice = getSalePrice(product);
  const hasDiscount = product.sale_active && product.sale_percentage;

  const {
    wishlist,
    toggleWishlist,
    addRecentlyViewed
  } = useCart();

  const isWishlisted = wishlist.includes(product.id);

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    toggleWishlist(product.id);
  }

  function handleView() {
    addRecentlyViewed(product.id);
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="product-card"
      onClick={handleView}
    >
      <div className="product-card__image-wrap">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="product-card__image"
          />
        ) : (
          <div className="product-card__image-placeholder">✦</div>
        )}

        {/* Wishlist Button */}
        <button
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlist}
        >
          {isWishlisted ? '♥' : '♡'}
        </button>

        {hasDiscount && (
          <span className="product-card__badge">
            -{product.sale_percentage}% OFF
          </span>
        )}
      </div>

      <div className="product-card__info">
        <p className="product-card__category">
          {product.category || 'Bracelet'}
        </p>

        <h3 className="product-card__name">{product.name}</h3>

        <div className="product-card__price">
          {hasDiscount ? (
            <>
              <span className="price-sale">
                {formatPrice(salePrice)}
              </span>

              <span className="price-original">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span>{formatPrice(product.price)}</span>
          )}
        </div>

        {isWishlisted && (
          <p className="saved-label">Saved to Wishlist</p>
        )}
      </div>
    </Link>
  );
}