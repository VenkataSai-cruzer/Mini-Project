/**
 * Access Request controller.
 *
 * Handles the full Zero Trust access evaluation flow:
 *   1. Receive scenario context
 *   2. Resolve device + resource from store
 *   3. Run Policy Engine
 *   4. Persist access request
 *   5. Create security events
 *   6. Create incident if HIGH risk
 *   7. Return full decision to frontend
 */

const store        = require('../database/memoryStore');
const { evaluate } = require('../engines/policyEngine');

/**
 * POST /api/access/evaluate
 *
 * Body:
 *   scenarioType      : 'normal' | 'suspicious' | 'high_risk'
 *   deviceTrusted     : boolean
 *   accessContext     : 'normal' | 'unusual'
 *   failedAttempts    : number
 *   resourceId        : string  (store resource ID)
 *   deviceName        : string  (descriptive device name for display)
 */
async function evaluateAccess(req, res) {
  try {
    const userId = req.user.id;
    const user   = store.findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const {
      deviceTrusted,
      accessContext,
      failedAttempts,
      resourceId,
      deviceName,
    } = req.body;

    // Resolve resource
    const resource = store.findResourceById(resourceId);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    // ── Run policy engine ──────────────────────────────────────────────────
    const policyResult = evaluate({
      userName:            user.name,
      userRole:            user.role,
      identityVerified:    true,
      deviceTrusted:       Boolean(deviceTrusted),
      deviceName:          deviceName || (deviceTrusted ? 'Registered Laptop' : 'Unknown Device'),
      accessContext:       accessContext || 'normal',
      failedAttempts:      Number(failedAttempts) || 0,
      resourceName:        resource.name,
      resourceSensitivity: resource.sensitivity_level,
    });

    // ── Persist access request ─────────────────────────────────────────────
    const accessRequest = store.createAccessRequest({
      user_id:         userId,
      device_id:       deviceTrusted ? store.TRUSTED_DEVICE_ID : null,
      resource_id:     resource.id,
      context_type:    accessContext || 'normal',
      failed_attempts: Number(failedAttempts) || 0,
      risk_score:      policyResult.riskScore,
      risk_level:      policyResult.riskLevel,
      decision:        policyResult.decision,
      risk_factors:    policyResult.appliedFactors,
    });

    // ── Create security event ─────────────────────────────────────────────
    store.createSecurityEvent({
      event_type: 'Access Request Evaluated',
      user_id:    userId,
      risk_level: policyResult.riskLevel,
      details:    `Access to "${resource.name}" evaluated. Decision: ${policyResult.decision}. Score: ${policyResult.riskScore}`,
      metadata:   {
        resource:   resource.name,
        decision:   policyResult.decision,
        riskScore:  policyResult.riskScore,
        riskLevel:  policyResult.riskLevel,
      },
    });

    // ── Emit decision-specific events ─────────────────────────────────────
    if (policyResult.decision === 'granted') {
      store.createSecurityEvent({
        event_type: 'Access Granted',
        user_id:    userId,
        risk_level: 'low',
        details:    `${user.name} was granted access to "${resource.name}"`,
        metadata:   { resource: resource.name },
      });
    }

    if (policyResult.decision === 'verification_required') {
      store.createSecurityEvent({
        event_type: 'Additional Verification Required',
        user_id:    userId,
        risk_level: 'medium',
        details:    `Access to "${resource.name}" requires additional verification. ${policyResult.reasons.join('. ')}`,
        metadata:   { resource: resource.name, reasons: policyResult.reasons },
      });
    }

    if (policyResult.decision === 'blocked') {
      store.createSecurityEvent({
        event_type: 'Access Blocked',
        user_id:    userId,
        risk_level: 'high',
        details:    `Access to "${resource.name}" was blocked. Reasons: ${policyResult.reasons.join(', ')}`,
        metadata:   { resource: resource.name, reasons: policyResult.reasons },
      });
    }

    // ── Create incident for HIGH risk ─────────────────────────────────────
    let incident = null;
    if (policyResult.requiresIncident) {
      incident = store.createIncident({
        user_id:            userId,
        resource_id:        resource.id,
        access_request_id:  accessRequest.id,
        severity:           policyResult.riskLevel === 'high' ? 'high' : 'medium',
        risk_score:         policyResult.riskScore,
        decision:           policyResult.decision,
        reasons:            policyResult.reasons,
        recommended_action: policyResult.recommendedAction,
      });

      // Seed initial timeline entry
      store.addTimelineEntry({
        incident_id: incident.id,
        action:      'Incident Created',
        description: `Security incident automatically created by ZTGuard policy engine. Risk score: ${policyResult.riskScore}. Decision: ${policyResult.decision}.`,
        actor:       'ZTGuard Policy Engine',
      });

      store.createSecurityEvent({
        event_type: 'Security Incident Created',
        user_id:    userId,
        risk_level: policyResult.riskLevel,
        details:    `Incident ${incident.incident_code} created for ${user.name} — ${resource.name}`,
        metadata:   { incident_code: incident.incident_code, incident_id: incident.id },
      });
    }

    return res.json({
      accessRequestId: accessRequest.id,
      policyResult,
      incident: incident ? { id: incident.id, code: incident.incident_code } : null,
    });

  } catch (err) {
    console.error('[AccessController] Error:', err);
    return res.status(500).json({ error: 'Internal server error during access evaluation' });
  }
}

