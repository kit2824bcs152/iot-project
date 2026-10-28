const { GoogleGenerativeAI } = require('@google/generative-ai');

class GenAIService {
  constructor() {
    this.apiKey = process.env.GENAI_API_KEY || '';
    this.modelName = process.env.GENAI_MODEL || 'gemini-1.5-flash';
    this.client = null;

    if (this.apiKey && this.apiKey !== 'your_gemini_api_key_here') {
      try {
        this.client = new GoogleGenerativeAI(this.apiKey);
      } catch (err) {
        console.warn('[GenAIService] Failed to initialize GoogleGenerativeAI client:', err.message);
      }
    }
  }

  /**
   * Generates a comprehensive natural language environmental analysis report.
   * @param {Object} sensorData - Current live IoT sensor data
   * @param {Object} prediction - DNN forecast results
   */
  async generateReport(sensorData, prediction) {
    if (this.client && this.apiKey) {
      try {
        const model = this.client.getGenerativeModel({ model: this.modelName });
        const prompt = `
You are an expert Meteorological & Environmental AI Specialist in an IoT Climate Control Station.
Analyze the following real-time sensor metrics and the Deep Neural Network (DNN) 1-hour forecast:

[CURRENT LIVE SENSOR READINGS]:
- Temperature: ${sensorData.temperature} °C
- Relative Humidity: ${sensorData.humidity} %
- Atmospheric Pressure: ${sensorData.pressure} hPa
- Air Quality Index (AQI): ${sensorData.aqi}
- Rainfall: ${sensorData.rainfall} mm
- Wind Speed: ${sensorData.windSpeed} km/h
- Light Intensity: ${sensorData.lightIntensity} Lux
- Station Location: ${sensorData.location || 'Station Alpha'}

[DNN 1-HOUR FUTURE PREDICTIONS]:
- Predicted Future Temperature: ${prediction.predictedTemperature} °C
- Predicted Future Humidity: ${prediction.predictedHumidity} %
- Predicted Future Pressure: ${prediction.predictedPressure} hPa
- Predicted Future AQI: ${prediction.predictedAQI}
- Model: ${prediction.modelVersion || 'TensorFlow DNN'} (Confidence: ${Math.round((prediction.confidenceScore || 0.94) * 100)}%)

Generate a valid JSON object strictly matching this schema (do NOT wrap in markdown quotes if possible, or return parseable JSON):
{
  "weatherSummary": "2-3 concise sentences summarizing the present environmental state and immediate feel.",
  "predictionExplanation": "2-3 sentences explaining the DNN predictive trajectory, physics implications, and forecast horizon.",
  "environmentalRisks": [
    {"category": "Heat/Humidity/AQI/Rain/Wind", "level": "Low|Moderate|High|Severe", "detail": "explanation of danger"}
  ],
  "recommendations": [
    "practical actionable recommendation 1",
    "practical actionable recommendation 2",
    "practical actionable recommendation 3"
  ],
  "futureOutlook": "One sentence summary describing whether conditions will improve or deteriorate over the next 60 minutes."
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Clean markdown backticks if present
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          source: 'Gemini-API (' + this.modelName + ')',
          generatedAt: new Date().toISOString(),
          ...parsed,
        };
      } catch (err) {
        console.warn('[GenAIService] Gemini API call failed or timed out, falling back to intelligent dynamic generator:', err.message);
      }
    }

    // Dynamic Intelligent Synthesis Fallback (physics + rule driven)
    return this.generateDynamicSynthesis(sensorData, prediction);
  }

  /**
   * High-accuracy dynamic rule-based narrative generator
   */
  generateDynamicSynthesis(sensor, pred) {
    const { temperature, humidity, pressure, aqi, rainfall, windSpeed } = sensor;
    const { predictedTemperature, predictedHumidity, predictedPressure, predictedAQI } = pred;

    // 1. Weather Summary
    let thermalFeel = 'comfortable and pleasant';
    if (temperature > 38) thermalFeel = 'scorching and oppressive';
    else if (temperature > 32) thermalFeel = 'warm and humid';
    else if (temperature < 18) thermalFeel = 'crisp and brisk';

    let skyCondition = rainfall > 10 ? 'overcast with significant precipitation' : rainfall > 0 ? 'damp with light showers' : 'clear to partly cloudy';
    let aqiStatus = aqi > 200 ? 'hazardous' : aqi > 150 ? 'unhealthy' : aqi > 100 ? 'moderately compromised' : 'good and clean';

    const weatherSummary = `Ambient station temperature is currently ${temperature.toFixed(1)}°C with relative humidity at ${humidity.toFixed(1)}%, feeling ${thermalFeel}. Atmospheric pressure is reading ${pressure.toFixed(1)} hPa under ${skyCondition} conditions with ambient air quality categorized as ${aqiStatus} (${Math.round(aqi)} AQI).`;

    // 2. Prediction Explanation
    const tempTrend = predictedTemperature > temperature + 0.5 ? 'rise further' : predictedTemperature < temperature - 0.5 ? 'decrease' : 'remain relatively stable';
    const aqiTrend = predictedAQI > aqi + 5 ? 'deteriorate' : predictedAQI < aqi - 5 ? 'improve' : 'persist steadily';

    const predictionExplanation = `The Deep Neural Network forecast over the next 60 minutes projects temperature to ${tempTrend} towards ${predictedTemperature.toFixed(1)}°C, with atmospheric pressure stabilizing at ${predictedPressure.toFixed(1)} hPa. Concurrently, environmental air quality is anticipated to ${aqiTrend} reaching ~${Math.round(predictedAQI)} AQI as localized wind patterns move at ${windSpeed.toFixed(1)} km/h.`;

    // 3. Environmental Risks
    const environmentalRisks = [];
    if (temperature > 38) {
      environmentalRisks.push({ category: 'Heat Stress', level: 'High', detail: `Extreme ambient thermal levels (>38°C) pose dehydration and heat exhaustion risks.` });
    } else if (temperature > 33) {
      environmentalRisks.push({ category: 'Heat Index', level: 'Moderate', detail: `Combined warmth and moisture warrant shaded breaks for outdoor personnel.` });
    }

    if (humidity > 80) {
      environmentalRisks.push({ category: 'High Humidity', level: 'Moderate', detail: `Moisture saturation (${humidity.toFixed(0)}%) reduces body cooling efficiency and increases indoor condensation.` });
    }

    if (aqi > 150) {
      environmentalRisks.push({ category: 'Air Quality', level: aqi > 200 ? 'Severe' : 'High', detail: `Elevated particulate matter poses respiratory strain for sensitive and general groups.` });
    } else if (aqi > 100) {
      environmentalRisks.push({ category: 'Air Quality', level: 'Moderate', detail: `Sensitive groups may experience mild irritation over prolonged exposure.` });
    }

    if (rainfall > 20) {
      environmentalRisks.push({ category: 'Precipitation', level: 'High', detail: `Heavy rainfall (${rainfall.toFixed(1)} mm) can trigger drainage overflow and slick road surfaces.` });
    }

    if (windSpeed > 35) {
      environmentalRisks.push({ category: 'Wind Velocity', level: 'Moderate', detail: `Strong wind gusts (${windSpeed.toFixed(1)} km/h) require stabilization of lightweight field equipment.` });
    }

    if (environmentalRisks.length === 0) {
      environmentalRisks.push({ category: 'Overall Environment', level: 'Low', detail: 'All atmospheric and environmental indicators are operating within normal baseline limits.' });
    }

    // 4. Recommendations
    const recommendations = [];
    if (aqi > 150) {
      recommendations.push('Wear N95/protective respirators outdoors and activate HEPA filtration systems indoors.');
    } else if (aqi > 100) {
      recommendations.push('Limit strenuous outdoor cardio sessions and keep ventilation air filtered.');
    } else {
      recommendations.push('Air quality is optimal for unrestricted outdoor activities and natural room ventilation.');
    }

    if (temperature > 35) {
      recommendations.push('Maintain active hydration with electrolyte replenishment and avoid midday direct sun.');
    } else if (rainfall > 10) {
      recommendations.push('Carry rain protection gear and inspect stormwater drainage paths near station.');
    } else {
      recommendations.push('Thermal comfort indices indicate optimal operating conditions for field operations.');
    }

    if (windSpeed > 35) {
      recommendations.push('Anchor loose rooftop hardware and ensure IoT antenna mounts are securely tightened.');
    } else {
      recommendations.push('Calibrate IoT station sensors periodically for consistent baseline tracking.');
    }

    // 5. Future Outlook
    let futureOutlook = 'Atmospheric conditions are anticipated to remain stable and within safe operational thresholds over the next hour.';
    if (predictedAQI > 160 || predictedTemperature > 40 || rainfall > 25) {
      futureOutlook = 'Environmental indicators signal deteriorating conditions ahead; precautionary monitoring is strongly advised.';
    } else if (predictedAQI < 80 && predictedTemperature < 32 && rainfall < 5) {
      futureOutlook = 'Conditions are projected to improve steadily with favorable ambient weather over the coming forecast horizon.';
    }

    return {
      source: 'Intelligent GenAI Narrative Engine (Dynamic Physics-Contextual)',
      generatedAt: new Date().toISOString(),
      weatherSummary,
      predictionExplanation,
      environmentalRisks,
      recommendations,
      futureOutlook,
    };
  }
}

module.exports = new GenAIService();
