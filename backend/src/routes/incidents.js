const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/incidentController');
const { requireAuth } = require('../middleware/auth');

router.get('/',              requireAuth, ctrl.getAll);
router.get('/:id',           requireAuth, ctrl.getOne);
router.patch('/:id/status',  requireAuth, ctrl.updateStatus);

module.exports = router;
