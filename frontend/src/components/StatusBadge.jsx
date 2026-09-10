import React from 'react';

/**
 * Incident status badge: open | investigating | resolved | closed
 */
export default function StatusBadge({ status }) {
  if (!status) return null;

  const styleMap = {
    open:          { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)' },
    investigating: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
    resolved:      { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.25)'  },
    closed:        { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.25)' },
  };

  const s = styleMap[status] || styleMap.open;

  return (
    <span
      className="label-tag px-2 py-0.5 rounded text-[10px]"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {status.toUpperCase()}
    </span>
  );
}
