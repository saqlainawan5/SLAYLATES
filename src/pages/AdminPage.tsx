// src/pages/AdminPage.tsx
import React, { useEffect, useState } from 'react';
import { productsApi } from '../lib/supabase';
import type { Product } from '../types';
import { getSalePrice, formatPrice } from '../types';
import './AdminPage.css';

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  sale_percentage: '',
  sale_active: false,
  image_url: '',
  images: '',
  sizes: '',
  category: '',
  stock: '0',
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setLoading(true);
    const data = await productsApi.getAll();
    setProducts(data);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      sale_percentage: product.sale_percentage?.toString() || '',
      sale_active: product.sale_active,
      image_url: product.image_url || '',
      images: (product.images || []).join(', '),
      sizes: (product.sizes || []).join(', '),
      category: product.category || '',
      stock: product.stock.toString(),
    });
    setEditingId(product.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function parseList(str: string): string[] {
    return str.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      sale_percentage: form.sale_percentage ? parseFloat(form.sale_percentage) : null,
      sale_active: form.sale_active,
      image_url: form.image_url.trim() || null,
      images: parseList(form.images),
      sizes: parseList(form.sizes),
      category: form.category.trim() || null,
      stock: parseInt(form.stock) || 0,
    };

    try {
      if (editingId) {
        const updated = await productsApi.update(editingId, payload);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        showToast('Product updated!');
      } else {
        const created = await productsApi.create(payload);
        setProducts((prev) => [created, ...prev]);
        showToast('Product created!');
      }
      closeForm();
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await productsApi.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
      showToast('Product deleted.');
    } catch (err: any) {
      showToast('Error: ' + err.message);
    }
  }

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="admin-page__header">
          <div>
            <p className="admin-page__eyebrow">Admin Panel</p>
            <h1 className="admin-page__title">Manage Products</h1>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            + Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          {[
            { label: 'Total Products', value: products.length },
            { label: 'On Sale', value: products.filter((p) => p.sale_active).length },
            { label: 'In Stock', value: products.filter((p) => p.stock > 0).length },
          ].map((s) => (
            <div key={s.label} className="admin-stat-card">
              <span className="admin-stat-card__value">{s.value}</span>
              <span className="admin-stat-card__label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="loading-screen"><div className="spinner"/></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products yet. Add your first bracelet!</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Sale</th>
                  <th>Stock</th>
                  <th>Sizes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const salePrice = getSalePrice(product);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-table__product">
                          <div className="admin-table__thumb">
                            {product.image_url
                              ? <img src={product.image_url} alt={product.name} />
                              : <span>✦</span>
                            }
                          </div>
                          <div>
                            <p className="admin-table__name">{product.name}</p>
                            <p className="admin-table__cat">{product.category || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-table__price">
                          {product.sale_active && product.sale_percentage ? (
                            <>
                              <span className="price-sale">{formatPrice(salePrice)}</span>
                              <span className="price-original">{formatPrice(product.price)}</span>
                            </>
                          ) : (
                            <span>{formatPrice(product.price)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {product.sale_active
                          ? <span className="badge badge-sale">{product.sale_percentage}% OFF</span>
                          : <span className="admin-table__no-sale">—</span>
                        }
                      </td>
                      <td>
                        <span className={`admin-table__stock ${product.stock === 0 ? 'admin-table__stock--out' : ''}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td>
                        <span className="admin-table__sizes">
                          {product.sizes?.length > 0 ? product.sizes.join(', ') : '—'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table__actions">
                          <button className="btn btn-outline admin-btn-sm" onClick={() => openEdit(product)}>
                            Edit
                          </button>
                          {deleteConfirm === product.id ? (
                            <div className="delete-confirm">
                              <span>Sure?</span>
                              <button className="btn btn-danger admin-btn-sm" onClick={() => handleDelete(product.id)}>Yes</button>
                              <button className="btn btn-ghost admin-btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                            </div>
                          ) : (
                            <button className="btn btn-danger admin-btn-sm" onClick={() => setDeleteConfirm(product.id)}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}>
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="admin-modal__close" onClick={closeForm}>✕</button>
            </div>

            <form className="admin-form" onSubmit={handleSave}>
              <div className="admin-form__grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Golden Sun Bracelet"
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe this bracelet..."
                  />
                </div>

                <div className="form-group">
                  <label>Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Beaded, Charm, Gold"
                  />
                </div>

                <div className="form-group">
                  <label>Sizes (comma-separated, in inches)</label>
                  <input
                    type="text"
                    value={form.sizes}
                    onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                    placeholder="6 inches, 6.5 inches, 7 inches"
                  />
                </div>

                {/* SALE SECTION */}
                <div className="admin-form__sale-section" style={{ gridColumn: '1 / -1' }}>
                  <div className="admin-form__sale-toggle">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={form.sale_active}
                        onChange={(e) => setForm({ ...form, sale_active: e.target.checked })}
                      />
                      <span className="toggle-switch"/>
                      <span>Enable Sale</span>
                    </label>
                  </div>

                  {form.sale_active && (
                    <div className="admin-form__sale-input">
                      <div className="form-group">
                        <label>Sale Discount (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          step="0.1"
                          value={form.sale_percentage}
                          onChange={(e) => setForm({ ...form, sale_percentage: e.target.value })}
                          placeholder="e.g. 20"
                        />
                      </div>
                      {form.price && form.sale_percentage && (
                        <div className="admin-form__sale-preview">
                          <span>Sale Price Preview:</span>
                          <strong className="price-sale">
                            ${(parseFloat(form.price) * (1 - parseFloat(form.sale_percentage) / 100)).toFixed(2)}
                          </strong>
                          <span className="price-original">${parseFloat(form.price).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Main Image URL</label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Additional Images (comma-separated URLs)</label>
                  <input
                    type="text"
                    value={form.images}
                    onChange={(e) => setForm({ ...form, images: e.target.value })}
                    placeholder="https://img1.com, https://img2.com"
                  />
                </div>
              </div>

              <div className="admin-form__footer">
                <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
