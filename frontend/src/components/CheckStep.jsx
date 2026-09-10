import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Circle } from 'lucide-react';

/**
 * Single step in the analysis sequence.
 * state: 'pending' | 'running' | 'pass' | 'warn' | 'fail'
 */
export default function CheckStep({ label, note, state }) {
  const iconMap = {
    pending: <Circle   size={16} style={{ color: 'var(--color-text-muted)' }} />,
    running: <Circle   size={16} style={{ color: 'var(--color-accent)' }} className="pulse-dot" />,
    pass:    <CheckCircle2 size={16} className="check-pass" />,
    warn:    <AlertTriangle size={16} className="check-warn" />,
    fail:    <XCircle  size={16} className="check-fail" />,
  };

  const colorMap = {
    pending: 'var(--color-text-muted)',
    running: 'var(--color-accent)',
    pass:    'var(--color-text-primary)',
    warn:    '#f59e0b',
    fail:    '#ef4444',
  };

  return (
    <div
      className="flex items-start gap-3 py-2.5 slide-in"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="mt-0.5 shrink-0">{iconMap[state] || iconMap.pending}</div>
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium"
          style={{ color: colorMap[state] || 'var(--color-text-muted)' }}
        >
          {label}
        </div>
        {note && state !== 'pending' && (
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {note}
          </div>
        )}
      </div>
      <div className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
        {state === 'pass' && '✓'}
        {state === 'warn' && '⚠'}
        {state === 'fail' && '✕'}
        {state === 'running' && '…'}
      </div>
    </div>
  );
}
