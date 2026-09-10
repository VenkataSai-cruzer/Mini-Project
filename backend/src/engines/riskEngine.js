/**
 * ZTGuard Risk Analysis Engine
 *
 * Calculates a numeric risk score from security context signals.
 * Each factor contributes a defined point value. The score is capped at 100.
 *
 * Scoring table:
 *   Unknown / untrusted device          +25
 *   Unusual access context              +20
 *   3–4 failed login attempts           +20
 *   5+ failed login attempts            +30  (replaces the 3–4 rule)
 *   Sensitive resource requested        +20
 *   Trusted device / normal context /
 *   zero failed attempts / normal res.  +0
 */

const RISK_FACTORS = {
  UNKNOWN_DEVICE:       { key: 'unknown_device',       label: 'Unknown / Untrusted Device',   points: 25 },
  UNUSUAL_CONTEXT:      { key: 'unusual_context',       label: 'Unusual Access Context',       points: 20 },
  FAILED_ATTEMPTS_3:    { key: 'failed_attempts_3',     label: 'Multiple Failed Attempts (3+)', points: 20 },
  FAILED_ATTEMPTS_5:    { key: 'failed_attempts_5',     label: 'High Failed Attempts (5+)',    points: 30 },
  SENSITIVE_RESOURCE:   { key: 'sensitive_resource',    label: 'Sensitive Resource Requested', points: 20 },
};

const RISK_THRESHOLDS = {
  LOW:    { min: 0,  max: 30,  label: 'LOW' },
  MEDIUM: { min: 31, max: 60,  label: 'MEDIUM' },
  HIGH:   { min: 61, max: 100, label: 'HIGH' },
};

const DECISIONS = {
  LOW:    'granted',
  MEDIUM: 'verification_required',
  HIGH:   'blocked',
};

/**
 * Evaluate security context and return a full risk assessment.
 *
 * @param {object} context
 * @param {boolean} context.deviceTrusted       - true if device is registered/trusted
 * @param {string}  context.accessContext       - 'normal' | 'unusual'
 * @param {number}  context.failedAttempts      - count of recent failed login attempts
 * @param {string}  context.resourceSensitivity - 'normal' | 'sensitive'
 *
 * @returns {RiskAssessment}
 */
function analyzeRisk(context) {
  const { deviceTrusted, accessContext, failedAttempts, resourceSensitivity } = context;

  const appliedFactors = [];
  let score = 0;

  // ── Factor: Device trust ──────────────────────────────────────────────────
  if (!deviceTrusted) {
    appliedFactors.push({ ...RISK_FACTORS.UNKNOWN_DEVICE });
    score += RISK_FACTORS.UNKNOWN_DEVICE.points;
  }

  // ── Factor: Access context ────────────────────────────────────────────────
  if (accessContext === 'unusual') {
    appliedFactors.push({ ...RISK_FACTORS.UNUSUAL_CONTEXT });
    score += RISK_FACTORS.UNUSUAL_CONTEXT.points;
  }

  // ── Factor: Failed attempts (5+ supersedes 3+) ───────────────────────────
  if (failedAttempts >= 5) {
    appliedFactors.push({ ...RISK_FACTORS.FAILED_ATTEMPTS_5 });
    score += RISK_FACTORS.FAILED_ATTEMPTS_5.points;
  } else if (failedAttempts >= 3) {
    appliedFactors.push({ ...RISK_FACTORS.FAILED_ATTEMPTS_3 });
    score += RISK_FACTORS.FAILED_ATTEMPTS_3.points;
  }

  // ── Factor: Resource sensitivity ─────────────────────────────────────────
  if (resourceSensitivity === 'sensitive') {
    appliedFactors.push({ ...RISK_FACTORS.SENSITIVE_RESOURCE });
    score += RISK_FACTORS.SENSITIVE_RESOURCE.points;
  }

  // ── Cap score ─────────────────────────────────────────────────────────────
  score = Math.min(score, 100);

  // ── Determine risk level ──────────────────────────────────────────────────
  let riskLevel;
  if (score <= RISK_THRESHOLDS.LOW.max) {
    riskLevel = 'low';
  } else if (score <= RISK_THRESHOLDS.MEDIUM.max) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    score,
    riskLevel,
    appliedFactors,
    // Factors that were evaluated but did NOT apply (for transparency)
    clearedFactors: buildClearedFactors(context, appliedFactors),
  };
}

/**
 * Build a list of checks that passed cleanly (no risk contribution).
 */
function buildClearedFactors(context, appliedFactors) {
  const cleared = [];
  const appliedKeys = new Set(appliedFactors.map((f) => f.key));

  if (!appliedKeys.has(RISK_FACTORS.UNKNOWN_DEVICE.key)) {
    cleared.push({ key: 'trusted_device', label: 'Device Registered & Trusted' });
  }
  if (!appliedKeys.has(RISK_FACTORS.UNUSUAL_CONTEXT.key)) {
    cleared.push({ key: 'normal_context', label: 'Normal Access Context' });
  }
  if (
    !appliedKeys.has(RISK_FACTORS.FAILED_ATTEMPTS_3.key) &&
    !appliedKeys.has(RISK_FACTORS.FAILED_ATTEMPTS_5.key)
  ) {
    cleared.push({ key: 'no_failed_attempts', label: 'No Failed Login Attempts' });
  }
  if (!appliedKeys.has(RISK_FACTORS.SENSITIVE_RESOURCE.key)) {
    cleared.push({ key: 'normal_resource', label: 'Standard Resource Request' });
  }

  return cleared;
}

module.exports = {
  analyzeRisk,
  RISK_FACTORS,
  RISK_THRESHOLDS,
  DECISIONS,
};
