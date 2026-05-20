// src/pages/ProductDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi, reviewsApi } from '../lib/supabase';
import type { Product, Review } from '../types';
import { getSalePrice, formatPrice } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductDetailPage.css';

/* ================= STAR RATING ================= */
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
        >
          ★
        </span>
      ))}
    </div>
  );
}

/* ================= WISHLIST (LOCAL STORAGE) ================= */
function toggleWishlist(productId: string) {
  const existing = JSON.parse(localStorage.getItem('wishlist') || '[]');
  let updated;

  if (existing.includes(productId)) {
    updated = existing.filter((id: string) => id !== productId);
  } else {
    updated = [...existing, productId];
  }

  localStorage.setItem('wishlist', JSON.stringify(updated));
  return updated;
}

function isWishlisted(productId: string) {
  const existing = JSON.parse(localStorage.getItem('wishlist') || '[]');
  return existing.includes(productId);
}

/* ================= COMPONENT ================= */
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
  const [wishlisted, setWishlisted] = useState(false);

  /* Review state */
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!id) return;

    Promise.all([
      productsApi.getById(id),
      reviewsApi.getByProduct(id),
    ]).then(([p, r]) => {
      if (!p) return navigate('/products');

      setProduct(p);
      setReviews(r);
      setLoading(false);

      /* wishlist check */
      setWishlisted(isWishlisted(p.id));

      /* recently viewed */
      const recent = JSON.parse(localStorage.getItem('recent') || '[]');
      const updated = [p.id, ...recent.filter((x: string) => x !== p.id)].slice(0, 5);
      localStorage.setItem('recent', JSON.stringify(updated));
    });
  }, [id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  /* ================= CART ================= */
  async function handleAddToCart() {
    if (!user) return navigate('/login');

    if (product!.sizes.length > 0 && !selectedSize) {
      return showToast('Please select a size');
    }

    setAdding(true);
    try {
      await addItem(product!.id, selectedSize, qty);
      showToast('Added to cart!');
    } finally {
      setAdding(false);
    }
  }

  /* ================= BUY NOW ================= */
  async function handleBuyNow() {
    await handleAddToCart();
    navigate('/checkout');
  }

  /* ================= WISHLIST ================= */
  function handleWishlist() {
    const updated = toggleWishlist(product!.id);
    setWishlisted(updated.includes(product!.id));
    showToast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️');
  }

  /* ================= REVIEW ================= */
  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!reviewName.trim()) {
      setReviewError('Please enter your name');
      return;
    }

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

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!product) return null;

  const salePrice = getSalePrice(product);
  const hasDiscount = product.sale_active && product.sale_percentage;
  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean) as string[];

  return (
    <div className="page product-detail-page">
      <div className="container">

        {/* HEADER ACTIONS */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={handleWishlist} className="btn btn-ghost">
            {wishlisted ? '❤️ Wishlisted' : '♡ Add to Wishlist'}
          </button>
        </div>

        <div className="product-detail__grid">

          {/* IMAGES */}
          <div className="product-detail__images">
            <img src={allImages[selectedImage]} alt={product.name} />

            {allImages.length > 1 && (
              <div className="product-detail__thumbnails">
                {allImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    onClick={() => setSelectedImage(i)}
                    style={{ cursor: 'pointer', width: 50, margin: 5 }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="product-detail__info">

            <h1>{product.name}</h1>

            <p>
              {hasDiscount ? (
                <>
                  <span>{formatPrice(salePrice)}</span>
                  <del style={{ marginLeft: 10 }}>{formatPrice(product.price)}</del>
                </>
              ) : (
                formatPrice(product.price)
              )}
            </p>

            {/* SIZE */}
            {product.sizes?.length > 0 && (
              <div>
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSelectedSize(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* ACTIONS */}
            <div style={{ marginTop: 20 }}>
              <button onClick={handleAddToCart} disabled={adding}>
                Add to Cart
              </button>

              <button onClick={handleBuyNow}>
                Buy Now ⚡
              </button>
            </div>

          </div>
        </div>

        {/* REVIEWS */}
        <div>
          <h2>Reviews</h2>
          {reviews.map((r) => (
            <div key={r.id}>
              <strong>{r.reviewer_name}</strong>
              <p>{r.comment}</p>
            </div>
          ))}
        </div>

      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}