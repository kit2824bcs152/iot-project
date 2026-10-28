const SensorData = require('../models/SensorData');
const AlertEngine = require('../services/alertEngine');
const simulator = require('../services/simulator');

// POST /api/sensors/data (Hardware ESP32 or Simulator input)
exports.postSensorData = async (req, res) => {
  try {
    const {
      temperature,
      humidity,
      pressure,
      aqi,
      rainfall = 0,
      windSpeed = 0,
      lightIntensity = 0,
      location = 'ESP32-Hardware-Node-01',
    } = req.body;

    if (temperature === undefined || humidity === undefined || pressure === undefined || aqi === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required sensor parameters: temperature, humidity, pressure, and aqi are mandatory.',
      });
    }

    const newReading = await SensorData.create({
      temperature: Number(temperature),
      humidity: Number(humidity),
      pressure: Number(pressure),
      aqi: Number(aqi),
      rainfall: Number(rainfall),
      windSpeed: Number(windSpeed),
      lightIntensity: Number(lightIntensity),
      location,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
    });

    // Evaluate for alerts
    const io = req.app.get('io');
    const alerts = await AlertEngine.evaluateSensorReading(newReading, io);

    // Emit live update to connected frontend dashboards
    if (io) {
      io.emit('sensor_data', newReading);
    }

    return res.status(201).json({
      success: true,
      data: newReading,
      triggeredAlerts: alerts.length,
    });
  } catch (error) {
    console.error('[SensorController] Error posting sensor data:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/sensors/latest
exports.getLatestSensorData = async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ timestamp: -1 });
    if (!latest) {
      // Fallback baseline if DB empty
      return res.json({
        success: true,
        data: {
          temperature: 28.5,
          humidity: 62.0,
          pressure: 1012.8,
          aqi: 65.0,
          rainfall: 0.0,
          windSpeed: 14.2,
          lightIntensity: 680,
          location: 'Station Baseline',
          timestamp: new Date(),
        },
      });
    }
    return res.json({ success: true, data: latest });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/sensors/history?limit=30
exports.getSensorHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const history = await SensorData.find()
      .sort({ timestamp: -1 })
      .limit(limit);

    // Return in chronological order (oldest to newest) for chart rendering
    return res.json({
      success: true,
      count: history.length,
      data: history.reverse(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/sensors/simulator/status
exports.getSimulatorStatus = (req, res) => {
  return res.json({
    success: true,
    data: simulator.getStatus(),
  });
};

// POST /api/sensors/simulator/scenario
exports.setSimulatorScenario = (req, res) => {
  const { scenario } = req.body;
  if (!scenario) {
    return res.status(400).json({ success: false, error: 'Scenario name required.' });
  }
  simulator.setScenario(scenario);
  return res.json({
    success: true,
    message: `Scenario switched to ${scenario}`,
    scenario: simulator.getScenario(),
  });
};

// POST /api/sensors/simulator/toggle
exports.toggleSimulator = (req, res) => {
  const { running } = req.body;
  if (running) {
    simulator.start(3000);
  } else {
    simulator.stop();
  }
  return res.json({
    success: true,
    data: simulator.getStatus(),
  });
};
