const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/accessController');
const { requireAuth } = require('../middleware/auth');

router.get('/resources',       requireAuth, ctrl.getResources);
router.post('/evaluate',       requireAuth, ctrl.evaluateAccess);
router.post('/verify',         requireAuth, ctrl.verifyOtp);
router.post('/revaluate',      requireAuth, ctrl.revaluateSession);

module.exports = router;
