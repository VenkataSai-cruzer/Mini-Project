/**
 * Login page — the app entry point for unauthenticated users.
 */

import React, { useState } from 'react';
import { useNavigate }   from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login }       = useAuth();
  const navigate        = useNavigate();

  const [email,    setEmail]    = useState('demo@ztguard.edu');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/lab', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail('demo@ztguard.edu');
    setPassword('ZTGuard2024!');
    setError('');
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg-base)' }}
    >
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShieldCheck size={28} style={{ color: 'var(--color-accent)' }} />
            <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              ZTGuard
            </span>
          </div>
          <div
            className="label-tag inline-block px-2 py-0.5 rounded text-xs mb-3"
            style={{
              color:      'var(--color-accent)',
              background: 'rgba(59,130,246,0.08)',
              border:     '1px solid rgba(59,130,246,0.2)',
            }}
          >
            EDUCATIONAL SECURITY PROTOTYPE
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Adaptive Zero Trust Security Monitoring
          </p>
        </div>

        {/* Card */}
        <div className="panel p-6">
          <div className="text-sm font-semibold mb-5" style={{ color: 'var(--color-text-secondary)' }}>
            Sign in to continue
          </div>

          {error && (
            <div
              className="mb-4 px-3 py-2.5 rounded text-xs"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border:     '1px solid rgba(239,68,68,0.2)',
                color:      '#ef4444',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded text-sm outline-none transition-colors"
                style={{
                  background:  'var(--color-bg-elevated)',
                  border:      '1px solid var(--color-border)',
                  color:       'var(--color-text-primary)',
                }}
                onFocus={(e)  => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                onBlur={(e)   => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 rounded text-sm outline-none transition-colors"
                  style={{
                    background:  'var(--color-bg-elevated)',
                    border:      '1px solid var(--color-border)',
                    color:       'var(--color-text-primary)',
                  }}
                  onFocus={(e)  => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                  onBlur={(e)   => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded text-sm font-semibold transition-opacity disabled:opacity-50 mt-2"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo credential helper */}
        <div
          className="mt-4 p-4 rounded-lg text-xs"
          style={{
            background:  'var(--color-bg-surface)',
            border:      '1px solid var(--color-border)',
            color:       'var(--color-text-muted)',
          }}
        >
          <div className="font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Demo credentials
          </div>
          <div className="flex items-center justify-between mb-1">
            <span>Email:</span>
            <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>demo@ztguard.edu</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span>Password:</span>
            <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>ZTGuard2024!</span>
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className="w-full py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: 'var(--color-bg-elevated)',
              border:     '1px solid var(--color-border)',
              color:      'var(--color-text-secondary)',
            }}
          >
            Fill demo credentials
          </button>
        </div>
      </div>
    </div>
  );
}
