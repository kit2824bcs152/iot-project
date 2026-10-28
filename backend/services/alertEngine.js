const Alert = require('../models/Alert');

// Threshold configurations
const THRESHOLDS = {
  TEMPERATURE: { max: 40, critical: 45, unit: '°C' },
  HUMIDITY: { max: 85, critical: 95, unit: '%' },
  AQI: { moderate: 100, poor: 150, critical: 200, unit: 'AQI' },
  PRESSURE_LOW: { min: 985, critical: 970, unit: 'hPa' },
  PRESSURE_HIGH: { max: 1035, critical: 1045, unit: 'hPa' },
  RAINFALL: { moderate: 15, heavy: 25, critical: 50, unit: 'mm' },
  WIND_SPEED: { strong: 40, gale: 60, unit: 'km/h' },
};

// Cooldown tracker to prevent flood of identical alerts within 2 minutes
const alertCooldowns = new Map();
const COOLDOWN_MS = 2 * 60 * 1000;

class AlertEngine {
  static async evaluateSensorReading(reading, io = null) {
    const alertsToTrigger = [];
    const now = Date.now();

    const canTrigger = (key) => {
      const last = alertCooldowns.get(key) || 0;
      if (now - last > COOLDOWN_MS) {
        alertCooldowns.set(key, now);
        return true;
      }
      return false;
    };

    // 1. Temperature Check (> 40°C)
    if (reading.temperature >= THRESHOLDS.TEMPERATURE.max) {
      const isCritical = reading.temperature >= THRESHOLDS.TEMPERATURE.critical;
      if (canTrigger('HIGH_TEMPERATURE')) {
        alertsToTrigger.push({
          type: 'HIGH_TEMPERATURE',
          message: `Extreme heat detected! Ambient temperature is ${reading.temperature.toFixed(1)}°C (Threshold: ${THRESHOLDS.TEMPERATURE.max}°C).`,
          severity: isCritical ? 'critical' : 'warning',
          parameter: 'temperature',
          value: reading.temperature,
          threshold: THRESHOLDS.TEMPERATURE.max,
        });
      }
    }

    // 2. Humidity Check (> 85%)
    if (reading.humidity >= THRESHOLDS.HUMIDITY.max) {
      const isCritical = reading.humidity >= THRESHOLDS.HUMIDITY.critical;
      if (canTrigger('HIGH_HUMIDITY')) {
        alertsToTrigger.push({
          type: 'HIGH_HUMIDITY',
          message: `High relative humidity detected: ${reading.humidity.toFixed(1)}% (Threshold: ${THRESHOLDS.HUMIDITY.max}%). Risk of heat index distress and condensation.`,
          severity: isCritical ? 'critical' : 'warning',
          parameter: 'humidity',
          value: reading.humidity,
          threshold: THRESHOLDS.HUMIDITY.max,
        });
      }
    }

    // 3. AQI Check (> 150)
    if (reading.aqi >= THRESHOLDS.AQI.poor) {
      const isHazardous = reading.aqi >= THRESHOLDS.AQI.critical;
      const type = isHazardous ? 'HAZARDOUS_AQI' : 'POOR_AQI';
      if (canTrigger('AQI')) {
        alertsToTrigger.push({
          type,
          message: `${isHazardous ? 'Hazardous' : 'Unhealthy'} Air Quality Index: ${Math.round(reading.aqi)} AQI. High particulate matter/toxic gases detected.`,
          severity: isHazardous ? 'critical' : 'warning',
          parameter: 'aqi',
          value: reading.aqi,
          threshold: THRESHOLDS.AQI.poor,
        });
      }
    }

    // 4. Pressure Anomaly (< 985 hPa or > 1035 hPa)
    if (reading.pressure <= THRESHOLDS.PRESSURE_LOW.min) {
      if (canTrigger('PRESSURE_LOW')) {
        alertsToTrigger.push({
          type: 'PRESSURE_ANOMALY',
          message: `Sharp atmospheric barometric drop detected: ${reading.pressure.toFixed(1)} hPa. Low-pressure front indicates incoming storm system.`,
          severity: reading.pressure <= THRESHOLDS.PRESSURE_LOW.critical ? 'critical' : 'warning',
          parameter: 'pressure',
          value: reading.pressure,
          threshold: THRESHOLDS.PRESSURE_LOW.min,
        });
      }
    } else if (reading.pressure >= THRESHOLDS.PRESSURE_HIGH.max) {
      if (canTrigger('PRESSURE_HIGH')) {
        alertsToTrigger.push({
          type: 'PRESSURE_ANOMALY',
          message: `High barometric pressure detected: ${reading.pressure.toFixed(1)} hPa. Strong anticyclone system active.`,
          severity: 'info',
          parameter: 'pressure',
          value: reading.pressure,
          threshold: THRESHOLDS.PRESSURE_HIGH.max,
        });
      }
    }

    // 5. Rainfall Check (> 25 mm)
    if (reading.rainfall >= THRESHOLDS.RAINFALL.heavy) {
      const isCritical = reading.rainfall >= THRESHOLDS.RAINFALL.critical;
      if (canTrigger('HEAVY_RAINFALL')) {
        alertsToTrigger.push({
          type: 'HEAVY_RAINFALL',
          message: `Heavy precipitation alert: ${reading.rainfall.toFixed(1)} mm rainfall recorded. Flash flood and waterlogging precaution advised.`,
          severity: isCritical ? 'critical' : 'warning',
          parameter: 'rainfall',
          value: reading.rainfall,
          threshold: THRESHOLDS.RAINFALL.heavy,
        });
      }
    }

    // 6. Wind Speed Check (> 40 km/h)
    if (reading.windSpeed >= THRESHOLDS.WIND_SPEED.strong) {
      const isGale = reading.windSpeed >= THRESHOLDS.WIND_SPEED.gale;
      if (canTrigger('STRONG_WIND')) {
        alertsToTrigger.push({
          type: 'STRONG_WIND',
          message: `High wind velocity warning: ${reading.windSpeed.toFixed(1)} km/h. Secure loose outdoor structures and sensors.`,
          severity: isGale ? 'critical' : 'warning',
          parameter: 'windSpeed',
          value: reading.windSpeed,
          threshold: THRESHOLDS.WIND_SPEED.strong,
        });
      }
    }

    // Persist alerts to DB and broadcast via Socket.io if available
    const savedAlerts = [];
    for (const alertData of alertsToTrigger) {
      try {
        const saved = await Alert.create(alertData);
        savedAlerts.push(saved);
        if (io) {
          io.emit('new_alert', saved);
        }
      } catch (err) {
        console.error('[AlertEngine] Error saving alert:', err.message);
      }
    }

    return savedAlerts;
  }

  static getThresholds() {
    return THRESHOLDS;
  }
}

module.exports = AlertEngine;
