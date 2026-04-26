// src/pages/ProductDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi, reviewsApi } from '../lib/supabase';
import type { Product, Review } from '../types';
import { getSalePrice, formatPrice } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductDetailPage.css';

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`star ${s <= (hover || value) ? '' : 'star-empty'}`}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange && onChange(s)}
          style={{ cursor: onChange ? 'pointer' : 'default', fontSize: '1.2rem' }}
        >★</span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="review-card">
      <div className="review-card__top">
        <div className="review-card__avatar">{review.reviewer_name[0].toUpperCase()}</div>
        <div>
          <p className="review-card__name">{review.reviewer_name}</p>
          <StarRating value={review.rating} />
        </div>
        <span className="review-card__date">
          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      {review.comment && <p className="review-card__comment">{review.comment}</p>}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');

  // Review form
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([productsApi.getById(id), reviewsApi.getByProduct(id)]).then(([p, r]) => {
      if (!p) { navigate('/products'); return; }
      setProduct(p);
      setReviews(r);
      setLoading(false);
    });
  }, [id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleAddToCart() {
    if (!user) { navigate('/login'); return; }
    if (product!.sizes.length > 0 && !selectedSize) {
      showToast('Please select a size');
      return;
    }
    setAdding(true);
    try {
      await addItem(product!.id, selectedSize, qty);
      showToast('Added to cart!');
    } finally {
      setAdding(false);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewName.trim()) { setReviewError('Please enter your name'); return; }
    setSubmittingReview(true);
    setReviewError('');
    try {
      const r = await reviewsApi.add({
        product_id: product!.id,
        reviewer_name: reviewName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviews((prev) => [r, ...prev]);
      setReviewName('');
      setReviewRating(5);
      setReviewComment('');
      showToast('Review submitted!');
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;
  if (!product) return null;

  const salePrice = getSalePrice(product);
  const hasDiscount = product.sale_active && product.sale_percentage;
  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean) as string[];
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="page product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <a href="/products">Collection</a> <span>/</span> <span>{product.name}</span>
        </nav>

        <div className="product-detail__grid">
          {/* Images */}
          <div className="product-detail__images">
            <div className="product-detail__main-image">
              {allImages.length > 0
                ? <img src={allImages[selectedImage]} alt={product.name} />
                : <div className="product-detail__image-placeholder">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                  </div>
              }
              {hasDiscount && (
                <span className="badge badge-sale product-detail__sale-badge">
                  -{product.sale_percentage}% OFF
                </span>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="product-detail__thumbnails">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    className={`product-detail__thumb ${i === selectedImage ? 'active' : ''}`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-detail__info">
            <p className="product-detail__category">{product.category || 'Bracelet'}</p>
            <h1 className="product-detail__name">{product.name}</h1>

            {/* Rating summary */}
            {avgRating && (
              <div className="product-detail__rating">
                <StarRating value={Math.round(parseFloat(avgRating))} />
                <span>{avgRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}

            {/* Price */}
            <div className="product-detail__price">
              {hasDiscount ? (
                <>
                  <span className="price-sale product-detail__price-sale">{formatPrice(salePrice)}</span>
                  <span className="price-original product-detail__price-original">{formatPrice(product.price)}</span>
                  <span className="badge badge-sale">Save {product.sale_percentage}%</span>
                </>
              ) : (
                <span className="product-detail__price-main">{formatPrice(product.price)}</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="product-detail__description">
                <h4>Description</h4>
                <p>{product.description}</p>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="product-detail__sizes">
                <h4>Size <em>(in inches)</em></h4>
                <div className="size-options">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="product-detail__actions">
              <div className="quantity-control">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <button
                className="btn btn-primary product-detail__add-btn"
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>

            <p className="product-detail__stock">
              {product.stock > 0
                ? `✦ ${product.stock} left in stock`
                : '✦ Made to order'}
            </p>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div className="reviews-section">
          <div className="divider"/>
          <h2 className="reviews-section__title">Customer Reviews</h2>

          {/* Review stats */}
          {reviews.length > 0 && (
            <div className="reviews-stats">
              <div className="reviews-stats__score">
                <span className="reviews-stats__avg">{avgRating}</span>
                <StarRating value={Math.round(parseFloat(avgRating!))} />
                <span className="reviews-stats__count">{reviews.length} reviews</span>
              </div>
            </div>
          )}

          {/* Review list */}
          <div className="reviews-list">
            {reviews.length === 0
              ? <p className="empty-state" style={{ padding: '2rem 0' }}>Be the first to review this piece!</p>
              : reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            }
          </div>

          {/* Add review form */}
          <div className="add-review">
            <h3>Leave a Review</h3>
            <form onSubmit={handleReviewSubmit} className="add-review__form">
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label>Rating *</label>
                <StarRating value={reviewRating} onChange={setReviewRating} />
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this bracelet..."
                />
              </div>
              {reviewError && <p className="error-msg">{reviewError}</p>}
              <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
