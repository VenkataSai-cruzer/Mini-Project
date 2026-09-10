import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, X, ShieldCheck } from 'lucide-react';
import * as api from '../services/api';

/**
 * OTP verification overlay shown when decision === 'verification_required'.
 * onSuccess(void) — called after correct code is entered
 * onClose(void)   — called if user dismisses (not used in main demo flow but available)
 */
export default function VerificationModal({ accessRequestId, onSuccess, onClose }) {
  const [code,    setCode]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.verifyOtp(code, accessRequestId);
      if (result.success) {
        setDone(true);
        setTimeout(() => { if (mountedRef.current) onSuccess(); }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div className="panel w-full max-w-md p-8 relative" style={{ background: 'var(--color-bg-elevated)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            <KeyRound size={20} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Additional Verification Required
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Suspicious signals detected on this access request
            </div>
          </div>
        </div>

        <hr className="divider mb-6" />

        {/* Context info */}
        <div
          className="rounded p-3 mb-6 text-xs"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}
        >
          An unknown device and multiple failed login attempts were detected. Enter your verification code to continue.
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <ShieldCheck size={40} style={{ color: '#22c55e' }} />
            <div className="font-semibold" style={{ color: '#22c55e' }}>Verification Successful</div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Granting access…</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              VERIFICATION CODE
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full px-4 py-3 rounded text-center text-lg font-mono tracking-[0.3em] outline-none transition-colors"
              style={{
                background:  'var(--color-bg-surface)',
                border:      `1px solid ${error ? '#ef4444' : 'var(--color-border)'}`,
                color:       'var(--color-text-primary)',
              }}
              autoFocus
            />

            {error && (
              <p className="mt-2 text-xs" style={{ color: '#ef4444' }}>{error}</p>
            )}

            <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Demo code: <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>123456</span>
            </p>

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full mt-5 py-3 rounded font-semibold text-sm transition-opacity disabled:opacity-40"
              style={{ background: '#f59e0b', color: '#000' }}
            >
              {loading ? 'Verifying…' : 'Verify Identity'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
