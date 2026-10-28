const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'HIGH_TEMPERATURE',
        'HIGH_HUMIDITY',
        'POOR_AQI',
        'HAZARDOUS_AQI',
        'PRESSURE_ANOMALY',
        'HEAVY_RAINFALL',
        'STRONG_WIND',
        'SENSOR_DISCONNECTED',
      ],
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'warning',
    },
    parameter: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
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

alertSchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model('Alert', alertSchema);
