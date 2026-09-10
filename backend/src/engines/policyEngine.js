/**
 * ZTGuard Zero Trust Policy Engine
 *
 * Receives the full access context + risk assessment and returns a
 * structured policy decision.  This is the single authoritative point
 * that translates risk scores into access outcomes.
 *
 * Zero Trust principle: "Never trust automatically. Continuously verify."
 *
 * Decision matrix:
 *   risk LOW    (0-30)   → ACCESS GRANTED
 *   risk MEDIUM (31-60)  → ADDITIONAL VERIFICATION REQUIRED
 *   risk HIGH   (61-100) → ACCESS BLOCKED  + incident flagged
 */

const { analyzeRisk, DECISIONS } = require('./riskEngine');

/**
 * Evaluate an access request through the Zero Trust policy engine.
 *
 * @param {PolicyInput} input
 * @param {string}  input.userName           - display name of the requesting user
 * @param {string}  input.userRole           - role of the user (e.g. 'student')
 * @param {boolean} input.identityVerified   - was the identity check successful?
 * @param {boolean} input.deviceTrusted      - is the device registered/trusted?
 * @param {string}  input.deviceName         - descriptive name of the device
 * @param {string}  input.accessContext      - 'normal' | 'unusual'
 * @param {number}  input.failedAttempts     - recent failed login count
 * @param {string}  input.resourceName       - name of the resource being accessed
 * @param {string}  input.resourceSensitivity - 'normal' | 'sensitive'
 *
 * @returns {PolicyDecision}
 */
function evaluate(input) {
  const {
    userName,
    userRole,
    identityVerified,
    deviceTrusted,
    deviceName,
    accessContext,
    failedAttempts,
    resourceName,
    resourceSensitivity,
  } = input;

  // ── Step 1: Identity check ────────────────────────────────────────────────
  // Identity must be verified before any other evaluation proceeds.
  if (!identityVerified) {
    return buildDecision('blocked', input, null, [
      { check: 'identity', passed: false, label: 'Identity could not be verified' },
    ]);
  }

  // ── Step 2: Run risk analysis engine ─────────────────────────────────────
  const riskAssessment = analyzeRisk({
    deviceTrusted,
    accessContext,
    failedAttempts,
    resourceSensitivity,
  });

  // ── Step 3: Build verification checks for display ────────────────────────
  const checks = buildChecks(input, riskAssessment);

  // ── Step 4: Map risk level to policy decision ─────────────────────────────
  const decision = DECISIONS[riskAssessment.riskLevel.toUpperCase()];

  // ── Step 5: Build reasons list ────────────────────────────────────────────
  const reasons = buildReasons(input, riskAssessment);

  // ── Step 6: Determine recommended action ─────────────────────────────────
  const recommendedAction = buildRecommendedAction(decision, riskAssessment.riskLevel);

  return {
    decision,                       // 'granted' | 'verification_required' | 'blocked'
    riskLevel:  riskAssessment.riskLevel,  // 'low' | 'medium' | 'high'
    riskScore:  riskAssessment.score,
    appliedFactors: riskAssessment.appliedFactors,
    clearedFactors: riskAssessment.clearedFactors,
    checks,
    reasons,
    recommendedAction,
    requiresIncident: riskAssessment.riskLevel === 'high' || decision === 'blocked',
    requiresVerification: decision === 'verification_required',
    // Context echo — useful for audit records
    context: {
      userName,
      userRole,
      deviceName,
      deviceTrusted,
      accessContext,
      failedAttempts,
      resourceName,
      resourceSensitivity,
    },
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Build the step-by-step verification check list shown in the UI.
 */
function buildChecks(input, riskAssessment) {
  const { identityVerified, deviceTrusted, accessContext, failedAttempts, resourceSensitivity } = input;
  const appliedKeys = new Set(riskAssessment.appliedFactors.map((f) => f.key));

  return [
    {
      id:     'identity',
      label:  'Identity Verification',
      passed: identityVerified,
      note:   identityVerified ? 'Identity confirmed' : 'Could not verify identity',
    },
    {
      id:     'device',
      label:  'Device Trust Check',
      passed: deviceTrusted,
      note:   deviceTrusted
        ? `Device registered and trusted`
        : `Unknown or unregistered device detected`,
    },
    {
      id:     'context',
      label:  'Access Context Analysis',
      passed: accessContext === 'normal',
      note:   accessContext === 'normal'
        ? 'Normal access context'
        : 'Unusual access context detected',
    },
    {
      id:     'attempts',
      label:  'Failed Attempt History',
      passed: failedAttempts === 0,
      warning: failedAttempts >= 3 && failedAttempts < 5,
      note:   failedAttempts === 0
        ? 'No failed login attempts'
        : `${failedAttempts} failed attempt${failedAttempts > 1 ? 's' : ''} detected`,
    },
    {
      id:     'resource',
      label:  'Resource Sensitivity',
      passed: resourceSensitivity === 'normal',
      warning: false,
      note:   resourceSensitivity === 'normal'
        ? 'Standard resource — no elevated clearance needed'
        : 'Sensitive resource — elevated scrutiny applied',
    },
  ];
}

/**
 * Build human-readable reasons for the decision (shown in incident reports).
 */
function buildReasons(input, riskAssessment) {
  const reasons = [];

  riskAssessment.appliedFactors.forEach((factor) => {
    switch (factor.key) {
      case 'unknown_device':
        reasons.push('Device is not registered or trusted');
        break;
      case 'unusual_context':
        reasons.push('Unusual access context detected');
        break;
      case 'failed_attempts_3':
        reasons.push(`Multiple failed login attempts (${input.failedAttempts})`);
        break;
      case 'failed_attempts_5':
        reasons.push(`High number of failed login attempts (${input.failedAttempts})`);
        break;
      case 'sensitive_resource':
        reasons.push('Sensitive resource access requested');
        break;
    }
  });

  return reasons;
}

/**
 * Return a plain-language recommended action based on the decision.
 */
function buildRecommendedAction(decision, riskLevel) {
  switch (decision) {
    case 'granted':
      return 'No action required. Continue monitoring session activity.';
    case 'verification_required':
      return 'Require the user to complete additional identity verification before granting access.';
    case 'blocked':
      return 'Investigate the access attempt and verify the user identity before allowing further access. Consider locking the account pending review.';
    default:
      return 'Review the access request manually.';
  }
}

function buildDecision(decision, input, riskAssessment, checks) {
  return {
    decision,
    riskLevel:  'high',
    riskScore:  100,
    appliedFactors: [],
    clearedFactors: [],
    checks:     checks || [],
    reasons:    ['Identity verification failed'],
    recommendedAction: 'Verify user credentials and re-attempt authentication.',
    requiresIncident: true,
    requiresVerification: false,
    context: {
      userName:            input.userName,
      userRole:            input.userRole,
      deviceName:          input.deviceName,
      deviceTrusted:       input.deviceTrusted,
      accessContext:       input.accessContext,
      failedAttempts:      input.failedAttempts,
      resourceName:        input.resourceName,
      resourceSensitivity: input.resourceSensitivity,
    },
  };
}

module.exports = { evaluate };
