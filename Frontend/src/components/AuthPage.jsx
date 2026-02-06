import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Thunder-Ai.png';
import { Link } from 'react-router-dom';

const getApiBase = () => {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) {
    return 'http://localhost:5000';
  }
  return 'https://thunder-ai-backend.onrender.com';
};

export default function AuthPage({ mode = 'login', setAuth }) {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageMode, setPageMode] = useState(mode);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) return 'Enter a valid email address';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /\d/.test(value);
    if (!hasLetter || !hasNumber) return 'Use letters and numbers';
    return '';
  };

  const validateConfirm = (value) => {
    if (pageMode !== 'signup') return '';
    if (!value) return 'Confirm your password';
    if (value !== form.password) return 'Passwords do not match';
    return '';
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const isValid = () => {
    const emailError = validateEmail(form.email);
    const passError = validatePassword(form.password);
    const confirmError = validateConfirm(form.confirmPassword);
    if (pageMode === 'login') return !emailError && !passError;
    return !emailError && !passError && !confirmError;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const nextErrors = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword: validateConfirm(form.confirmPassword),
    };
    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      setFieldErrors(nextErrors);
      return;
    }
    setLoading(true);
    try {
      const apiBase = getApiBase().replace(/\/+$/, '');
      const url = `${apiBase}/api/auth/${pageMode}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      const raw = await res.text();
      let data;
      try { data = JSON.parse(raw); } catch {
        throw new Error(`Unexpected response (${res.status}). ${raw?.slice(0,120)}`);
      }
      if (!res.ok) throw new Error(data.error || `Auth failed (${res.status})`);
      localStorage.setItem('token', data.token);
      setAuth(true);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setPageMode(pageMode === 'login' ? 'signup' : 'login');
    setError('');
    setFieldErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050b18] via-[#0b1b3a] to-[#0a0f1f] text-white">
      <header className="bg-black/40 border-b border-white/10 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Thunder AI Logo" className="w-9 h-9 rounded shadow" />
            <div>
              <p className="text-white font-semibold leading-tight">Thunder-AI</p>
              <p className="text-xs text-blue-300">Smart assistant for real work</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              to="/about"
              className="px-4 py-2 rounded-lg text-blue-200 hover:bg-white/10 transition"
            >
              About
            </Link>
            <Link
              to="/login"
              className={`px-4 py-2 rounded-lg border border-white/15 ${pageMode === 'login' ? 'bg-blue-500/20 text-white' : 'text-blue-200 hover:bg-white/10'} transition`}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className={`px-4 py-2 rounded-lg ${pageMode === 'signup' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'} transition`}
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <section className="bg-[#0b1426] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {pageMode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-blue-200 text-sm sm:text-base mb-6">
            {pageMode === 'login'
              ? 'Sign in to continue your conversations and access your history.'
              : 'Join Thunder-AI to save chats and get faster, smarter responses.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-blue-100 font-semibold mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={() => setFieldErrors((prev) => ({ ...prev, email: validateEmail(form.email) }))}
                className={`w-full px-4 py-2 border rounded-lg bg-black/30 text-white placeholder-blue-300 focus:outline-none focus:ring-2 ${fieldErrors.email ? 'border-red-300 focus:ring-red-300' : 'border-white/15 focus:ring-blue-500'}`}
                placeholder="you@example.com"
                autoFocus
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
                required
              />
              {fieldErrors.email && <p className="text-red-300 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-blue-100 font-semibold mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => setFieldErrors((prev) => ({ ...prev, password: validatePassword(form.password) }))}
                  className={`w-full px-4 py-2 pr-12 border rounded-lg bg-black/30 text-white placeholder-blue-300 focus:outline-none focus:ring-2 ${fieldErrors.password ? 'border-red-300 focus:ring-red-300' : 'border-white/15 focus:ring-blue-500'}`}
                  placeholder="At least 8 characters"
                  autoComplete={pageMode === 'login' ? 'current-password' : 'new-password'}
                  aria-invalid={!!fieldErrors.password}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-200 text-xs px-2 py-1 rounded hover:bg-white/10"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-blue-300 text-xs mt-1">Use 8+ characters with letters and numbers.</p>
              {fieldErrors.password && <p className="text-red-300 text-xs mt-1">{fieldErrors.password}</p>}
            </div>

            {pageMode === 'signup' && (
              <div>
                <label className="block text-blue-100 font-semibold mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => setFieldErrors((prev) => ({ ...prev, confirmPassword: validateConfirm(form.confirmPassword) }))}
                  className={`w-full px-4 py-2 border rounded-lg bg-black/30 text-white placeholder-blue-300 focus:outline-none focus:ring-2 ${fieldErrors.confirmPassword ? 'border-red-300 focus:ring-red-300' : 'border-white/15 focus:ring-blue-500'}`}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  aria-invalid={!!fieldErrors.confirmPassword}
                  required
                />
                {fieldErrors.confirmPassword && <p className="text-red-300 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
              </div>
            )}

            {error && <div className="text-red-300 text-sm font-semibold text-center">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-400 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !isValid()}
            >
              {loading ? (pageMode === 'login' ? 'Signing in...' : 'Signing up...') : (pageMode === 'login' ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={switchMode}
              className="text-blue-200 hover:underline font-medium text-sm"
            >
              {pageMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </section>

        <section className="bg-[#0b1426] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-3">Why Thunder-AI?</h2>
          <ul className="space-y-3 text-blue-200 text-sm sm:text-base">
            <li>Clean, focused chat UI designed for speed and clarity.</li>
            <li>Reliable session handling with secure token validation.</li>
            <li>Production-ready UX with inline validation and helpful feedback.</li>
          </ul>
          <div className="mt-6 flex items-center gap-3">
            <Link to="/about" className="text-blue-200 font-semibold hover:underline">
              Learn more
            </Link>
            <span className="text-blue-400 text-xs">•</span>
            <Link to="/" className="text-blue-200 font-semibold hover:underline">
              Open app
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