/**
 * POST /api/access/verify
 * Validates the demo OTP and records verification success.
 */
async function verifyOtp(req, res) {
  try {
    const { code, accessRequestId } = req.body;
    const userId = req.user.id;
    const user   = store.findUserById(userId);

    // Demo OTP is always 123456
    if (code !== '123456') {
      store.createSecurityEvent({
        event_type: 'Verification Failed',
        user_id:    userId,
        risk_level: 'medium',
        details:    'Incorrect verification code entered',
        metadata:   {},
      });
      return res.status(400).json({ success: false, error: 'Incorrect verification code' });
    }

    store.createSecurityEvent({
      event_type: 'Additional Verification Successful',
      user_id:    userId,
      risk_level: 'medium',
      details:    `${user ? user.name : 'User'} completed additional verification successfully`,
      metadata:   { accessRequestId },
    });

    store.createSecurityEvent({
      event_type: 'Access Granted',
      user_id:    userId,
      risk_level: 'medium',
      details:    'Access granted after successful additional verification',
      metadata:   { accessRequestId },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('[AccessController] OTP error:', err);
    return res.status(500).json({ error: 'Verification error' });
  }
}

/**
 * POST /api/access/revaluate
 * Re-evaluates an active session when context changes.
 */
async function revaluateSession(req, res) {
  try {
    const userId = req.user.id;
    const user   = store.findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { deviceTrusted, failedAttempts, resourceId } = req.body;

    const resource = store.findResourceById(resourceId || store.RESOURCE_PORTAL_ID);

    const policyResult = evaluate({
      userName:            user.name,
      userRole:            user.role,
      identityVerified:    true,
      deviceTrusted:       Boolean(deviceTrusted),
      deviceName:          deviceTrusted ? 'Registered Laptop' : 'Unknown Device',
      accessContext:       'normal',
      failedAttempts:      Number(failedAttempts) || 0,
      resourceName:        resource ? resource.name : 'Student Portal',
      resourceSensitivity: resource ? resource.sensitivity_level : 'normal',
    });

    store.createSecurityEvent({
      event_type: 'Session Re-evaluated',
      user_id:    userId,
      risk_level: policyResult.riskLevel,
      details:    `Active session re-evaluated. New risk score: ${policyResult.riskScore}. Decision: ${policyResult.decision}.`,
      metadata:   { riskScore: policyResult.riskScore, decision: policyResult.decision },
    });

    // Create incident if context change produced a HIGH result
    let incident = null;
    if (policyResult.requiresIncident) {
      incident = store.createIncident({
        user_id:            userId,
        resource_id:        resource ? resource.id : null,
        severity:           'medium',
        risk_score:         policyResult.riskScore,
        decision:           policyResult.decision,
        reasons:            policyResult.reasons,
        recommended_action: 'Session context change detected. Re-verify user before continuing access.',
      });

      store.addTimelineEntry({
        incident_id: incident.id,
        action:      'Incident Created',
        description: 'Incident triggered by session context change during active session.',
        actor:       'ZTGuard Policy Engine',
      });
    }

    return res.json({ policyResult, incident: incident ? { id: incident.id, code: incident.incident_code } : null });

  } catch (err) {
    console.error('[AccessController] Re-evaluate error:', err);
    return res.status(500).json({ error: 'Session re-evaluation failed' });
  }
}

/**
 * GET /api/access/resources
 * Returns all available resources (for scenario setup).
 */
function getResources(req, res) {
  const resources = store.getAllResources();
  return res.json(resources);
}

module.exports = { evaluateAccess, verifyOtp, revaluateSession, getResources };
