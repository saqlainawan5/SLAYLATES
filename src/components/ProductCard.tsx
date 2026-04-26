// src/components/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { getSalePrice, formatPrice } from '../types';
import './ProductCard.css';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const salePrice = getSalePrice(product);
  const hasDiscount = product.sale_active && product.sale_percentage;

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card__image-wrap">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="product-card__image" />
          : <div className="product-card__image-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
        }
        {hasDiscount && (
          <span className="product-card__badge badge badge-sale">
            -{product.sale_percentage}% OFF
          </span>
        )}
      </div>

      <div className="product-card__info">
        <p className="product-card__category">{product.category || 'Bracelet'}</p>
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__price">
          {hasDiscount ? (
            <>
              <span className="price-sale">{formatPrice(salePrice)}</span>
              <span className="price-original">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span>{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
