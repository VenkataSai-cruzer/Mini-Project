import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Expandable risk analysis breakdown panel.
 * appliedFactors : [{ key, label, points }]
 * clearedFactors : [{ key, label }]
 * riskScore      : number
 * riskLevel      : 'low' | 'medium' | 'high'
 */
export default function RiskBreakdown({ appliedFactors = [], clearedFactors = [], riskScore, riskLevel }) {
  const [open, setOpen] = useState(false);

  const riskColor = {
    low:    '#22c55e',
    medium: '#f59e0b',
    high:   '#ef4444',
  }[riskLevel] || '#94a3b8';

  return (
    <div className="panel-elevated rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
          RISK ANALYSIS DETAILS
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold" style={{ color: riskColor }}>
            Score: {riskScore} / 100
          </span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 slide-in">
          <hr className="divider mb-4" />

          {/* Applied factors */}
          {appliedFactors.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
                RISK FACTORS APPLIED
              </div>
              <div className="space-y-1">
                {appliedFactors.map((f) => (
                  <div key={f.key} className="flex items-center justify-between py-1.5 text-xs">
                    <span style={{ color: '#ef4444' }}>{f.label}</span>
                    <span className="font-mono font-bold" style={{ color: '#ef4444' }}>+{f.points}</span>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center justify-between py-2 mt-1 border-t text-xs font-bold"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span style={{ color: 'var(--color-text-primary)' }}>Total Risk Score</span>
                <span style={{ color: riskColor }}>{riskScore} / 100</span>
              </div>
            </div>
          )}

          {/* Cleared checks */}
          {clearedFactors.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
                CHECKS PASSED
              </div>
              <div className="space-y-1">
                {clearedFactors.map((f) => (
                  <div key={f.key} className="flex items-center gap-2 py-1 text-xs" style={{ color: '#22c55e' }}>
                    <span>✓</span>
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {appliedFactors.length === 0 && (
            <div className="text-xs py-2" style={{ color: '#22c55e' }}>
              No risk factors triggered. All checks passed.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
