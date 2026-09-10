import React from 'react';

/**
 * Displays a risk level badge: LOW | MEDIUM | HIGH
 * size: 'sm' | 'md' | 'lg'
 */
export default function RiskBadge({ level, size = 'md' }) {
  if (!level) return null;

  const norm  = level.toLowerCase();
  const label = level.toUpperCase();

  const classMap = {
    low:    'badge-low',
    medium: 'badge-medium',
    high:   'badge-high',
  };

  const sizeMap = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`label-tag rounded ${classMap[norm] || 'badge-info'} ${sizeMap[size]}`}>
      {label}
    </span>
  );
}
