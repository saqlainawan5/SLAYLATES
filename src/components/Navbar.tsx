// src/components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();

  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">

        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-script">Slaylates</span>
        </Link>

        {/* Desktop Links */}
        <nav className="navbar__links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Home
          </Link>

          <Link
            to="/products"
            className={location.pathname.startsWith('/products') ? 'active' : ''}
          >
            Collection
          </Link>

          <Link
            to="/wishlist"
            className={location.pathname === '/wishlist' ? 'active' : ''}
          >
            Wishlist
          </Link>

          <Link
            to="/orders"
            className={location.pathname === '/orders' ? 'active' : ''}
          >
            Orders
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className={location.pathname === '/admin' ? 'active' : ''}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="navbar__actions">

          {/* Login / User */}
          {user ? (
            <button
              className="navbar__action-btn"
              onClick={handleSignOut}
              title="Sign out"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M16 17l5-5-5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M21 12H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          ) : (
            <Link to="/login" className="navbar__action-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="7" r="4" stroke="currentColor" />
                <path
                  d="M4 21a8 8 0 0 1 16 0"
                  stroke="currentColor"
                />
              </svg>
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="navbar__cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 2l1 4h13l1-4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M4 6h16l-1 14H5L4 6z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>

            {itemCount > 0 && (
              <span className="navbar__cart-badge">{itemCount}</span>
            )}
          </Link>

          {/* Mobile menu */}
          <button
            className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile-menu">
          <Link to="/">Home</Link>
          <Link to="/products">Collection</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/orders">Orders</Link>

          {isAdmin && <Link to="/admin">Admin</Link>}

          {user ? (
            <button onClick={handleSignOut}>Sign Out</button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      )}
    </header>
  );
}