const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.post('/data', sensorController.postSensorData);
router.get('/latest', sensorController.getLatestSensorData);
router.get('/history', sensorController.getSensorHistory);
router.get('/simulator/status', sensorController.getSimulatorStatus);
router.post('/simulator/scenario', sensorController.setSimulatorScenario);
router.post('/simulator/toggle', sensorController.toggleSimulator);

module.exports = router;
