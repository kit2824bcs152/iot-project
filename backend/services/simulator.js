const SensorData = require('../models/SensorData');
const AlertEngine = require('./alertEngine');

class IoTSimulator {
  constructor() {
    this.intervalId = null;
    this.intervalSeconds = 3;
    this.isRunning = false;
    this.io = null;
    this.scenario = 'NORMAL'; // 'NORMAL', 'HEATWAVE', 'STORM', 'POOR_AIR', 'RAINY'

    // State baseline
    this.current = {
      temperature: 28.5,
      humidity: 62.0,
      pressure: 1012.8,
      aqi: 65.0,
      rainfall: 0.0,
      windSpeed: 14.2,
      lightIntensity: 680, // Lux
      location: 'IoT-Station-01 (Environmental Lab)',
    };
  }

  setSocketIO(ioInstance) {
    this.io = ioInstance;
  }

  setScenario(newScenario) {
    if (['NORMAL', 'HEATWAVE', 'STORM', 'POOR_AIR', 'RAINY'].includes(newScenario)) {
      this.scenario = newScenario;
      console.log(`[Simulator] Active scenario switched to: ${newScenario}`);
    }
  }

  getScenario() {
    return this.scenario;
  }

  // Realistic random walk with clamping and physical correlations
  generateNextReading() {
    const drift = (scale) => (Math.random() - 0.49) * scale;

    switch (this.scenario) {
      case 'HEATWAVE':
        // High temp target 42°C, low humidity 30%, bright sun
        this.current.temperature = Math.min(44, Math.max(38, this.current.temperature + 0.3 + drift(0.2)));
        this.current.humidity = Math.max(20, Math.min(45, this.current.humidity - 0.4 + drift(0.3)));
        this.current.pressure = Math.max(1005, Math.min(1015, this.current.pressure + drift(0.2)));
        this.current.aqi = Math.max(80, Math.min(130, this.current.aqi + drift(1.5)));
        this.current.rainfall = 0;
        this.current.windSpeed = Math.max(5, Math.min(22, this.current.windSpeed + drift(1.0)));
        this.current.lightIntensity = Math.min(1200, Math.max(900, this.current.lightIntensity + drift(20)));
        break;

      case 'STORM':
        // Sharp pressure drop, heavy rain, wind gusts, high humidity
        this.current.pressure = Math.max(975, Math.min(992, this.current.pressure - 0.5 + drift(0.3)));
        this.current.rainfall = Math.min(65, Math.max(20, this.current.rainfall + 1.2 + drift(0.8)));
        this.current.humidity = Math.min(98, Math.max(88, this.current.humidity + 0.3 + drift(0.2)));
        this.current.temperature = Math.max(21, Math.min(25, this.current.temperature - 0.2 + drift(0.2)));
        this.current.windSpeed = Math.min(65, Math.max(38, this.current.windSpeed + 1.5 + drift(2.0)));
        this.current.aqi = Math.max(25, Math.min(55, this.current.aqi - 0.5)); // Rain washes particulates
        this.current.lightIntensity = Math.max(80, Math.min(250, this.current.lightIntensity + drift(15)));
        break;

      case 'POOR_AIR':
        // AQI spike > 160-220, stagnant low wind
        this.current.aqi = Math.min(240, Math.max(155, this.current.aqi + 1.2 + drift(2.0)));
        this.current.windSpeed = Math.max(2, Math.min(8, this.current.windSpeed + drift(0.5))); // Low dispersion
        this.current.temperature = Math.min(35, Math.max(29, this.current.temperature + drift(0.2)));
        this.current.humidity = Math.min(75, Math.max(50, this.current.humidity + drift(0.4)));
        this.current.pressure = Math.min(1016, Math.max(1008, this.current.pressure + drift(0.1)));
        this.current.rainfall = 0;
        this.current.lightIntensity = Math.max(400, Math.min(650, this.current.lightIntensity + drift(10)));
        break;

      case 'RAINY':
        // Moderate steady rain 15-22mm, 85-92% humidity, cooler
        this.current.rainfall = Math.min(25, Math.max(8, this.current.rainfall + drift(0.5)));
        this.current.humidity = Math.min(94, Math.max(82, this.current.humidity + drift(0.3)));
        this.current.temperature = Math.max(22, Math.min(26, this.current.temperature + drift(0.2)));
        this.current.pressure = Math.max(1002, Math.min(1010, this.current.pressure + drift(0.2)));
        this.current.windSpeed = Math.max(12, Math.min(28, this.current.windSpeed + drift(1.0)));
        this.current.aqi = Math.max(30, Math.min(60, this.current.aqi + drift(1.0)));
        this.current.lightIntensity = Math.max(200, Math.min(450, this.current.lightIntensity + drift(15)));
        break;

      case 'NORMAL':
      default:
        // Gradual diurnal drift around 27-31°C
        this.current.temperature = Math.min(34, Math.max(24, this.current.temperature + drift(0.25)));
        // Inverse relationship: as temp rises, relative humidity tends lower
        const tempDelta = this.current.temperature - 28.5;
        const targetHumidity = Math.max(45, Math.min(75, 65 - tempDelta * 1.8));
        this.current.humidity = Math.min(78, Math.max(45, this.current.humidity + (targetHumidity - this.current.humidity) * 0.08 + drift(0.3)));
        this.current.pressure = Math.min(1018, Math.max(1008, this.current.pressure + drift(0.15)));
        this.current.aqi = Math.min(95, Math.max(40, this.current.aqi + drift(1.0)));
        this.current.windSpeed = Math.min(24, Math.max(6, this.current.windSpeed + drift(0.6)));
        this.current.rainfall = Math.max(0, this.current.rainfall > 0 ? this.current.rainfall - 0.2 : 0);
        this.current.lightIntensity = Math.min(950, Math.max(450, this.current.lightIntensity + drift(15)));
        break;
    }

    return {
      temperature: Number(this.current.temperature.toFixed(2)),
      humidity: Number(this.current.humidity.toFixed(2)),
      pressure: Number(this.current.pressure.toFixed(2)),
      aqi: Number(this.current.aqi.toFixed(1)),
      rainfall: Number(this.current.rainfall.toFixed(2)),
      windSpeed: Number(this.current.windSpeed.toFixed(2)),
      lightIntensity: Math.round(this.current.lightIntensity),
      location: this.current.location,
      timestamp: new Date(),
    };
  }

  async tick() {
    try {
      const data = this.generateNextReading();
      // Persist in DB
      let saved;
      try {
        saved = await SensorData.create(data);
      } catch (dbErr) {
        // Degraded mode fallback if DB temporarily offline
        saved = { ...data, _id: 'sim-' + Date.now() };
      }

      // Evaluate for threshold alerts
      await AlertEngine.evaluateSensorReading(saved, this.io);

      // Broadcast to WebSocket clients
      if (this.io) {
        this.io.emit('sensor_data', saved);
      }

      return saved;
    } catch (err) {
      console.error('[Simulator] Tick error:', err.message);
    }
  }

  start(intervalMs = 3000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Simulator] IoT Sensor Simulation started (interval: ${intervalMs}ms)`);
    // Initial immediate tick
    this.tick();
    this.intervalId = setInterval(() => this.tick(), intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[Simulator] IoT Sensor Simulation stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      scenario: this.scenario,
      currentBaseline: this.current,
    };
  }
}

// Singleton simulator instance
module.exports = new IoTSimulator();
