/**
 * Security Center dashboard controller.
 * Returns live statistics computed from actual application data.
 * No hardcoded numbers.
 */

const store = require('../database/memoryStore');

/** GET /api/dashboard/stats */
function getStats(req, res) {
  try {
    const stats = store.getDashboardStats();
    return res.json(stats);
  } catch (err) {
    console.error('[Dashboard] Stats error:', err);
    return res.status(500).json({ error: 'Failed to compute dashboard statistics' });
  }
}

module.exports = { getStats };
