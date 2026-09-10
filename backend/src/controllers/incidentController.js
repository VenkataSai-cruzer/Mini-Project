/**
 * SOC Incident controller.
 * Handles incident listing, detail, and status transitions.
 * EXTENDED: supports 'closed' status (OPEN → INVESTIGATING → RESOLVED → CLOSED)
 */

const store = require('../database/memoryStore');

/** GET /api/incidents */
function getAll(req, res) {
  const incidents = store.getAllIncidents();
  return res.json(incidents);
}

/** GET /api/incidents/:id */
function getOne(req, res) {
  const incident = store.findIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  const timeline = store.getTimeline(incident.id);
  return res.json({ ...incident, timeline });
}

/**
 * PATCH /api/incidents/:id/status
 * Body: { status: 'investigating' | 'resolved' | 'closed' }
 * Enforces forward-only: open → investigating → resolved → closed
 */
function updateStatus(req, res) {
  const { status } = req.body;
  const validStatuses = ['open', 'investigating', 'resolved', 'closed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const incident = store.findIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });

  // Enforce forward-only transitions
  const order = { open: 0, investigating: 1, resolved: 2, closed: 3 };
  if (order[status] <= order[incident.status]) {
    return res.status(400).json({ error: 'Cannot move incident backward in status' });
  }

  store.updateIncidentStatus(incident.id, status);

  // Record timeline entry
  const actionLabels = {
    investigating: 'Investigation Started',
    resolved:      'Incident Resolved',
    closed:        'Incident Closed',
  };

  const descriptions = {
    investigating: 'Analyst began investigation of this incident.',
    resolved:      'Incident has been reviewed and resolved.',
    closed:        'Incident has been closed and archived.',
  };

  const actor = req.user ? req.user.name : 'Analyst';

  store.addTimelineEntry({
    incident_id: incident.id,
    action:      actionLabels[status] || `Status changed to ${status}`,
    description: descriptions[status] || `Status updated to ${status}`,
    actor,
  });

  // Log security event
  store.createSecurityEvent({
    event_type: actionLabels[status] || 'Incident Status Updated',
    user_id:    req.user ? req.user.id : null,
    risk_level: incident.severity,
    details:    `Incident ${incident.incident_code} status changed to ${status}`,
    metadata:   { incident_id: incident.id, incident_code: incident.incident_code, new_status: status },
  });

  // Return updated incident with fresh timeline
  const updated  = store.findIncidentById(incident.id);
  const timeline = store.getTimeline(incident.id);
  return res.json({ ...updated, timeline });
}

module.exports = { getAll, getOne, updateStatus };
