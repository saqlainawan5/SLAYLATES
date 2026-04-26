// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError('Invalid email or password. Please try again.');
      } else {
        navigate('/');
      }
    } else {
      if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error.message);
      } else {
        setSuccessMsg('Account created! Check your email to confirm, then sign in.');
        setMode('login');
        setPassword('');
      }
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-page__visual">
        <div className="login-page__visual-content">
          <div className="login-page__circle">
            <svg viewBox="0 0 200 200" width="200" height="200">
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(201,169,110,0.3)" strokeWidth="1"/>
              <circle cx="100" cy="100" r="55" fill="none" stroke="rgba(201,169,110,0.5)" strokeWidth="0.5" strokeDasharray="3 3"/>
              <text x="100" y="95" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="18" fill="var(--gold)" fontStyle="italic">Slaylates</text>
              <text x="100" y="115" textAnchor="middle" fontFamily="Jost, sans-serif" fontSize="6" fill="rgba(201,169,110,0.8)" letterSpacing="4">HANDMADE</text>
            </svg>
          </div>
          <blockquote className="login-page__quote">
            "Wear what speaks to your soul."
          </blockquote>
        </div>
      </div>

      <div className="login-page__form-panel">
        <div className="login-form-wrap">
          <Link to="/" className="login-page__back">← Back to Home</Link>

          <div className="login-form__header">
            <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
            <p>{mode === 'login'
              ? 'Sign in to access your cart and orders.'
              : 'Join Slaylates for a personalized experience.'
            }</p>
          </div>

          {/* Mode toggle */}
          <div className="login-form__tabs">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            >Sign In</button>
            <button
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
            >Create Account</button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && <div className="login-form__error">{error}</div>}
            {successMsg && <div className="login-form__success">{successMsg}</div>}

            <button
              type="submit"
              className="btn btn-primary login-form__submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>

          <p className="login-form__switch">
            {mode === 'login'
              ? <>Don't have an account? <button onClick={() => { setMode('signup'); setError(''); }}>Sign up</button></>
              : <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
