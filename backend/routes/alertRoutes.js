const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/active', alertController.getActiveAlerts);
router.get('/all', alertController.getAllAlerts);
router.get('/thresholds', alertController.getThresholds);
router.put('/:id/acknowledge', alertController.acknowledgeAlert);
router.post('/clear', alertController.clearAlerts);

module.exports = router;
