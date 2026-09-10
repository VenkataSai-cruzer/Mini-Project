/**
 * In-memory data store for demo / no-PostgreSQL environments.
 * Mirrors the PostgreSQL schema exactly so all controllers work unchanged.
 *
 * EXTENDED: additional users (faculty, admin, analyst), additional resources
 * with broader sensitivity levels, dashboard stats function, closed incident status.
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// ─── Seed IDs ─────────────────────────────────────────────────────────────────

const DEMO_USER_ID        = 'user-demo-001';
const TRUSTED_DEVICE_ID   = 'device-trusted-001';
const RESOURCE_PORTAL_ID  = 'resource-portal-001';
const RESOURCE_RECORDS_ID = 'resource-records-001';

// Additional resource IDs
const RESOURCE_PUBLIC_ID   = 'resource-public-001';
const RESOURCE_FACULTY_ID  = 'resource-faculty-001';

// ─── Static seed data ────────────────────────────────────────────────────────

const users = [
  {
    id:            DEMO_USER_ID,
    name:          'Demo Student',
    email:         'demo@ztguard.edu',
    password_hash: bcrypt.hashSync('ZTGuard2024!', 10),
    role:          'student',
    created_at:    new Date().toISOString(),
  },
  {
    id:            'user-faculty-001',
    name:          'Dr. Faculty',
    email:         'faculty@ztguard.edu',
    password_hash: bcrypt.hashSync('Faculty2024!', 10),
    role:          'faculty',
    created_at:    new Date().toISOString(),
  },
  {
    id:            'user-admin-001',
    name:          'System Admin',
    email:         'admin@ztguard.edu',
    password_hash: bcrypt.hashSync('Admin2024!', 10),
    role:          'administrator',
    created_at:    new Date().toISOString(),
  },
  {
    id:            'user-analyst-001',
    name:          'Security Analyst',
    email:         'analyst@ztguard.edu',
    password_hash: bcrypt.hashSync('Analyst2024!', 10),
    role:          'security_analyst',
    created_at:    new Date().toISOString(),
  },
];

const devices = [
  {
    id:            TRUSTED_DEVICE_ID,
    user_id:       DEMO_USER_ID,
    device_name:   'Student Laptop (Registered)',
    device_status: 'registered',
    trust_level:   'trusted',
    last_seen:     new Date().toISOString(),
    created_at:    new Date().toISOString(),
  },
  {
    id:            'device-faculty-001',
    user_id:       'user-faculty-001',
    device_name:   'Faculty Workstation (Registered)',
    device_status: 'registered',
    trust_level:   'trusted',
    last_seen:     new Date().toISOString(),
    created_at:    new Date().toISOString(),
  },
];

const resources = [
  {
    id:                RESOURCE_PUBLIC_ID,
    name:              'Public Information',
    sensitivity_level: 'low',
    required_role:     'student',
    description:       'Publicly accessible campus information and announcements.',
    created_at:        new Date().toISOString(),
  },
  {
    id:                RESOURCE_PORTAL_ID,
    name:              'Student Portal',
    sensitivity_level: 'normal',
    required_role:     'student',
    description:       'Standard student course and schedule portal.',
    created_at:        new Date().toISOString(),
  },
  {
    id:                RESOURCE_FACULTY_ID,
    name:              'Faculty Resources',
    sensitivity_level: 'sensitive',
    required_role:     'faculty',
    description:       'Faculty-only grading system and academic resources.',
    created_at:        new Date().toISOString(),
  },
  {
    id:                RESOURCE_RECORDS_ID,
    name:              'Sensitive Academic Records',
    sensitivity_level: 'sensitive',
    required_role:     'student',
    description:       'Confidential academic transcripts and financial records.',
    created_at:        new Date().toISOString(),
  },
];

// Mutable collections populated at runtime
let access_requests    = [];
let security_events    = [];
let incidents          = [];
let incident_timeline  = [];

// ─── Incident counter ─────────────────────────────────────────────────────────
let incidentCounter = 1000;

function nextIncidentCode() {
  incidentCounter += 1;
  return `INC-${incidentCounter}`;
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString();
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ─── Users ────────────────────────────────────────────────────────────────────

function findUserByEmail(email) {
  return deepClone(users.find((u) => u.email === email) || null);
}

function findUserById(id) {
  return deepClone(users.find((u) => u.id === id) || null);
}

// ─── Devices ─────────────────────────────────────────────────────────────────

function findDeviceById(id) {
  return deepClone(devices.find((d) => d.id === id) || null);
}

function findDevicesByUserId(userId) {
  return deepClone(devices.filter((d) => d.user_id === userId));
}

function getTrustedDevice() {
  return deepClone(devices.find((d) => d.id === TRUSTED_DEVICE_ID));
}

// ─── Resources ───────────────────────────────────────────────────────────────

function findResourceById(id) {
  return deepClone(resources.find((r) => r.id === id) || null);
}

function getAllResources() {
  return deepClone(resources);
}

// ─── Access Requests ─────────────────────────────────────────────────────────

function createAccessRequest(data) {
  const record = {
    id:              uuidv4(),
    user_id:         data.user_id,
    device_id:       data.device_id || null,
    resource_id:     data.resource_id,
    context_type:    data.context_type || 'normal',
    failed_attempts: data.failed_attempts || 0,
    risk_score:      data.risk_score || 0,
    risk_level:      data.risk_level || 'low',
    decision:        data.decision || 'granted',
    risk_factors:    data.risk_factors || [],
    created_at:      now(),
  };
  access_requests.push(record);
  return deepClone(record);
}

function getAccessRequestsByUser(userId) {
  return deepClone(
    access_requests
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  );
}

// ─── Security Events ─────────────────────────────────────────────────────────

function createSecurityEvent(data) {
  const record = {
    id:         uuidv4(),
    event_type: data.event_type,
    user_id:    data.user_id || null,
    risk_level: data.risk_level || null,
    details:    data.details || '',
    metadata:   data.metadata || {},
    created_at: now(),
  };
  security_events.push(record);
  return deepClone(record);
}

function getAllSecurityEvents(filter = null) {
  let events = deepClone(security_events);
  if (filter && filter !== 'all') {
    // Support risk-level filters AND decision-based filters
    const decisionFilters = ['granted', 'blocked', 'step_up', 'incidents'];
    if (decisionFilters.includes(filter)) {
      if (filter === 'granted') {
        events = events.filter((e) =>
          e.event_type === 'Access Granted' ||
          e.event_type === 'Additional Verification Successful'
        );
      } else if (filter === 'blocked') {
        events = events.filter((e) => e.event_type === 'Access Blocked');
      } else if (filter === 'step_up') {
        events = events.filter((e) =>
          e.event_type === 'Additional Verification Required' ||
          e.event_type === 'Additional Verification Successful'
        );
      } else if (filter === 'incidents') {
        events = events.filter((e) =>
          e.event_type === 'Security Incident Created' ||
          e.event_type === 'Investigation Started' ||
          e.event_type === 'Incident Resolved' ||
          e.event_type === 'Incident Closed'
        );
      }
    } else {
      // Risk-level filter (existing behaviour)
      events = events.filter((e) => e.risk_level === filter);
    }
  }
  return events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// ─── Incidents ────────────────────────────────────────────────────────────────

function createIncident(data) {
  const record = {
    id:                  uuidv4(),
    incident_code:       nextIncidentCode(),
    user_id:             data.user_id || null,
    resource_id:         data.resource_id || null,
    access_request_id:   data.access_request_id || null,
    severity:            data.severity || 'high',
    risk_score:          data.risk_score || 0,
    status:              'open',
    decision:            data.decision || 'blocked',
    reasons:             data.reasons || [],
    recommended_action:  data.recommended_action || '',
    created_at:          now(),
    updated_at:          now(),
  };
  incidents.push(record);
  return deepClone(record);
}

function getAllIncidents() {
  const sorted = deepClone(incidents).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  // Enrich with user / resource names
  return sorted.map((inc) => {
    const user     = users.find((u) => u.id === inc.user_id);
    const resource = resources.find((r) => r.id === inc.resource_id);
    return {
      ...inc,
      user_name:     user ? user.name : 'Unknown',
      resource_name: resource ? resource.name : 'Unknown',
    };
  });
}

function findIncidentById(id) {
  const inc = incidents.find((i) => i.id === id);
  if (!inc) return null;
  const clone    = deepClone(inc);
  const user     = users.find((u) => u.id === inc.user_id);
  const resource = resources.find((r) => r.id === inc.resource_id);
  clone.user_name     = user ? user.name : 'Unknown';
  clone.resource_name = resource ? resource.name : 'Unknown';
  return clone;
}

function updateIncidentStatus(id, status) {
  const inc = incidents.find((i) => i.id === id);
  if (!inc) return null;
  inc.status     = status;
  inc.updated_at = now();
  return deepClone(inc);
}

// ─── Incident Timeline ────────────────────────────────────────────────────────

function addTimelineEntry(data) {
  const record = {
    id:          uuidv4(),
    incident_id: data.incident_id,
    action:      data.action,
    description: data.description || '',
    actor:       data.actor || 'system',
    created_at:  now(),
  };
  incident_timeline.push(record);
  return deepClone(record);
}

function getTimeline(incidentId) {
  return deepClone(
    incident_timeline
      .filter((t) => t.incident_id === incidentId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  );
}

// ─── Dashboard Statistics ─────────────────────────────────────────────────────

/**
 * Compute live dashboard statistics from the in-memory collections.
 * All numbers come from actual runtime data — nothing is hardcoded.
 */
