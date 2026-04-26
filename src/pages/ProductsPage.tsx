// src/pages/ProductsPage.tsx
import React, { useEffect, useState } from 'react';
import { productsApi } from '../lib/supabase';
import type { Product } from '../types';
import ProductCard from '../components/ProductCard';
import './ProductsPage.css';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'sale'>('all');
  const [sort, setSort] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');

  useEffect(() => {
    productsApi.getAll().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...products];
    if (filter === 'sale') result = result.filter((p) => p.sale_active);
    if (search) result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    setFiltered(result);
  }, [products, search, filter, sort]);

  return (
    <div className="page products-page">
      <div className="container">
        {/* Header */}
        <div className="products-page__header">
          <div>
            <p className="products-page__eyebrow">Handcrafted Treasures</p>
            <h1 className="products-page__title">Our Collection</h1>
          </div>
          <p className="products-page__count">{filtered.length} pieces</p>
        </div>

        {/* Toolbar */}
        <div className="products-page__toolbar">
          <div className="products-page__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search bracelets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="products-page__filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >All</button>
            <button
              className={`filter-btn ${filter === 'sale' ? 'active' : ''}`}
              onClick={() => setFilter('sale')}
            >On Sale</button>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="loading-screen"><div className="spinner"/></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No bracelets found. Try a different search!</p>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
