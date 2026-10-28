const Prediction = require('../models/Prediction');
const SensorData = require('../models/SensorData');
const DNNClient = require('../services/dnnClient');

// GET /api/predictions/current
exports.getCurrentPrediction = async (req, res) => {
  try {
    // Get latest sensor data as input feature vector
    let latest = await SensorData.findOne().sort({ timestamp: -1 });
    if (!latest) {
      latest = {
        temperature: 28.5,
        humidity: 62.0,
        pressure: 1012.8,
        aqi: 65.0,
        rainfall: 0.0,
        windSpeed: 14.2,
        lightIntensity: 680,
      };
    }

    const features = {
      temperature: latest.temperature,
      humidity: latest.humidity,
      pressure: latest.pressure,
      aqi: latest.aqi,
      rainfall: latest.rainfall || 0,
      windSpeed: latest.windSpeed || 0,
      lightIntensity: latest.lightIntensity || 500,
    };

    const predResult = await DNNClient.predictNext(features);

    // Save prediction to MongoDB
    let saved;
    try {
      saved = await Prediction.create({
        predictedTemperature: predResult.predictedTemperature,
        predictedHumidity: predResult.predictedHumidity,
        predictedPressure: predResult.predictedPressure,
        predictedAQI: predResult.predictedAQI,
        predictionTime: predResult.predictionTime || '+1 Hour Ahead',
        horizonMinutes: predResult.horizonMinutes || 60,
        modelVersion: predResult.modelVersion || 'DNN-v1.0 (Keras)',
        confidenceScore: predResult.confidenceScore || 0.94,
        timestamp: new Date(),
      });
    } catch (saveErr) {
      saved = { ...predResult, _id: 'pred-' + Date.now(), timestamp: new Date() };
    }

    return res.json({
      success: true,
      currentInput: features,
      prediction: saved,
      source: predResult.source,
    });
  } catch (error) {
    console.error('[PredictionController] Error generating prediction:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/predictions/history?limit=15
exports.getPredictionHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 15;
    const history = await Prediction.find().sort({ timestamp: -1 }).limit(limit);
    return res.json({
      success: true,
      count: history.length,
      data: history.reverse(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/predictions/metrics
exports.getModelMetrics = async (req, res) => {
  try {
    const metrics = await DNNClient.getMetrics();
    return res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
