/**
 * Security Audit Log page.
 * Chronological event stream with risk-level filtering.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollText, RefreshCw,
  CheckCircle2, AlertTriangle, XCircle,
  Shield, Key, User, Monitor, Activity,
} from 'lucide-react';
import * as api  from '../services/api';
import RiskBadge from '../components/RiskBadge';

const FILTERS = [
  { value: 'all',       label: 'All Events'  },
  { value: 'low',       label: 'Low'         },
  { value: 'medium',    label: 'Medium'      },
  { value: 'high',      label: 'High'        },
  { value: 'granted',   label: 'Granted'     },
  { value: 'blocked',   label: 'Blocked'     },
  { value: 'step_up',   label: 'Step-Up'     },
  { value: 'incidents', label: 'Incidents'   },
];

// Map event types to icons
function eventIcon(eventType) {
  const t = (eventType || '').toLowerCase();
  if (t.includes('granted'))      return <CheckCircle2 size={14} style={{ color: '#22c55e' }} />;
  if (t.includes('blocked'))      return <XCircle      size={14} style={{ color: '#ef4444' }} />;
  if (t.includes('verification')) return <Key          size={14} style={{ color: '#f59e0b' }} />;
  if (t.includes('incident'))     return <AlertTriangle size={14} style={{ color: '#ef4444' }} />;
  if (t.includes('session'))      return <Monitor      size={14} style={{ color: 'var(--color-accent)' }} />;
  if (t.includes('auth'))         return <User         size={14} style={{ color: 'var(--color-accent)' }} />;
  if (t.includes('evaluated'))    return <Activity     size={14} style={{ color: 'var(--color-accent)' }} />;
  return <Shield size={14} style={{ color: 'var(--color-text-muted)' }} />;
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function AuditLog() {
  const [events,  setEvents]  = useState([]);
  const [filter,  setFilter]  = useState('all');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAuditEvents(filter);
      setEvents(data);
      setError('');
    } catch {
      setError('Could not load audit events.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Group events by date
  const grouped = events.reduce((acc, ev) => {
    const date = new Date(ev.created_at).toLocaleDateString([], {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(ev);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ScrollText size={16} style={{ color: 'var(--color-accent)' }} />
            <span className="label-tag text-xs" style={{ color: 'var(--color-accent)' }}>
              SECURITY AUDIT LOG
            </span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Event Stream
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            All security events generated during the simulation, in reverse chronological order.
          </p>
        </div>
        <button
          onClick={fetchEvents}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: filter === f.value
                ? 'rgba(59,130,246,0.12)'
                : 'var(--color-bg-surface)',
              border: `1px solid ${filter === f.value ? 'rgba(59,130,246,0.3)' : 'var(--color-border)'}`,
              color: filter === f.value
                ? 'var(--color-accent)'
                : 'var(--color-text-secondary)',
            }}
          >
            {f.label}
          </button>
        ))}
        {!loading && (
          <span className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && (
        <div
          className="mb-4 p-3 rounded text-xs"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      ) : events.length === 0 ? (
        <div className="panel p-12 text-center">
          <ScrollText size={32} style={{ color: 'var(--color-text-muted)' }} className="mx-auto mb-3" />
          <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            No events yet
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Run a scenario in the Security Lab to generate events.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, evs]) => (
            <div key={date}>
              <div
                className="text-xs font-semibold mb-3 sticky top-0 py-1"
                style={{
                  color:      'var(--color-text-muted)',
                  background: 'var(--color-bg-base)',
                  letterSpacing: '0.06em',
                }}
              >
                {date}
              </div>
              <div className="space-y-1">
                {evs.map((ev) => (
                  <AuditEntry key={ev.id} event={ev} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single audit entry ───────────────────────────────────────────────────────

function AuditEntry({ event }) {
  const [expanded, setExpanded] = useState(false);

  const borderColorMap = {
    low:    'rgba(34,197,94,0.15)',
    medium: 'rgba(245,158,11,0.15)',
    high:   'rgba(239,68,68,0.15)',
  };

  const border = borderColorMap[event.risk_level] || 'var(--color-border)';

  return (
    <div
      className="panel rounded-lg overflow-hidden"
      style={{ borderColor: border }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        {/* Icon */}
        <div className="shrink-0">{eventIcon(event.event_type)}</div>

        {/* Event type */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {event.event_type}
          </div>
          <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {event.user_name}
            {event.details && ` — ${event.details}`}
          </div>
        </div>

        {/* Risk badge + time */}
        <div className="flex items-center gap-3 shrink-0">
          {event.risk_level && <RiskBadge level={event.risk_level} size="sm" />}
          <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
            {formatDateTime(event.created_at)}
          </span>
        </div>
      </button>

      {expanded && event.metadata && Object.keys(event.metadata).length > 0 && (
        <div
          className="px-4 py-3 border-t text-xs slide-in"
          style={{
            borderColor: 'var(--color-border)',
            background:  'var(--color-bg-elevated)',
            color:       'var(--color-text-secondary)',
          }}
        >
          <div className="font-semibold mb-2" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
            EVENT METADATA
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(event.metadata).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span style={{ color: 'var(--color-text-muted)' }}>{k}:</span>
                <span className="font-mono truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
