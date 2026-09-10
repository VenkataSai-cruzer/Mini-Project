import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

/**
 * Large decision result banner shown after policy evaluation.
 * decision: 'granted' | 'verification_required' | 'blocked'
 */
export default function DecisionBanner({ decision, riskLevel, riskScore }) {
  const config = {
    granted: {
      icon:    <CheckCircle2 size={28} />,
      label:   'ACCESS GRANTED',
      sub:     'Identity verified. Risk level acceptable.',
      color:   '#22c55e',
      bg:      'rgba(34,197,94,0.08)',
      border:  'rgba(34,197,94,0.25)',
    },
    verification_required: {
      icon:    <AlertCircle size={28} />,
      label:   'VERIFICATION REQUIRED',
      sub:     'Suspicious signals detected. Additional verification needed.',
      color:   '#f59e0b',
      bg:      'rgba(245,158,11,0.08)',
      border:  'rgba(245,158,11,0.25)',
    },
    blocked: {
      icon:    <XCircle size={28} />,
      label:   'ACCESS BLOCKED',
      sub:     'High risk detected. Access denied by policy engine.',
      color:   '#ef4444',
      bg:      'rgba(239,68,68,0.08)',
      border:  'rgba(239,68,68,0.25)',
    },
  };

  const c = config[decision] || config.blocked;

  return (
    <div
      className="result-appear rounded-lg p-6 flex items-center gap-5"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div style={{ color: c.color }}>{c.icon}</div>
      <div className="flex-1">
        <div className="font-bold text-lg tracking-wide" style={{ color: c.color }}>
          {c.label}
        </div>
        <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {c.sub}
        </div>
      </div>
      {riskScore !== undefined && (
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold" style={{ color: c.color }}>
            {riskScore}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            RISK SCORE
          </div>
        </div>
      )}
    </div>
  );
}
