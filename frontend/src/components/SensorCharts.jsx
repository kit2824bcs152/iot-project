import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { LineChart as ChartIcon, Sparkles } from 'lucide-react';

export default function SensorCharts({ history, prediction }) {
  const [activeTab, setActiveTab] = useState('PREDICTION_COMPARE');

  if (!history || history.length === 0) {
    return (
      <div className="glass-panel chart-card" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: '#94a3b8' }}>Gathering sensor telemetry history...</p>
      </div>
    );
  }

  // Format data for charts
  const chartData = history.map((item) => {
    const d = new Date(item.timestamp);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      time: timeStr,
      rawTime: item.timestamp,
      temperature: item.temperature,
      humidity: item.humidity,
      pressure: item.pressure,
      aqi: item.aqi,
      rainfall: item.rainfall,
      windSpeed: item.windSpeed,
    };
  });

  // Prepare combined data for Actual vs DNN Predicted
  // Append a future point with the DNN prediction
  const lastActual = chartData[chartData.length - 1];
  const compareData = chartData.map((pt, idx) => ({
    ...pt,
    actualTemp: pt.temperature,
    // Connect the last actual point to start the prediction line smoothly
    predictedTemp: idx === chartData.length - 1 ? pt.temperature : null,
  }));

  if (prediction && lastActual) {
    compareData.push({
      time: '+60m (DNN Forecast)',
      actualTemp: null,
      predictedTemp: prediction.predictedTemperature,
      humidity: prediction.predictedHumidity,
      pressure: prediction.predictedPressure,
      aqi: prediction.predictedAQI,
      isPrediction: true,
    });
  }

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: 'rgba(10, 15, 26, 0.95)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>{label}</div>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color, display: 'flex', gap: '8px', marginBottom: '3px' }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: '700' }}>
                {entry.value !== null && entry.value !== undefined ? Number(entry.value).toFixed(1) : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel chart-card">
      <div className="chart-header">
        <div className="chart-title-group">
          <ChartIcon size={20} style={{ color: '#00f2fe' }} />
          <h2 className="chart-title">Real-Time Environmental Analytics &amp; Predictions</h2>
        </div>

        <div className="chart-tabs">
          <button
            className={`chart-tab ${activeTab === 'PREDICTION_COMPARE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PREDICTION_COMPARE')}
          >
            Actual vs DNN Prediction
          </button>
          <button
            className={`chart-tab ${activeTab === 'TEMP_HUMIDITY' ? 'active' : ''}`}
            onClick={() => setActiveTab('TEMP_HUMIDITY')}
          >
            Temp &amp; Humidity
          </button>
          <button
            className={`chart-tab ${activeTab === 'PRESSURE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PRESSURE')}
          >
            Pressure (hPa)
          </button>
          <button
            className={`chart-tab ${activeTab === 'AQI' ? 'active' : ''}`}
            onClick={() => setActiveTab('AQI')}
          >
            Air Quality (AQI)
          </button>
          <button
            className={`chart-tab ${activeTab === 'RAINFALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('RAINFALL')}
          >
            Precipitation
          </button>
        </div>
      </div>

      <div className="chart-canvas-wrap">
        {/* TAB 1: ACTUAL VS DNN PREDICTION */}
        {activeTab === 'PREDICTION_COMPARE' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={compareData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 11 }} unit="°C" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.8rem' }} />
              <Line
                type="monotone"
                dataKey="actualTemp"
                name="Actual Recorded Temp (°C)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#38bdf8' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="predictedTemp"
                name="DNN Forecast Temp (°C)"
                stroke="#c084fc"
                strokeWidth={3}
                strokeDasharray="6 6"
                dot={{ r: 6, fill: '#c084fc', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* TAB 2: TEMPERATURE & HUMIDITY */}
        {activeTab === 'TEMP_HUMIDITY' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#f43f5e" unit="°C" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" unit="%" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.8rem' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temperature"
                name="Temperature (°C)"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="humidity"
                name="Humidity (%)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* TAB 3: PRESSURE */}
        {activeTab === 'PRESSURE' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pressureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#a855f7" unit=" hPa" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.8rem' }} />
              <Area
                type="monotone"
                dataKey="pressure"
                name="Barometric Pressure (hPa)"
                stroke="#a855f7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#pressureGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* TAB 4: AIR QUALITY (AQI) */}
        {activeTab === 'AQI' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#10b981" unit=" AQI" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.8rem' }} />
              <Area
                type="monotone"
                dataKey="aqi"
                name="Air Quality Index (AQI)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#aqiGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* TAB 5: RAINFALL */}
        {activeTab === 'RAINFALL' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#0284c7" unit=" mm" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.8rem' }} />
              <Bar dataKey="rainfall" name="Rainfall Precipitation (mm)" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
