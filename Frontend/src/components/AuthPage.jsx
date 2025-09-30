import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MyContext } from './Mycontext.jsx';
import logo from '../assets/Thunder-Ai.png';

// Prefer local backend during development to avoid remote CORS
const getApiBase = () => {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) {
    return 'http://localhost:5000';
  }
  return 'https://thunder-ai-backend.onrender.com';
};

export default function AuthPage({ mode = 'login' }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageMode, setPageMode] = useState(mode);
  const { setAuth } = useContext(MyContext);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/auth/${pageMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auth failed');
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
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-blue-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-blue-100">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Thunder AI Logo" className="w-16 h-16 mb-2 rounded shadow" />
          <h1 className="text-2xl font-bold text-blue-900 mb-1">Thunder-AI</h1>
          <p className="text-blue-400 text-sm font-medium mb-2">
            {pageMode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-blue-900 font-semibold mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              autoFocus
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-blue-900 font-semibold mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              autoComplete={pageMode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
            />
          </div>
          {error && <div className="text-red-500 text-sm font-semibold text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold shadow-md hover:bg-blue-600 transition-all duration-200"
            disabled={loading}
          >
            {loading ? (pageMode === 'login' ? 'Signing in...' : 'Signing up...') : (pageMode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={switchMode}
            className="text-blue-500 hover:underline font-medium text-sm"
          >
            {pageMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}