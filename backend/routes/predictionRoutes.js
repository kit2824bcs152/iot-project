const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

router.get('/current', predictionController.getCurrentPrediction);
router.get('/history', predictionController.getPredictionHistory);
router.get('/metrics', predictionController.getModelMetrics);

module.exports = router;
