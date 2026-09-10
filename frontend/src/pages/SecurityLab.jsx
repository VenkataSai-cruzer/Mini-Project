/**
 * Security Lab — the main demo page.
 * Three scenario cards → animated analysis sequence → decision result.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, ShieldX,
  FlaskConical, RotateCcw, ArrowRight,
  User, Monitor, Globe, Hash, Database,
} from 'lucide-react';
import { useAuth }    from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import * as api       from '../services/api';
import CheckStep          from '../components/CheckStep';
import DecisionBanner     from '../components/DecisionBanner';
import RiskBreakdown      from '../components/RiskBreakdown';
import RiskBadge          from '../components/RiskBadge';
import VerificationModal  from '../components/VerificationModal';

// ─── Scenario definitions ─────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id:             'normal',
    label:          'Normal Access',
    tagline:        'Trusted user, registered device, standard resource.',
    icon:           ShieldCheck,
    accentColor:    '#22c55e',
    accentBg:       'rgba(34,197,94,0.08)',
    accentBorder:   'rgba(34,197,94,0.2)',
    expectedResult: 'LOW RISK — ACCESS GRANTED',
    payload: {
      deviceTrusted:  true,
      accessContext:  'normal',
      failedAttempts: 0,
      resourceId:     'resource-portal-001',
      deviceName:     'Student Laptop (Registered)',
    },
    contextSummary: [
      { icon: User,     label: 'User',            value: 'Demo Student' },
      { icon: Monitor,  label: 'Device',           value: 'Registered / Trusted' },
      { icon: Globe,    label: 'Access Context',   value: 'Normal' },
      { icon: Hash,     label: 'Failed Attempts',  value: '0' },
      { icon: Database, label: 'Resource',         value: 'Student Portal' },
    ],
  },
  {
    id:             'suspicious',
    label:          'Suspicious Access',
    tagline:        'Unknown device with repeated failed login attempts.',
    icon:           ShieldAlert,
    accentColor:    '#f59e0b',
    accentBg:       'rgba(245,158,11,0.08)',
    accentBorder:   'rgba(245,158,11,0.2)',
    expectedResult: 'MEDIUM RISK — STEP-UP VERIFICATION',
    payload: {
      deviceTrusted:  false,
      accessContext:  'normal',
      failedAttempts: 3,
      resourceId:     'resource-portal-001',
      deviceName:     'Unknown Device',
    },
    contextSummary: [
      { icon: User,     label: 'User',            value: 'Demo Student' },
      { icon: Monitor,  label: 'Device',           value: 'Unknown / Untrusted' },
      { icon: Globe,    label: 'Access Context',   value: 'Normal' },
      { icon: Hash,     label: 'Failed Attempts',  value: '3' },
      { icon: Database, label: 'Resource',         value: 'Student Portal' },
    ],
  },
  {
    id:             'high_risk',
    label:          'High-Risk Access',
    tagline:        'Multiple suspicious signals plus a sensitive resource.',
    icon:           ShieldX,
    accentColor:    '#ef4444',
    accentBg:       'rgba(239,68,68,0.08)',
    accentBorder:   'rgba(239,68,68,0.2)',
    expectedResult: 'HIGH RISK — ACCESS BLOCKED + INCIDENT',
    payload: {
      deviceTrusted:  false,
      accessContext:  'unusual',
      failedAttempts: 5,
      resourceId:     'resource-records-001',
      deviceName:     'Unknown Device',
    },
    contextSummary: [
      { icon: User,     label: 'User',            value: 'Demo Student' },
      { icon: Monitor,  label: 'Device',           value: 'Unknown / Untrusted' },
      { icon: Globe,    label: 'Access Context',   value: 'Unusual' },
      { icon: Hash,     label: 'Failed Attempts',  value: '5' },
      { icon: Database, label: 'Resource',         value: 'Sensitive Academic Records' },
    ],
  },
  {
    id:             'continuous',
    label:          'Continuous Verification',
    tagline:        'Granted session re-evaluated after a security context change.',
    icon:           ShieldAlert,
    accentColor:    '#a78bfa',
    accentBg:       'rgba(167,139,250,0.08)',
    accentBorder:   'rgba(167,139,250,0.2)',
    expectedResult: 'SESSION RE-EVALUATED — STEP-UP or BLOCKED',
    isContinuous:   true,  // This scenario uses the Active Session page
    payload: {
      deviceTrusted:  true,
      accessContext:  'normal',
      failedAttempts: 0,
      resourceId:     'resource-portal-001',
      deviceName:     'Student Laptop (Registered)',
    },
    contextSummary: [
      { icon: User,     label: 'User',            value: 'Demo Student' },
      { icon: Monitor,  label: 'Initial Device',   value: 'Registered / Trusted' },
      { icon: Globe,    label: 'Context Change',   value: 'Device → Unknown, Attempts +3' },
      { icon: Hash,     label: 'Re-eval Result',   value: 'MEDIUM RISK (score 45)' },
      { icon: Database, label: 'Resource',         value: 'Student Portal' },
    ],
  },
];

// Analysis steps — order matches the Zero Trust evaluation flow
const STEP_DEFS = [
  { id: 'identity', label: 'Identity Verification',   delay: 600  },
  { id: 'device',   label: 'Device Trust Check',       delay: 1100 },
  { id: 'context',  label: 'Access Context Analysis',  delay: 1600 },
  { id: 'attempts', label: 'Failed Attempt History',   delay: 2100 },
  { id: 'resource', label: 'Resource Sensitivity',     delay: 2600 },
  { id: 'risk',     label: 'Risk Engine Calculating',  delay: 3100 },
  { id: 'policy',   label: 'Policy Engine Decision',   delay: 3700 },
];

const PHASE = { SELECT: 'select', ANALYZING: 'analyzing', RESULT: 'result' };

// ─── Component ────────────────────────────────────────────────────────────────

export default function SecurityLab() {
  const { user }                = useAuth();
  const { startSession }        = useSession();
  const navigate                = useNavigate();

  const [phase,          setPhase]          = useState(PHASE.SELECT);
  const [activeScenario, setActiveScenario] = useState(null);
  const [stepStates,     setStepStates]     = useState({});  // stepId → 'pending'|'running'|'pass'|'warn'|'fail'
  const [result,         setResult]         = useState(null); // full API response
  const [apiError,       setApiError]       = useState('');
  const [showVerify,     setShowVerify]     = useState(false);

  const timersRef = useRef([]);

  // Clean up timers on unmount
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function addTimer(fn, delay) {
    timersRef.current.push(setTimeout(fn, delay));
  }

  // ── Start a scenario ────────────────────────────────────────────────────────
  async function runScenario(scenario) {
    // Scenario 4 (continuous) — grant access first, then go to Active Session
    // The re-evaluation is demonstrated on the Active Session page
    if (scenario.isContinuous) {
      clearTimers();
      setPhase(PHASE.ANALYZING);
      setActiveScenario(scenario);
      setResult(null);
      setApiError('');
      const initial = {};
      STEP_DEFS.forEach((s) => { initial[s.id] = 'pending'; });
      setStepStates(initial);

      let apiResult = null;
      try {
        apiResult = await api.evaluateAccess(scenario.payload);
      } catch (err) {
        setApiError(err.response?.data?.error || 'API error — is the backend running?');
        setPhase(PHASE.SELECT);
        return;
      }

      const checks = apiResult.policyResult.checks;
      function stateForCheck(check) {
        if (check.warning) return 'warn';
        return check.passed ? 'pass' : 'fail';
      }
      STEP_DEFS.forEach((stepDef) => {
        addTimer(() => setStepStates((prev) => ({ ...prev, [stepDef.id]: 'running' })), stepDef.delay);
        addTimer(() => {
          let state = 'pass';
          if (['identity', 'device', 'context', 'attempts', 'resource'].includes(stepDef.id)) {
            const check = checks.find((c) => c.id === stepDef.id);
            if (check) state = stateForCheck(check);
          }
          setStepStates((prev) => ({ ...prev, [stepDef.id]: state }));
        }, stepDef.delay + 420);
      });

      const finalDelay = STEP_DEFS[STEP_DEFS.length - 1].delay + 600;
      addTimer(() => {
        setResult(apiResult);
        setPhase(PHASE.RESULT);
      }, finalDelay);
      return;
    }
    clearTimers();
    setPhase(PHASE.ANALYZING);
    setActiveScenario(scenario);
    setResult(null);
    setApiError('');

    // Initialise all steps as pending
    const initial = {};
    STEP_DEFS.forEach((s) => { initial[s.id] = 'pending'; });
    setStepStates(initial);

    // Fetch result from API immediately (runs in background)
    let apiResult = null;
    try {
      apiResult = await api.evaluateAccess(scenario.payload);
    } catch (err) {
      setApiError(err.response?.data?.error || 'API error — is the backend running?');
      setPhase(PHASE.SELECT);
      return;
    }

    const checks = apiResult.policyResult.checks; // [{id, passed, warning, note}]

    function stateForCheck(check) {
      if (check.warning) return 'warn';
      return check.passed ? 'pass' : 'fail';
    }

    // Animate each step in sequence
    STEP_DEFS.forEach((stepDef, i) => {
      // Mark as running
      addTimer(() => {
        setStepStates((prev) => ({ ...prev, [stepDef.id]: 'running' }));
      }, stepDef.delay);

      // Mark as complete (use check result for verification steps, 'pass' for engine steps)
      addTimer(() => {
        let state = 'pass';
        if (['identity', 'device', 'context', 'attempts', 'resource'].includes(stepDef.id)) {
          const check = checks.find((c) => c.id === stepDef.id);
          if (check) state = stateForCheck(check);
        }
        setStepStates((prev) => ({ ...prev, [stepDef.id]: state }));
      }, stepDef.delay + 420);
    });

    // Show final result after all animations finish
    const finalDelay = STEP_DEFS[STEP_DEFS.length - 1].delay + 600;
    addTimer(() => {
      setResult(apiResult);
      setPhase(PHASE.RESULT);
    }, finalDelay);
  }

  // ── After verification completes ────────────────────────────────────────────
  function handleVerificationSuccess() {
    setShowVerify(false);

    // Capture values from current result BEFORE any state mutations (avoids stale closure)
    const scenario        = activeScenario;
    const riskLevel       = result?.policyResult?.riskLevel || 'medium';
    const riskScore       = result?.policyResult?.riskScore || 0;
    const accessRequestId = result?.accessRequestId;
    const resourceName    = scenario?.contextSummary?.find((c) => c.label === 'Resource')?.value;

    // Update result display to show granted state
    setResult((prev) => ({
      ...prev,
      policyResult: { ...prev.policyResult, decision: 'granted' },
    }));

    // Start session with captured (non-stale) values
    startSession({
      user:            user,
      resource:        { id: scenario?.payload?.resourceId, name: resourceName },
      deviceTrusted:   scenario?.payload?.deviceTrusted,
      deviceName:      scenario?.payload?.deviceName,
      riskLevel,
      riskScore,
      decision:        'granted',
      accessRequestId,
    });
  }

  // ── Enter protected resource ────────────────────────────────────────────────
  function enterProtectedResource() {
    const scenario = activeScenario;
    startSession({
      user:          user,
      resource:      { id: scenario.payload.resourceId, name: scenario.contextSummary.find(c => c.label === 'Resource')?.value },
      deviceTrusted: scenario.payload.deviceTrusted,
      deviceName:    scenario.payload.deviceName,
      riskLevel:     result?.policyResult?.riskLevel || 'low',
      riskScore:     result?.policyResult?.riskScore || 0,
      decision:      'granted',
      accessRequestId: result?.accessRequestId,
    });
    navigate('/session');
  }

  function resetToSelect() {
    clearTimers();
    setPhase(PHASE.SELECT);
    setActiveScenario(null);
    setResult(null);
    setStepStates({});
    setApiError('');
    setShowVerify(false);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical size={16} style={{ color: 'var(--color-accent)' }} />
          <span className="label-tag text-xs" style={{ color: 'var(--color-accent)' }}>
            SECURITY SIMULATION LAB
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          ZTGuard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Adaptive Zero Trust Security Prototype — Educational Security Simulation
        </p>
      </div>

      {/* ── PHASE: SELECT ── */}
      {phase === PHASE.SELECT && (
        <ScenarioSelector onSelect={runScenario} error={apiError} />
      )}

      {/* ── PHASE: ANALYZING ── */}
      {phase === PHASE.ANALYZING && activeScenario && (
        <AnalysisView scenario={activeScenario} stepStates={stepStates} />
      )}

      {/* ── PHASE: RESULT ── */}
      {phase === PHASE.RESULT && result && activeScenario && (
        <ResultView
          scenario={activeScenario}
          result={result}
          onReset={resetToSelect}
          onEnterResource={enterProtectedResource}
          onVerify={() => setShowVerify(true)}
        />
      )}

      {/* OTP Verification Modal */}
      {showVerify && result && (
        <VerificationModal
          accessRequestId={result.accessRequestId}
          onSuccess={handleVerificationSuccess}
          onClose={() => setShowVerify(false)}
        />
      )}
    </div>
  );
}

