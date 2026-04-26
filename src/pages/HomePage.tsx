// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../lib/supabase';
import type { Product } from '../types';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [sale, setSale] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [all, onSale] = await Promise.all([
        productsApi.getAll(),
        productsApi.getOnSale(),
      ]);
      setFeatured(all.slice(0, 4));
      setSale(onSale.slice(0, 4));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="homepage">
      {/* HERO */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
        </div>
        <div className="hero__content">
          <p className="hero__eyebrow">Handcrafted with Love</p>
          <h1 className="hero__title">
            Wear Your<br />
            <em>Story</em>
          </h1>
          <p className="hero__subtitle">
            Artisan bracelets woven with intention — each piece a reflection of your unique spirit.
          </p>
          <div className="hero__ctas">
            <Link to="/products" className="btn btn-primary">Explore Collection</Link>
            <a href="#featured" className="btn btn-outline">Our Bestsellers</a>
          </div>
        </div>
        <div className="hero__visual">
          <div className="hero__circle">
            <div className="hero__circle-inner">
              <svg viewBox="0 0 200 200" width="240" height="240">
                <circle cx="100" cy="100" r="80" fill="none" stroke="var(--gold-light)" strokeWidth="1"/>
                <circle cx="100" cy="100" r="60" fill="none" stroke="var(--gold)" strokeWidth="0.5" strokeDasharray="4 4"/>
                <text x="100" y="95" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="18" fill="var(--gold)" fontStyle="italic">Slaylates</text>
                <text x="100" y="115" textAnchor="middle" fontFamily="Jost, sans-serif" fontSize="7" fill="var(--warm-gray)" letterSpacing="3">HANDMADE</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee">
        <div className="marquee__track">
          {['Handcrafted', '✦', 'Made with love', '✦', 'Limited editions', '✦', 'Custom orders', '✦', 'One of a kind', '✦'].map((t, i) => (
            <span key={i}>{t}</span>
          ))}
          {['Handcrafted', '✦', 'Made with love', '✦', 'Limited editions', '✦', 'Custom orders', '✦', 'One of a kind', '✦'].map((t, i) => (
            <span key={`dup-${i}`}>{t}</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="features container">
        {[
          { icon: '✦', title: 'Handmade', desc: 'Every bracelet crafted by hand with care and intention' },
          { icon: '◇', title: 'Premium Materials', desc: 'Only the finest beads, threads, and stones' },
          { icon: '◎', title: 'Custom Sizing', desc: 'Available in multiple sizes for the perfect fit' },
        ].map((f) => (
          <div key={f.title} className="feature-card">
            <span className="feature-card__icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* FEATURED */}
      <section id="featured" className="section container">
        <div className="section__header">
          <h2 className="section__title">Featured Collection</h2>
          <Link to="/products" className="section__link">View All →</Link>
        </div>
        {loading ? (
          <div className="loading-screen"><div className="spinner"/></div>
        ) : featured.length === 0 ? (
          <p className="empty-state">No products yet. Check back soon!</p>
        ) : (
          <div className="products-grid">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ON SALE */}
      {sale.length > 0 && (
        <section className="section section--tinted">
          <div className="container">
            <div className="section__header">
              <h2 className="section__title">On Sale <span className="badge badge-sale">Hot Deals</span></h2>
              <Link to="/products" className="section__link">Shop Sale →</Link>
            </div>
            <div className="products-grid">
              {sale.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA BANNER */}
      <section className="cta-banner container">
        <div className="cta-banner__inner">
          <h2>Start Your Collection Today</h2>
          <p>Browse our full range of handmade bracelets, each with its own story.</p>
          <Link to="/products" className="btn btn-gold">Shop Now</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer__inner">
          <div>
            <span className="navbar__logo-script" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '1.5rem' }}>Slaylates</span>
            <p>Handcrafted bracelets made with love.</p>
          </div>
          <div className="footer__links">
            <Link to="/products">Collection</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/login">Account</Link>
          </div>
        </div>
        <div className="footer__copy">
          <p>© {new Date().getFullYear()} Slaylates. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
