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

  useEffect(() => {
    loadProducts();
  }, []);

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
      sale_percentage: form.sale_percentage
        ? parseFloat(form.sale_percentage)
        : null,
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

        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? updated : p))
        );

        showToast('Product updated!');
      } else {
        const created = await productsApi.create(payload);

        setProducts((prev) => [created, ...prev]);

        showToast('Product created!');
      }

      closeForm();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await productsApi.delete(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
    showToast('Deleted');
  }

  const totalRevenue = products.reduce(
    (sum, p) => sum + getSalePrice(p) * p.stock,
    0
  );

  const lowStock = products.filter((p) => p.stock < 5).length;

  return (
    <div className="page admin-page">
      <div className="container">
        <div className="admin-page__header">
          <h1>Admin Dashboard</h1>
          <button className="btn btn-primary" onClick={openCreate}>
            + Add Product
          </button>
        </div>

        {/* Analytics */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <h2>{products.length}</h2>
            <p>Total Products</p>
          </div>

          <div className="admin-stat-card">
            <h2>${totalRevenue.toFixed(2)}</h2>
            <p>Revenue Potential</p>
          </div>

          <div className="admin-stat-card">
            <h2>{lowStock}</h2>
            <p>Low Stock</p>
          </div>

          <div className="admin-stat-card">
            <h2>{products.filter((p) => p.sale_active).length}</h2>
            <p>On Sale</p>
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>

                    <td>{formatPrice(getSalePrice(product))}</td>

                    <td>
                      <span
                        className={`admin-table__stock ${
                          product.stock === 0
                            ? 'admin-table__stock--out'
                            : ''
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td>
                      <button onClick={() => openEdit(product)}>
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteConfirm === product.id
                            ? handleDelete(product.id)
                            : setDeleteConfirm(product.id)
                        }
                      >
                        {deleteConfirm === product.id
                          ? 'Confirm'
                          : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <h2>
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>

              <form onSubmit={handleSave}>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Product Name"
                />

                <input
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  placeholder="Price"
                />

                <input
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                  placeholder="Stock"
                />

                <input
                  value={form.image_url}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      image_url: e.target.value
                    })
                  }
                  placeholder="Image URL"
                />

                <button type="submit">
                  {saving ? 'Saving...' : 'Save'}
                </button>

                <button type="button" onClick={closeForm}>
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}
