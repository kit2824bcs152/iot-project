const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    predictedTemperature: {
      type: Number,
      required: true,
    },
    predictedHumidity: {
      type: Number,
      required: true,
    },
    predictedPressure: {
      type: Number,
      required: true,
    },
    predictedAQI: {
      type: Number,
      required: true,
    },
    predictionTime: {
      type: String,
      default: '+1 Hour Ahead',
    },
    horizonMinutes: {
      type: Number,
      default: 60,
    },
    modelVersion: {
      type: String,
      default: 'DNN-Keras-v1.0 (Dense 128-64-32)',
    },
    confidenceScore: {
      type: Number,
      default: 0.94,
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

predictionSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