function getDashboardStats() {
  const totalRequests = access_requests.length;

  const granted  = access_requests.filter((r) => r.decision === 'granted').length;
  const stepUp   = access_requests.filter((r) => r.decision === 'verification_required').length;
  const blocked  = access_requests.filter((r) => r.decision === 'blocked').length;

  const highRiskEvents = security_events.filter((e) => e.risk_level === 'high').length;

  const openIncidents        = incidents.filter((i) => i.status === 'open').length;
  const investigatingIncidents = incidents.filter((i) => i.status === 'investigating').length;
  const resolvedIncidents    = incidents.filter((i) => i.status === 'resolved').length;
  const closedIncidents      = incidents.filter((i) => i.status === 'closed').length;
  const totalIncidents       = incidents.length;

  // Recent 8 security events (newest first), enriched with user name
  const recentEvents = deepClone(security_events)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8)
    .map((e) => {
      const user = e.user_id ? users.find((u) => u.id === e.user_id) : null;
      return { ...e, user_name: user ? user.name : 'System' };
    });

  // Recent 5 access requests (newest first), enriched
  const recentRequests = deepClone(access_requests)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map((r) => {
      const user     = r.user_id   ? users.find((u) => u.id === r.user_id)     : null;
      const resource = r.resource_id ? resources.find((res) => res.id === r.resource_id) : null;
      return {
        ...r,
        user_name:     user     ? user.name     : 'Unknown',
        resource_name: resource ? resource.name : 'Unknown',
      };
    });

  // Overall security posture: PROTECTED if no open/investigating incidents and no recent high-risk events
  const recentHighRisk = security_events.filter((e) => {
    if (e.risk_level !== 'high') return false;
    const age = Date.now() - new Date(e.created_at).getTime();
    return age < 30 * 60 * 1000; // within last 30 minutes
  }).length;

  let securityStatus = 'PROTECTED';
  if (recentHighRisk > 0 || openIncidents > 0 || investigatingIncidents > 0) {
    securityStatus = 'ELEVATED';
  }
  if (recentHighRisk >= 3 || openIncidents >= 2) {
    securityStatus = 'CRITICAL';
  }

  return {
    securityStatus,
    access: {
      total:   totalRequests,
      granted,
      stepUp,
      blocked,
    },
    incidents: {
      total:        totalIncidents,
      open:         openIncidents,
      investigating: investigatingIncidents,
      resolved:     resolvedIncidents,
      closed:       closedIncidents,
    },
    highRiskEvents,
    recentEvents,
    recentRequests,
  };
}

// ─── Reset (for testing) ──────────────────────────────────────────────────────

function resetRuntimeData() {
  access_requests   = [];
  security_events   = [];
  incidents         = [];
  incident_timeline = [];
  incidentCounter   = 1000;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Seed IDs (exported so routes can reference them)
  DEMO_USER_ID,
  TRUSTED_DEVICE_ID,
  RESOURCE_PORTAL_ID,
  RESOURCE_RECORDS_ID,
  RESOURCE_PUBLIC_ID,
  RESOURCE_FACULTY_ID,

  // Users
  findUserByEmail,
  findUserById,

  // Devices
  findDeviceById,
  findDevicesByUserId,
  getTrustedDevice,

  // Resources
  findResourceById,
  getAllResources,

  // Access Requests
  createAccessRequest,
  getAccessRequestsByUser,

  // Security Events
  createSecurityEvent,
  getAllSecurityEvents,

  // Incidents
  createIncident,
  getAllIncidents,
  findIncidentById,
  updateIncidentStatus,

  // Incident Timeline
  addTimelineEntry,
  getTimeline,

  // Dashboard
  getDashboardStats,

  // Util
  resetRuntimeData,
};
