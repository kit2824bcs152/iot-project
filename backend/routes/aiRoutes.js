const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.get('/insights', aiController.getAIInsights);

module.exports = router;
