const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema(
  {
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    pressure: {
      type: Number,
      required: true,
    },
    aqi: {
      type: Number,
      required: true,
    },
    rainfall: {
      type: Number,
      required: true,
      default: 0,
    },
    windSpeed: {
      type: Number,
      required: true,
      default: 0,
    },
    lightIntensity: {
      type: Number,
      required: true,
      default: 0,
    },
    location: {
      type: String,
      default: 'IoT-Station-01 (Environmental Lab)',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient time-series queries
sensorDataSchema.index({ timestamp: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
