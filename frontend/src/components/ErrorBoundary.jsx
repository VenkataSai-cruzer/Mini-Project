import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

/**
 * Global error boundary.
 * Catches render-time crashes anywhere in the component tree and shows a
 * readable error panel instead of a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Render crash:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    // Clear bad in-memory state by going through a full page load
    window.location.href = '/';
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'var(--color-bg-base)' }}
      >
        <div className="panel w-full max-w-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-2 rounded"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Something went wrong
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                The app hit an unexpected error and stopped rendering.
              </div>
            </div>
          </div>

          <div
            className="rounded p-3 mb-5 font-mono text-xs break-words"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              color: '#ef4444',
              maxHeight: '160px',
              overflowY: 'auto',
            }}
          >
            {this.state.error?.message || String(this.state.error)}
          </div>

          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              <RotateCcw size={14} /> Reload App
            </button>
            <button
              onClick={this.handleHome}
              className="flex items-center gap-2 px-4 py-2.5 rounded text-sm"
              style={{
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Home size={14} /> Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
