/**
 * SOC Incident Center — master-detail layout.
 * Left: incident queue. Right: selected incident detail + timeline.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Clock, RefreshCw, ChevronRight } from 'lucide-react';
import * as api      from '../services/api';
import RiskBadge     from '../components/RiskBadge';
import StatusBadge   from '../components/StatusBadge';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function IncidentCenter() {
  const [incidents,   setIncidents]   = useState([]);
  const [selected,    setSelected]    = useState(null); // full incident detail
  const [loading,     setLoading]     = useState(true);
  const [detailLoad,  setDetailLoad]  = useState(false);
  const [updating,    setUpdating]    = useState(false);
  const [error,       setError]       = useState('');

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      setError('');
    } catch {
      setError('Could not load incidents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  async function selectIncident(id) {
    setDetailLoad(true);
    try {
      const data = await api.getIncident(id);
      setSelected(data);
    } catch {
      setError('Could not load incident detail.');
    } finally {
      setDetailLoad(false);
    }
  }

  async function updateStatus(id, status) {
    setUpdating(true);
    try {
      const updated = await api.updateIncidentStatus(id, status);
      setSelected(updated);
      // Refresh list to reflect new status
      setIncidents((prev) =>
        prev.map((inc) => inc.id === id ? { ...inc, status: updated.status } : inc)
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* ── Left panel: incident list ── */}
      <div
        className="w-80 shrink-0 flex flex-col border-r"
        style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* List header */}
        <div
          className="px-4 py-3 flex items-center justify-between border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: 'var(--color-accent)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Incident Queue
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
            >
              {incidents.length}
            </span>
            <button
              onClick={fetchIncidents}
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* Incident list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              Loading…
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No incidents yet.</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Run a high-risk scenario in the Security Lab.
              </div>
            </div>
          ) : (
            incidents.map((inc) => (
              <IncidentListItem
                key={inc.id}
                incident={inc}
                isSelected={selected?.id === inc.id}
                onClick={() => selectIncident(inc.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right panel: incident detail ── */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--color-bg-base)' }}>
        {error && (
          <div
            className="m-4 p-3 rounded text-xs"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
          >
            {error}
          </div>
        )}

        {!selected && !detailLoad && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <AlertTriangle size={32} style={{ color: 'var(--color-text-muted)' }} className="mb-3" />
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Select an incident to investigate
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Click any incident in the queue on the left.
            </div>
          </div>
        )}

        {detailLoad && (
          <div className="flex items-center justify-center h-full">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        )}

        {selected && !detailLoad && (
          <IncidentDetail incident={selected} onUpdateStatus={updateStatus} updating={updating} />
        )}
      </div>
    </div>
  );
}

// ─── List item ────────────────────────────────────────────────────────────────

function IncidentListItem({ incident, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 border-b flex items-start gap-3 transition-colors"
      style={{
        borderColor: 'var(--color-border)',
        background:  isSelected ? 'var(--color-bg-elevated)' : 'transparent',
      }}
    >
      <div
        className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: incident.severity === 'high' ? '#ef4444' : '#f59e0b',
          marginTop: '6px',
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {incident.incident_code}
          </span>
          <StatusBadge status={incident.status} />
        </div>
        <div className="text-xs truncate mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          {incident.user_name} — {incident.resource_name}
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge level={incident.severity} size="sm" />
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatTime(incident.created_at)}
          </span>
        </div>
      </div>
      {isSelected && <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', marginTop: '4px' }} />}
    </button>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function IncidentDetail({ incident, onUpdateStatus, updating }) {
  const canInvestigate = incident.status === 'open';
  const canResolve     = incident.status === 'investigating';
  const canClose       = incident.status === 'resolved';

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
              {incident.incident_code}
            </span>
            <RiskBadge level={incident.severity} size="md" />
            <StatusBadge status={incident.status} />
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Created {formatDateTime(incident.created_at)}
            {incident.updated_at !== incident.created_at && ` · Updated ${formatDateTime(incident.updated_at)}`}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {canInvestigate && (
            <button
              onClick={() => onUpdateStatus(incident.id, 'investigating')}
              disabled={updating}
              className="px-3 py-1.5 rounded text-xs font-semibold transition-opacity disabled:opacity-50"
              style={{ background: '#f59e0b', color: '#000' }}
            >
              {updating ? 'Updating…' : 'Start Investigation'}
            </button>
          )}
          {canResolve && (
            <button
              onClick={() => onUpdateStatus(incident.id, 'resolved')}
              disabled={updating}
              className="px-3 py-1.5 rounded text-xs font-semibold transition-opacity disabled:opacity-50"
              style={{ background: '#22c55e', color: '#000' }}
            >
              {updating ? 'Updating…' : 'Resolve Incident'}
            </button>
          )}
          {canClose && (
            <button
              onClick={() => onUpdateStatus(incident.id, 'closed')}
              disabled={updating}
              className="px-3 py-1.5 rounded text-xs font-semibold transition-opacity disabled:opacity-50"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {updating ? 'Updating…' : 'Close Incident'}
            </button>
          )}
        </div>
      </div>

      <hr className="divider" />

      {/* Incident summary grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'User',       value: incident.user_name },
          { label: 'Resource',   value: incident.resource_name },
          { label: 'Risk Score', value: `${incident.risk_score} / 100` },
          { label: 'Decision',   value: incident.decision?.replace(/_/g, ' ').toUpperCase() },
        ].map(({ label, value }) => (
          <div key={label} className="panel-elevated p-3 rounded-lg">
            <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
            <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Reasons */}
      {incident.reasons?.length > 0 && (
        <div className="panel p-4">
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
            RISK FACTORS
          </div>
          <ul className="space-y-2">
            {incident.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span style={{ color: '#ef4444' }}>✕</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended action */}
      {incident.recommended_action && (
        <div
          className="p-4 rounded-lg text-sm"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
        >
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
            RECOMMENDED ACTION
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>{incident.recommended_action}</p>
        </div>
      )}

      {/* Timeline */}
      {incident.timeline?.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
            INCIDENT TIMELINE
          </div>
          <div className="space-y-0">
            {incident.timeline.map((entry, i) => (
              <TimelineEntry
                key={entry.id}
                entry={entry}
                isLast={i === incident.timeline.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Timeline entry ───────────────────────────────────────────────────────────

function TimelineEntry({ entry, isLast }) {
  const actionColors = {
    'Incident Created':         '#ef4444',
    'Investigation Started':    '#f59e0b',
    'Incident Resolved':        '#22c55e',
  };

  const dotColor = actionColors[entry.action] || 'var(--color-accent)';

  return (
    <div className="flex gap-4 py-3">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className="w-2 h-2 rounded-full shrink-0 mt-1"
          style={{ background: dotColor }}
        />
        {!isLast && (
          <div
            className="w-px flex-1 mt-1"
            style={{ background: 'var(--color-border)', minHeight: '20px' }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-2">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {entry.action}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatTime(entry.created_at)}
          </span>
        </div>
        {entry.description && (
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {entry.description}
          </p>
        )}
        {entry.actor && (
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            by {entry.actor}
          </div>
        )}
      </div>
    </div>
  );
}
