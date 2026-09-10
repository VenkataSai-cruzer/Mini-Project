/**
 * About Prototype page.
 */

import React from 'react';
import { ShieldCheck, Info, BookOpen, AlertCircle } from 'lucide-react';

const CONCEPTS = [
  {
    title: 'Zero Trust Security',
    desc:  'Never trust automatically. Every access request is evaluated regardless of network location or prior authentication.',
  },
  {
    title: 'Context-Aware Access Control',
    desc:  'Access decisions factor in device trust, access context, user behaviour, and resource sensitivity simultaneously.',
  },
  {
    title: 'Risk-Based Decisions',
    desc:  'A rule-based scoring engine quantifies risk from multiple signals and maps scores to policy outcomes.',
  },
  {
    title: 'Continuous Verification',
    desc:  'Active sessions are re-evaluated when the security context changes — not just at initial login.',
  },
  {
    title: 'SOC Incident Workflow',
    desc:  'High-risk events automatically generate incidents that follow a structured detection → investigation → resolution lifecycle.',
  },
  {
    title: 'Security Event Monitoring',
    desc:  'Every policy decision, verification step, and status change is recorded in a tamper-evident audit log.',
  },
];

const RISK_TABLE = [
  { factor: 'Unknown / Untrusted Device',    points: '+25', color: '#ef4444' },
  { factor: 'Unusual Access Context',        points: '+20', color: '#ef4444' },
  { factor: 'Multiple Failed Attempts (3+)', points: '+20', color: '#f59e0b' },
  { factor: 'High Failed Attempts (5+)',     points: '+30', color: '#ef4444' },
  { factor: 'Sensitive Resource Requested',  points: '+20', color: '#f59e0b' },
];

const THRESHOLDS = [
  { range: '0 – 30',   level: 'LOW',    decision: 'Access Granted',                  color: '#22c55e' },
  { range: '31 – 60',  level: 'MEDIUM', decision: 'Additional Verification Required', color: '#f59e0b' },
  { range: '61 – 100', level: 'HIGH',   decision: 'Access Blocked',                  color: '#ef4444' },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Info size={16} style={{ color: 'var(--color-accent)' }} />
        <span className="label-tag text-xs" style={{ color: 'var(--color-accent)' }}>ABOUT</span>
      </div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>ZTGuard</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        Adaptive Zero Trust Security Monitoring &amp; Incident Response Prototype
      </p>

      {/* Disclaimer banner */}
      <div
        className="flex gap-3 p-4 rounded-lg mb-8 text-sm"
        style={{
          background:   'rgba(245,158,11,0.06)',
          border:       '1px solid rgba(245,158,11,0.2)',
          color:        'var(--color-text-secondary)',
        }}
      >
        <AlertCircle size={18} style={{ color: '#f59e0b', shrink: 0, marginTop: '1px' }} />
        <div>
          <span className="font-semibold" style={{ color: '#f59e0b' }}>Educational Prototype — </span>
          All security events in this prototype are simulated for educational demonstration.
          No real attacks, real enterprise security infrastructure, real Palo Alto products,
          or production-grade systems are involved.
        </div>
      </div>

      {/* About section */}
      <div className="panel p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={15} style={{ color: 'var(--color-accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            About This Prototype
          </span>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          ZTGuard is an educational prototype developed to demonstrate cybersecurity concepts explored
          during a Palo Alto Networks cybersecurity virtual internship program. It provides a hands-on
          demonstration of how modern Zero Trust security principles are applied in practice.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          The prototype implements a complete simulated security workflow — from initial identity
          verification through risk analysis, policy enforcement, incident management, and continuous
          session monitoring — to illustrate how a real Security Operations Center (SOC) prototype would
          approach access control.
        </p>
      </div>

      {/* Concepts demonstrated */}
      <div className="mb-6">
        <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
          CONCEPTS DEMONSTRATED
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONCEPTS.map((c) => (
            <div key={c.title} className="panel p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck size={13} style={{ color: 'var(--color-accent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {c.title}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk engine explanation */}
      <div className="panel p-6 mb-6">
        <div className="text-xs font-semibold mb-4" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
          RISK ANALYSIS ENGINE
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          The risk engine evaluates security context signals and assigns a numeric score (0–100).
          Multiple factors are evaluated independently and summed, then capped at 100.
        </p>
        <div className="space-y-1 mb-5">
          {RISK_TABLE.map((r) => (
            <div key={r.factor} className="flex items-center justify-between py-1.5 text-xs border-b"
              style={{ borderColor: 'var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{r.factor}</span>
              <span className="font-mono font-bold" style={{ color: r.color }}>{r.points}</span>
            </div>
          ))}
        </div>
        <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
          RISK THRESHOLDS &amp; DECISIONS
        </div>
        <div className="space-y-2">
          {THRESHOLDS.map((t) => (
            <div key={t.level} className="flex items-center gap-3 text-xs py-1.5 border-b"
              style={{ borderColor: 'var(--color-border)' }}>
              <span className="font-mono w-16 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                {t.range}
              </span>
              <span
                className="label-tag px-2 py-0.5 rounded w-16 text-center shrink-0"
                style={{
                  color:      t.color,
                  background: `${t.color}18`,
                  border:     `1px solid ${t.color}40`,
                }}
              >
                {t.level}
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{t.decision}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zero Trust Policy Engine */}
      <div className="panel p-6 mb-6">
        <div className="text-xs font-semibold mb-4" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
          ZERO TRUST POLICY ENGINE
        </div>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          The Policy Engine is a distinct logical module that receives the full access context — user identity,
          device trust level, access context type, failed attempt count, resource sensitivity, and the calculated
          risk score — and returns a structured policy decision.
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          It enforces the Zero Trust principle by treating every access request as potentially untrusted,
          regardless of prior sessions or network location. The engine maps risk levels to access outcomes,
          generates human-readable explanations, and flags incidents requiring SOC investigation.
        </p>
      </div>

      {/* Tech stack */}
      <div className="panel p-5">
        <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
          TECHNOLOGY STACK
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['Frontend', 'React + Vite + Tailwind CSS'],
            ['Backend',  'Node.js + Express'],
            ['Database', 'PostgreSQL (in-memory fallback)'],
            ['Auth',     'JWT + bcrypt'],
            ['Routing',  'React Router v6'],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <span style={{ color: 'var(--color-text-muted)' }}>{label}:</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