// ─── Scenario selector ────────────────────────────────────────────────────────

function ScenarioSelector({ onSelect, error }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Select a scenario to begin the simulation
        </h2>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Each scenario pre-populates a distinct security context and runs the full Zero Trust evaluation pipeline.
        </p>
      </div>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {SCENARIOS.map((scenario, idx) => (
          <ScenarioCard key={scenario.id} scenario={scenario} index={idx + 1} onSelect={onSelect} />
        ))}
      </div>

      {/* Zero Trust flow diagram */}
      <ZeroTrustDiagram />
    </div>
  );
}

function ScenarioCard({ scenario, index, onSelect }) {
  const Icon = scenario.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(scenario)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-left p-5 rounded-lg transition-all duration-150"
      style={{
        background:   hovered ? scenario.accentBg : 'var(--color-bg-surface)',
        border:       `1px solid ${hovered ? scenario.accentBorder : 'var(--color-border)'}`,
        cursor:       'pointer',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="p-2 rounded"
          style={{ background: scenario.accentBg, color: scenario.accentColor }}
        >
          <Icon size={18} />
        </div>
        <span
          className="label-tag text-xs px-2 py-0.5 rounded"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          SCENARIO {index}
        </span>
      </div>

      <div className="font-semibold text-sm mb-1" style={{ color: scenario.accentColor }}>
        {scenario.label}
      </div>
      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {scenario.tagline}
      </div>
      {scenario.expectedResult && (
        <div
          className="mt-2 text-xs font-mono px-2 py-1 rounded"
          style={{
            color:      scenario.accentColor,
            background: scenario.accentBg,
            border:     `1px solid ${scenario.accentBorder}`,
          }}
        >
          Expected: {scenario.expectedResult}
        </div>
      )}

      <div
        className="mt-4 flex items-center gap-1 text-xs font-medium"
        style={{ color: hovered ? scenario.accentColor : 'var(--color-text-muted)' }}
      >
        Run simulation <ArrowRight size={12} />
      </div>
    </button>
  );
}

function ZeroTrustDiagram() {
  const steps = [
    'User Login',
    'Identity Verification',
    'Device Trust',
    'Context Analysis',
    'Risk Analysis',
    'Policy Engine',
    'Decision',
  ];

  return (
    <div className="panel p-5">
      <div className="text-xs font-semibold mb-4" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
        ZERO TRUST EVALUATION PIPELINE
      </div>
      <div className="flex items-center flex-wrap gap-2">
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <span
              className="text-xs px-2.5 py-1 rounded"
              style={{
                background: 'var(--color-bg-elevated)',
                border:     '1px solid var(--color-border)',
                color:      'var(--color-text-secondary)',
              }}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <span style={{ color: 'var(--color-text-muted)' }}>→</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
        Zero Trust principle: <em>"Never trust automatically. Continuously verify and evaluate risk."</em>
      </p>
    </div>
  );
}

// ─── Analysis view ────────────────────────────────────────────────────────────

function AnalysisView({ scenario, stepStates }) {
  const Icon = scenario.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Left — context panel */}
      <div className="panel p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded" style={{ background: scenario.accentBg, color: scenario.accentColor }}>
            <Icon size={18} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {scenario.label}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Simulated security context
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {scenario.contextSummary.map(({ icon: CIcon, label, value }) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                <CIcon size={13} />
                {label}
              </div>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — step progress */}
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
            EVALUATING ACCESS REQUEST
          </div>
          <div
            className="pulse-dot inline-block w-2 h-2 rounded-full"
            style={{ background: scenario.accentColor }}
          />
        </div>

        <div className="space-y-0">
          {STEP_DEFS.map((step) => (
            <CheckStep
              key={step.id}
              label={step.label}
              note=""
              state={stepStates[step.id] || 'pending'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Result view ──────────────────────────────────────────────────────────────

function ResultView({ scenario, result, onReset, onEnterResource, onVerify }) {
  const { policyResult, incident } = result;
  const Icon = scenario.icon;

  const isGranted  = policyResult.decision === 'granted';
  const isVerify   = policyResult.decision === 'verification_required';
  const isBlocked  = policyResult.decision === 'blocked';

  return (
    <div className="space-y-5">

      {/* Scenario label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded" style={{ background: scenario.accentBg, color: scenario.accentColor }}>
            <Icon size={15} />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {scenario.label}
          </span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
          style={{
            color:   'var(--color-text-secondary)',
            border:  '1px solid var(--color-border)',
          }}
        >
          <RotateCcw size={12} /> Run Again
        </button>
      </div>

      {/* Main decision banner */}
      <DecisionBanner
        decision={policyResult.decision}
        riskLevel={policyResult.riskLevel}
        riskScore={policyResult.riskScore}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Verification checks */}
        <div className="panel p-5">
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
            VERIFICATION CHECKS
          </div>
          <div className="space-y-0">
            {policyResult.checks.map((check) => {
              let state = 'pass';
              if (!check.passed && check.warning) state = 'warn';
              else if (!check.passed) state = 'fail';
              return (
                <CheckStep
                  key={check.id}
                  label={check.label}
                  note={check.note}
                  state={state}
                />
              );
            })}
          </div>
        </div>

        {/* Risk breakdown */}
        <div className="space-y-3">
          <RiskBreakdown
            appliedFactors={policyResult.appliedFactors}
            clearedFactors={policyResult.clearedFactors}
            riskScore={policyResult.riskScore}
            riskLevel={policyResult.riskLevel}
          />

          {/* Incident reference */}
          {incident && (
            <div
              className="panel p-4 text-xs"
              style={{ borderColor: 'rgba(239,68,68,0.3)' }}
            >
              <div className="font-semibold mb-1" style={{ color: '#ef4444' }}>
                Security Incident Created
              </div>
              <div style={{ color: 'var(--color-text-secondary)' }}>
                Incident <span className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>{incident.code}</span> has been
                logged in the SOC Incident Center for review.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {isGranted && (
          <button
            onClick={onEnterResource}
            className="flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: '#22c55e', color: '#000' }}
          >
            <ArrowRight size={15} />
            {activeScenario?.isContinuous ? 'Go to Active Session (Simulate Context Change)' : 'Enter Student Resource'}
          </button>
        )}

        {isVerify && (
          <button
            onClick={onVerify}
            className="flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: '#f59e0b', color: '#000' }}
          >
            Complete Verification
          </button>
        )}

        {isBlocked && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded text-sm"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444',
            }}
          >
            Access denied by Zero Trust Policy Engine. View incident in SOC Center.
          </div>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded transition-colors"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
        >
          <RotateCcw size={13} /> Run Another Scenario
        </button>
      </div>

      {/* Incident detail panel for HIGH risk */}
      {isBlocked && (
        <IncidentDetailPanel result={result} scenario={scenario} />
      )}
    </div>
  );
}

function IncidentDetailPanel({ result, scenario }) {
  const { policyResult, incident } = result;

  return (
    <div
      className="panel p-6"
      style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="label-tag text-xs px-2 py-0.5 rounded badge-high">
              SECURITY INCIDENT DETECTED
            </span>
          </div>
          <div className="font-bold text-base mt-2" style={{ color: '#ef4444' }}>
            High-Risk Access Attempt Blocked
          </div>
        </div>
        {incident && (
          <div className="text-right">
            <div className="font-mono font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {incident.code}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Incident ID
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Severity',  value: 'HIGH',    color: '#ef4444' },
          { label: 'Status',    value: 'OPEN',     color: '#ef4444' },
          { label: 'Decision',  value: 'BLOCKED',  color: '#ef4444' },
          { label: 'Risk Score', value: `${policyResult.riskScore}/100`, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="panel-elevated p-3 rounded-lg">
            <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
            <div className="font-bold text-sm" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
          REASONS FOR BLOCK
        </div>
        <ul className="space-y-1">
          {policyResult.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span style={{ color: '#ef4444' }}>✕</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="p-3 rounded text-xs"
        style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Recommended Action: </span>
        <span style={{ color: 'var(--color-text-secondary)' }}>{policyResult.recommendedAction}</span>
      </div>
    </div>
  );
}
