/**
 * Quick self-test for the Risk and Policy engines.
 * Run with: node src/engines/engineTest.js
 */

const { analyzeRisk } = require('./riskEngine');
const { evaluate }    = require('./policyEngine');

function assert(label, actual, expected) {
  if (actual !== expected) {
    console.error(`  ✗ FAIL [${label}]: expected "${expected}", got "${actual}"`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ PASS [${label}]`);
  }
}

console.log('\n─── Risk Engine Tests ───────────────────────────────');

// Scenario 1 – Normal access → LOW
const s1 = analyzeRisk({ deviceTrusted: true, accessContext: 'normal', failedAttempts: 0, resourceSensitivity: 'normal' });
assert('S1 score',      s1.score,     0);
assert('S1 riskLevel',  s1.riskLevel, 'low');

// Scenario 2 – Suspicious → MEDIUM
const s2 = analyzeRisk({ deviceTrusted: false, accessContext: 'normal', failedAttempts: 3, resourceSensitivity: 'normal' });
assert('S2 score',      s2.score,     45);   // 25 + 20
assert('S2 riskLevel',  s2.riskLevel, 'medium');

// Scenario 3 – High risk → HIGH
const s3 = analyzeRisk({ deviceTrusted: false, accessContext: 'unusual', failedAttempts: 5, resourceSensitivity: 'sensitive' });
assert('S3 score',      s3.score,     95);   // 25 + 20 + 30 + 20 = 95
assert('S3 riskLevel',  s3.riskLevel, 'high');

// Edge – score capped at 100
const s4 = analyzeRisk({ deviceTrusted: false, accessContext: 'unusual', failedAttempts: 5, resourceSensitivity: 'sensitive' });
assert('Score cap',     s4.score <= 100, true);

console.log('\n─── Policy Engine Tests ─────────────────────────────');

const base = { identityVerified: true, userName: 'Test', userRole: 'student', deviceName: 'PC' };

const p1 = evaluate({ ...base, deviceTrusted: true,  accessContext: 'normal',  failedAttempts: 0, resourceName: 'Portal', resourceSensitivity: 'normal' });
assert('P1 decision',   p1.decision,   'granted');
assert('P1 riskLevel',  p1.riskLevel,  'low');

const p2 = evaluate({ ...base, deviceTrusted: false, accessContext: 'normal',  failedAttempts: 3, resourceName: 'Portal', resourceSensitivity: 'normal' });
assert('P2 decision',   p2.decision,   'verification_required');
assert('P2 riskLevel',  p2.riskLevel,  'medium');

const p3 = evaluate({ ...base, deviceTrusted: false, accessContext: 'unusual', failedAttempts: 5, resourceName: 'Records', resourceSensitivity: 'sensitive' });
assert('P3 decision',   p3.decision,   'blocked');
assert('P3 riskLevel',  p3.riskLevel,  'high');
assert('P3 incident',   p3.requiresIncident, true);

// Identity failure → always blocked
const p4 = evaluate({ ...base, identityVerified: false, deviceTrusted: true, accessContext: 'normal', failedAttempts: 0, resourceName: 'Portal', resourceSensitivity: 'normal' });
assert('P4 identity block', p4.decision, 'blocked');

console.log('\n─── All tests complete ──────────────────────────────\n');
