const SensorData = require('../models/SensorData');
const Prediction = require('../models/Prediction');
const genaiService = require('../services/genaiService');
const DNNClient = require('../services/dnnClient');

// GET /api/ai/insights
exports.getAIInsights = async (req, res) => {
  try {
    // 1. Get latest sensor reading
    let sensorData = await SensorData.findOne().sort({ timestamp: -1 });
    if (!sensorData) {
      sensorData = {
        temperature: 28.5,
        humidity: 62.0,
        pressure: 1012.8,
        aqi: 65.0,
        rainfall: 0.0,
        windSpeed: 14.2,
        lightIntensity: 680,
        location: 'IoT Station Alpha',
      };
    }

    // 2. Get latest DNN prediction or infer now
    let prediction = await Prediction.findOne().sort({ timestamp: -1 });
    if (!prediction) {
      prediction = await DNNClient.predictNext(sensorData);
    }

    // 3. Generate GenAI report
    const report = await genaiService.generateReport(sensorData, prediction);

    return res.json({
      success: true,
      report,
      context: {
        currentTemp: sensorData.temperature,
        currentHum: sensorData.humidity,
        currentAQI: sensorData.aqi,
        predictedTemp: prediction.predictedTemperature,
        predictedAQI: prediction.predictedAQI,
      },
    });
  } catch (error) {
    console.error('[AIController] Error generating AI insights:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
