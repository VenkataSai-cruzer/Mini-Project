/**
 * Security Center — operations dashboard.
 * All numbers come from live application data via /api/dashboard/stats.
 * No hardcoded statistics.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, ShieldX,
  Activity, AlertTriangle, CheckCircle2,
  Clock, RefreshCw, ArrowRight,
  TrendingUp, Users, Database,
} from 'lucide-react';
import * as api      from '../services/api';
import RiskBadge     from '../components/RiskBadge';
import StatusBadge   from '../components/StatusBadge';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Security status config ───────────────────────────────────────────────────

const STATUS_CONFIG = {
  PROTECTED: {
    color:  '#22c55e',
    bg:     'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
    icon:   ShieldCheck,
    label:  'PROTECTED',
    desc:   'No active threats detected.',
  },
  ELEVATED: {
    color:  '#f59e0b',
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    icon:   ShieldAlert,
    label:  'ELEVATED',
    desc:   'Active incidents or recent high-risk events require attention.',
  },
  CRITICAL: {
    color:  '#ef4444',
    bg:     'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    icon:   ShieldX,
    label:  'CRITICAL',
    desc:   'Multiple active incidents. Immediate investigation required.',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SecurityCenter() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setError('');
    } catch {
      setError('Could not load security statistics. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div
          className="p-4 rounded-lg text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
        >
          {error}
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[stats?.securityStatus] || STATUS_CONFIG.PROTECTED;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} style={{ color: 'var(--color-accent)' }} />
            <span className="label-tag text-xs" style={{ color: 'var(--color-accent)' }}>
              SECURITY CENTER
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Security Operations
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Live statistics from simulated security events — all numbers reflect actual session activity.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Security status banner */}
      <div
        className="flex items-center gap-4 p-5 rounded-lg mb-6"
        style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
      >
        <StatusIcon size={32} style={{ color: statusCfg.color }} />
        <div>
          <div className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
            OVERALL SECURITY STATUS
          </div>
          <div className="text-2xl font-bold" style={{ color: statusCfg.color }}>
            {statusCfg.label}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {statusCfg.desc}
          </div>
        </div>
      </div>

      {/* Access request stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Requests"
          value={stats.access.total}
          icon={TrendingUp}
          color="var(--color-accent)"
        />
        <StatCard
          label="Access Granted"
          value={stats.access.granted}
          icon={CheckCircle2}
          color="#22c55e"
        />
        <StatCard
          label="Step-Up Required"
          value={stats.access.stepUp}
          icon={ShieldAlert}
          color="#f59e0b"
        />
        <StatCard
          label="Access Blocked"
          value={stats.access.blocked}
          icon={ShieldX}
          color="#ef4444"
        />
      </div>

      {/* Incident + risk stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="High-Risk Events"
          value={stats.highRiskEvents}
          icon={AlertTriangle}
          color="#ef4444"
        />
        <StatCard
          label="Open Incidents"
          value={stats.incidents.open}
          icon={AlertTriangle}
          color="#ef4444"
          clickable
          onClick={() => navigate('/incidents')}
        />
        <StatCard
          label="Investigating"
          value={stats.incidents.investigating}
          icon={Activity}
          color="#f59e0b"
          clickable
          onClick={() => navigate('/incidents')}
        />
        <StatCard
          label="Resolved / Closed"
          value={stats.incidents.resolved + stats.incidents.closed}
          icon={CheckCircle2}
          color="#22c55e"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Recent security events */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
              RECENT SECURITY EVENTS
            </span>
            <button
              onClick={() => navigate('/audit')}
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-accent)' }}
            >
              View all <ArrowRight size={11} />
            </button>
          </div>

          {stats.recentEvents.length === 0 ? (
            <div className="text-xs py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
              No events yet — run a scenario in the Security Lab.
            </div>
          ) : (
            <div className="space-y-0">
              {stats.recentEvents.map((ev) => (
                <EventRow key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </div>

        {/* Recent access decisions */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
              RECENT ACCESS DECISIONS
            </span>
            <button
              onClick={() => navigate('/lab')}
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-accent)' }}
            >
              Run scenario <ArrowRight size={11} />
            </button>
          </div>

          {stats.recentRequests.length === 0 ? (
            <div className="text-xs py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
              No access requests yet — run a scenario in the Security Lab.
            </div>
          ) : (
            <div className="space-y-0">
              {stats.recentRequests.map((req) => (
                <AccessRow key={req.id} request={req} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zero Trust flow reminder */}
      <div className="panel p-5 mt-5">
        <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
          ZERO TRUST EVALUATION PIPELINE
        </div>
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {[
            'Authentication',
            'Identity Verification',
            'Device Trust',
            'Context Evaluation',
            'Risk Engine',
            'Policy Engine',
            'ALLOW / STEP-UP / BLOCK',
            'Continuous Monitoring',
          ].map((step, i, arr) => (
            <React.Fragment key={step}>
              <span
                className="px-2.5 py-1 rounded"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border:     '1px solid var(--color-border)',
                  color:      i === arr.length - 1 ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                {step}
              </span>
              {i < arr.length - 1 && (
                <span style={{ color: 'var(--color-text-muted)' }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
          <em>"Never trust automatically. Continuously verify and evaluate risk."</em>
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, clickable, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="panel p-4 rounded-lg"
      style={{
        cursor:     clickable ? 'pointer' : 'default',
        borderColor: hovered && clickable ? color + '44' : 'var(--color-border)',
        background:  hovered && clickable ? `${color}08` : 'var(--color-bg-surface)',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onClick={clickable ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="text-3xl font-bold" style={{ color }}>
        {value ?? 0}
      </div>
      {clickable && hovered && (
        <div className="text-xs mt-1" style={{ color }}>View →</div>
      )}
    </div>
  );
}

function EventRow({ event }) {
  const decisionColorMap = {
    low:    '#22c55e',
    medium: '#f59e0b',
    high:   '#ef4444',
  };
  const color = decisionColorMap[event.risk_level] || 'var(--color-text-muted)';

  return (
    <div
      className="flex items-center justify-between py-2.5 border-b text-xs"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono shrink-0" style={{ color: 'var(--color-text-muted)' }}>
          {formatTime(event.created_at)}
        </span>
        <span className="truncate" style={{ color: 'var(--color-text-secondary)' }}>
          {event.event_type}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {event.risk_level && (
          <span
            className="label-tag px-1.5 py-0.5 rounded"
            style={{
              color,
              background: `${color}18`,
              border: `1px solid ${color}40`,
              fontSize: '9px',
            }}
          >
            {event.risk_level.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

function AccessRow({ request }) {
  const decisionConfig = {
    granted:                { label: 'GRANTED',  color: '#22c55e' },
    verification_required:  { label: 'STEP-UP',  color: '#f59e0b' },
    blocked:                { label: 'BLOCKED',  color: '#ef4444' },
  };
  const dc = decisionConfig[request.decision] || { label: request.decision?.toUpperCase(), color: '#94a3b8' };

  return (
    <div
      className="flex items-center justify-between py-2.5 border-b text-xs"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono shrink-0" style={{ color: 'var(--color-text-muted)' }}>
          {formatTime(request.created_at)}
        </span>
        <div className="min-w-0">
          <div className="truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {request.user_name}
          </div>
          <div className="truncate" style={{ color: 'var(--color-text-muted)' }}>
            → {request.resource_name}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <RiskBadge level={request.risk_level} size="sm" />
        <span
          className="label-tag px-1.5 py-0.5 rounded"
          style={{
            color:      dc.color,
            background: `${dc.color}18`,
            border:     `1px solid ${dc.color}40`,
            fontSize:   '9px',
          }}
        >
          {dc.label}
        </span>
      </div>
    </div>
  );
}
