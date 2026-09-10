/**
 * Active Session page.
 * Shows current session state and demonstrates continuous verification
 * by simulating a security context change mid-session.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MonitorCheck, ShieldCheck, AlertTriangle,
  User, Monitor, Database, Clock,
  RefreshCw, ArrowRight, ShieldAlert,
} from 'lucide-react';
import { useAuth }    from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import * as api       from '../services/api';
import RiskBadge          from '../components/RiskBadge';
import DecisionBanner     from '../components/DecisionBanner';
import VerificationModal  from '../components/VerificationModal';

const REEVAL_PHASE = {
  IDLE:       'idle',
  SIMULATING: 'simulating',
  RESULT:     'result',
};

export default function ActiveSession() {
  const { user }                      = useAuth();
  const { session, updateSessionRisk, clearSession } = useSession();
  const navigate                      = useNavigate();

  const [reevalPhase,  setReevalPhase]  = useState(REEVAL_PHASE.IDLE);
  const [reevalResult, setReevalResult] = useState(null);
  const [showVerify,   setShowVerify]   = useState(false);
  const [apiError,     setApiError]     = useState('');

  // If no active session, show placeholder
  if (!session) {
    return <NoSessionPlaceholder />;
  }

  async function simulateContextChange() {
    setReevalPhase(REEVAL_PHASE.SIMULATING);
    setApiError('');

    // Simulate: trusted device → unknown, 0 attempts → 3
    try {
      const result = await api.revaluateSession({
        deviceTrusted:  false,
        failedAttempts: 3,
        resourceId:     session.resource?.id || 'resource-portal-001',
      });

      setReevalResult(result);
      updateSessionRisk(result.policyResult.riskLevel, result.policyResult.riskScore);
      setReevalPhase(REEVAL_PHASE.RESULT);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Re-evaluation failed.');
      setReevalPhase(REEVAL_PHASE.IDLE);
    }
  }

  function handleVerificationSuccess() {
    setShowVerify(false);
    updateSessionRisk('low', 0);
    setReevalPhase(REEVAL_PHASE.IDLE);
    setReevalResult(null);
  }

  function handleEndSession() {
    clearSession();
    navigate('/lab');
  }

  const riskColorMap = {
    low:    '#22c55e',
    medium: '#f59e0b',
    high:   '#ef4444',
  };
  const riskColor = riskColorMap[session.riskLevel] || '#94a3b8';

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MonitorCheck size={16} style={{ color: 'var(--color-accent)' }} />
            <span className="label-tag text-xs" style={{ color: 'var(--color-accent)' }}>
              ACTIVE SESSION
            </span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Protected Resource Access
          </h1>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold"
          style={{
            background: 'rgba(34,197,94,0.08)',
            border:     '1px solid rgba(34,197,94,0.2)',
            color:      '#22c55e',
          }}
        >
          <span className="pulse-dot inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
          SESSION ACTIVE
        </div>
      </div>

      {/* Access granted notice */}
      <div
        className="mb-6 p-4 rounded-lg text-sm"
        style={{
          background: 'rgba(34,197,94,0.06)',
          border:     '1px solid rgba(34,197,94,0.2)',
          color:      'var(--color-text-secondary)',
        }}
      >
        <span className="font-semibold" style={{ color: '#22c55e' }}>Access granted</span> based on the current security context.
        The Zero Trust engine evaluated your identity, device trust, and risk posture before allowing this session.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

        {/* Session details */}
        <div className="panel p-5 md:col-span-2">
          <div className="text-xs font-semibold mb-4" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
            SESSION DETAILS
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: User,     label: 'User',          value: session.user?.name || user?.name },
              { icon: User,     label: 'Role',          value: session.user?.role || user?.role },
              { icon: Database, label: 'Resource',      value: session.resource?.name || 'Student Portal' },
              { icon: Monitor,  label: 'Device',        value: session.deviceName || 'Unknown' },
              { icon: ShieldCheck, label: 'Trust Level', value: session.deviceTrusted ? 'Trusted' : 'Untrusted' },
              { icon: Clock,    label: 'Session Start', value: new Date(session.grantedAt).toLocaleTimeString() },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon size={11} style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk status card */}
        <div
          className="panel p-5 flex flex-col items-center justify-center text-center"
          style={{ borderColor: `${riskColor}33` }}
        >
          <div className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            CURRENT RISK LEVEL
          </div>
          <div className="text-4xl font-bold mb-2" style={{ color: riskColor }}>
            {session.riskScore}
          </div>
          <div className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            / 100 risk score
          </div>
          <RiskBadge level={session.riskLevel} size="md" />
        </div>
      </div>

      {/* Continuous Verification section */}
      <div className="panel p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw size={14} style={{ color: 'var(--color-accent)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Continuous Verification
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Zero Trust is not "login once and trust forever." The system continuously monitors
              your session context. Simulate a context change to see re-evaluation in action.
            </p>
          </div>
        </div>

        <div
          className="p-4 rounded-lg mb-4 text-xs"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
        >
          <div className="font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Context change to be simulated:
          </div>
          <div className="space-y-1" style={{ color: 'var(--color-text-muted)' }}>
            <div className="flex items-center gap-2">
              <span style={{ color: '#ef4444' }}>→</span>
              Trusted Device changes to Unknown Device
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: '#ef4444' }}>→</span>
              Failed attempts increase to 3
            </div>
          </div>
        </div>

        {reevalPhase === REEVAL_PHASE.IDLE && (
          <button
            onClick={simulateContextChange}
            className="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <ShieldAlert size={15} />
            Simulate Security Context Change
          </button>
        )}

        {reevalPhase === REEVAL_PHASE.SIMULATING && (
          <div className="flex items-center gap-3 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
            Security context changed — re-evaluating session…
          </div>
        )}

        {apiError && (
          <div className="mt-2 text-xs" style={{ color: '#ef4444' }}>{apiError}</div>
        )}
      </div>

      {/* Re-evaluation result */}
      {reevalPhase === REEVAL_PHASE.RESULT && reevalResult && (
        <div className="space-y-4 slide-in">
          <div
            className="p-3 rounded text-sm font-semibold"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border:     '1px solid rgba(245,158,11,0.25)',
              color:      '#f59e0b',
            }}
          >
            SECURITY CONTEXT CHANGED — Session Re-evaluated
          </div>

          <DecisionBanner
            decision={reevalResult.policyResult.decision}
            riskLevel={reevalResult.policyResult.riskLevel}
            riskScore={reevalResult.policyResult.riskScore}
          />

          {reevalResult.policyResult.decision === 'verification_required' && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowVerify(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold hover:opacity-90"
                style={{ background: '#f59e0b', color: '#000' }}
              >
                Complete Verification to Continue
              </button>
              <button
                onClick={handleEndSession}
                className="px-4 py-2.5 rounded text-sm transition-colors"
                style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
              >
                End Session
              </button>
            </div>
          )}

          {reevalResult.incident && (
            <div
              className="p-3 rounded text-xs"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border:     '1px solid rgba(239,68,68,0.2)',
                color:      'var(--color-text-secondary)',
              }}
            >
              New incident <span className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {reevalResult.incident.code}
              </span> created in SOC Incident Center.
            </div>
          )}
        </div>
      )}

      {/* End session */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleEndSession}
          className="px-4 py-2 rounded text-xs transition-colors"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
        >
          End Session & Return to Lab
        </button>
      </div>

      {showVerify && (
        <VerificationModal
          accessRequestId={session.accessRequestId}
          onSuccess={handleVerificationSuccess}
          onClose={() => setShowVerify(false)}
        />
      )}
    </div>
  );
}

function NoSessionPlaceholder() {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <MonitorCheck size={16} style={{ color: 'var(--color-accent)' }} />
        <span className="label-tag text-xs" style={{ color: 'var(--color-accent)' }}>ACTIVE SESSION</span>
      </div>
      <div className="panel p-12 flex flex-col items-center text-center">
        <ShieldCheck size={40} style={{ color: 'var(--color-text-muted)' }} className="mb-4" />
        <div className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          No Active Session
        </div>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          Run a scenario in the Security Lab and receive access to start a session.
        </p>
        <button
          onClick={() => navigate('/lab')}
          className="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          <ArrowRight size={14} />
          Go to Security Lab
        </button>
      </div>
    </div>
  );
}
