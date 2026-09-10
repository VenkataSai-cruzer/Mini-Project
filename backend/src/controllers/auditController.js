/**
 * Security Audit Log controller.
 * EXTENDED: supports decision-based filters in addition to risk-level filters.
 */

const store = require('../database/memoryStore');

/**
 * GET /api/audit
 * Query params:
 *   filter : 'all' | 'low' | 'medium' | 'high' | 'granted' | 'blocked' | 'step_up' | 'incidents'
 */
function getEvents(req, res) {
  const filter = req.query.filter || 'all';
  const events = store.getAllSecurityEvents(filter === 'all' ? null : filter);

  // Enrich each event with user name
  const enriched = events.map((e) => {
    const user = e.user_id ? store.findUserById(e.user_id) : null;
    return {
      ...e,
      user_name: user ? user.name : 'System',
    };
  });

  return res.json(enriched);
}

module.exports = { getEvents };
