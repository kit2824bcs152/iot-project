import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wind, 
  CloudRain, 
  Activity, 
  Sun,
  TrendingUp, 
  TrendingDown, 
  Minus 
} from 'lucide-react';

export default function SummaryCards({ current, previous }) {
  if (!current) return null;

  // Helper to calculate delta and trend
  const getTrend = (currVal, prevVal, higherIsWorse = false) => {
    if (!prevVal || currVal === prevVal) return { icon: Minus, text: 'Stable', color: 'delta-steady' };
    const diff = currVal - prevVal;
    const isUp = diff > 0;
    return {
      icon: isUp ? TrendingUp : TrendingDown,
      text: `${isUp ? '+' : ''}${diff.toFixed(1)}`,
      color: isUp ? (higherIsWorse ? 'delta-up' : 'delta-down') : (higherIsWorse ? 'delta-down' : 'delta-up'),
    };
  };

  // Status evaluators
  const getTempStatus = (temp) => {
    if (temp >= 40) return { label: 'Extreme Heat', type: 'alert' };
    if (temp >= 33) return { label: 'Warm', type: 'elevated' };
    if (temp <= 18) return { label: 'Cool', type: 'elevated' };
    return { label: 'Optimal', type: 'normal' };
  };

  const getHumidityStatus = (hum) => {
    if (hum >= 85) return { label: 'Saturated', type: 'alert' };
    if (hum >= 70) return { label: 'Humid', type: 'elevated' };
    if (hum <= 30) return { label: 'Arid', type: 'elevated' };
    return { label: 'Comfortable', type: 'normal' };
  };

  const getPressureStatus = (pres) => {
    if (pres <= 985) return { label: 'Storm Depression', type: 'alert' };
    if (pres >= 1030) return { label: 'High Barometer', type: 'elevated' };
    return { label: 'Stable Sea Level', type: 'normal' };
  };

  const getAQIStatus = (aqi) => {
    if (aqi >= 200) return { label: 'Hazardous', type: 'alert' };
    if (aqi >= 150) return { label: 'Unhealthy', type: 'alert' };
    if (aqi >= 100) return { label: 'Moderate', type: 'elevated' };
    if (aqi >= 50) return { label: 'Acceptable', type: 'normal' };
    return { label: 'Good & Clean', type: 'normal' };
  };

  const getRainStatus = (rain) => {
    if (rain >= 25) return { label: 'Torrential', type: 'alert' };
    if (rain >= 10) return { label: 'Heavy Showers', type: 'elevated' };
    if (rain > 0) return { label: 'Light Drizzle', type: 'normal' };
    return { label: 'Dry', type: 'normal' };
  };

  const getWindStatus = (wind) => {
    if (wind >= 45) return { label: 'Gale Warning', type: 'alert' };
    if (wind >= 25) return { label: 'Breezy', type: 'elevated' };
    return { label: 'Light Air', type: 'normal' };
  };

  const tempStatus = getTempStatus(current.temperature);
  const humStatus = getHumidityStatus(current.humidity);
  const presStatus = getPressureStatus(current.pressure);
  const aqiStatus = getAQIStatus(current.aqi);
  const rainStatus = getRainStatus(current.rainfall);
  const windStatus = getWindStatus(current.windSpeed);

  const tempTrend = getTrend(current.temperature, previous?.temperature, true);
  const humTrend = getTrend(current.humidity, previous?.humidity, true);
  const presTrend = getTrend(current.pressure, previous?.pressure, false);
  const aqiTrend = getTrend(current.aqi, previous?.aqi, true);
  const rainTrend = getTrend(current.rainfall, previous?.rainfall, true);
  const windTrend = getTrend(current.windSpeed, previous?.windSpeed, true);

  const cards = [
    {
      title: 'Ambient Temperature',
      value: current.temperature.toFixed(1),
      unit: '°C',
      status: tempStatus,
      trend: tempTrend,
      icon: Thermometer,
      accent: '#f43f5e',
    },
    {
      title: 'Relative Humidity',
      value: current.humidity.toFixed(1),
      unit: '%',
      status: humStatus,
      trend: humTrend,
      icon: Droplets,
      accent: '#38bdf8',
    },
    {
      title: 'Atmospheric Pressure',
      value: current.pressure.toFixed(1),
      unit: 'hPa',
      status: presStatus,
      trend: presTrend,
      icon: Gauge,
      accent: '#a855f7',
    },
    {
      title: 'Air Quality Index',
      value: Math.round(current.aqi),
      unit: 'AQI',
      status: aqiStatus,
      trend: aqiTrend,
      icon: Activity,
      accent: '#10b981',
    },
    {
      title: 'Precipitation / Rain',
      value: current.rainfall.toFixed(1),
      unit: 'mm',
      status: rainStatus,
      trend: rainTrend,
      icon: CloudRain,
      accent: '#0284c7',
    },
    {
      title: 'Wind Velocity',
      value: current.windSpeed.toFixed(1),
      unit: 'km/h',
      status: windStatus,
      trend: windTrend,
      icon: Wind,
      accent: '#f59e0b',
    },
  ];

  return (
    <div className="metrics-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const TrendIcon = card.trend.icon;
        return (
          <div 
            key={idx} 
            className="glass-panel metric-card" 
            style={{ '--card-accent': card.accent }}
          >
            <div className="metric-header">
              <span className="metric-title">{card.title}</span>
              <div className="metric-icon-wrap">
                <Icon size={20} />
              </div>
            </div>

            <div className="metric-value-wrap">
              <span className="metric-value">{card.value}</span>
              <span className="metric-unit">{card.unit}</span>
            </div>

            <div className="metric-footer">
              <span className={`metric-badge ${card.status.type}`}>
                {card.status.label}
              </span>
              <div className={`metric-trend ${card.trend.color}`}>
                <TrendIcon size={13} />
                <span>{card.trend.text}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
