const Alert = require('../models/Alert');
const AlertEngine = require('../services/alertEngine');

// GET /api/alerts/active
exports.getActiveAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ status: 'active' }).sort({ timestamp: -1 }).limit(20);
    return res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/alerts/all?limit=50
exports.getAllAlerts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(limit);
    return res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/alerts/:id/acknowledge
exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'acknowledged' },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    return res.json({ success: true, data: alert });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/alerts/clear
exports.clearAlerts = async (req, res) => {
  try {
    await Alert.updateMany({ status: 'active' }, { status: 'resolved' });
    return res.json({ success: true, message: 'All active alerts marked as resolved' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/alerts/thresholds
exports.getThresholds = (req, res) => {
  return res.json({
    success: true,
    data: AlertEngine.getThresholds(),
  });
};
