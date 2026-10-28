import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Brain,
  Bot,
  ShieldAlert,
  Cpu,
  Radio,
  Sliders,
  Play,
  Pause,
  RefreshCw,
  Sun,
  Flame,
  CloudRain,
  AlertTriangle,
  Clock,
  Compass,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Layers,
  CheckCircle2,
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  SunMedium,
  Check,
  Copy,
  CheckCheck
} from 'lucide-react';

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

import {
  getSocket,
  getLatestSensorData,
  getSensorHistory,
  getCurrentPrediction,
  getModelMetrics,
  getAIInsights,
  getActiveAlerts,
  getAllAlerts,
  acknowledgeAlert,
  clearAlerts,
  getSimulatorStatus,
  setSimulatorScenario,
  toggleSimulator,
} from './services/api';

import './styles/App.css';

// Simulation scenarios
const SCENARIOS = [
  { id: 'NORMAL', label: 'Normal Baseline', icon: Sun, color: '#38bdf8' },
  { id: 'HEATWAVE', label: 'Heatwave (>40°C)', icon: Flame, color: '#f43f5e' },
  { id: 'STORM', label: 'Severe Storm (<985hPa)', icon: CloudRain, color: '#38bdf8' },
  { id: 'POOR_AIR', label: 'Hazardous AQI (>160)', icon: AlertTriangle, color: '#f59e0b' },
  { id: 'RAINY', label: 'Rainy Front (18mm)', icon: CloudRain, color: '#10b981' },
];

export default function App() {
  // Navigation active tab: 'live' | 'dnn' | 'genai' | 'alerts' | 'hardware'
  const [activeTab, setActiveTab] = useState('live');

  // Application Data States
  const [currentSensor, setCurrentSensor] = useState(null);
  const [previousSensor, setPreviousSensor] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [allAlertsHistory, setAllAlertsHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [activeScenario, setActiveScenario] = useState('NORMAL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showArch, setShowArch] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const currentSensorRef = useRef(null);
  currentSensorRef.current = currentSensor;

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all data
  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      const [latestRes, historyRes, predRes, metricsRes, aiRes, alertsRes, allAlertsRes, simRes] =
        await Promise.allSettled([
          getLatestSensorData(),
          getSensorHistory(35),
          getCurrentPrediction(),
          getModelMetrics(),
          getAIInsights(),
          getActiveAlerts(),
          getAllAlerts(20),
          getSimulatorStatus(),
        ]);

      if (latestRes.status === 'fulfilled' && latestRes.value?.data) {
        setPreviousSensor(currentSensorRef.current);
        setCurrentSensor(latestRes.value.data);
      }
      if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
        setSensorHistory(historyRes.value.data);
      }
      if (predRes.status === 'fulfilled' && predRes.value?.prediction) {
        setPrediction(predRes.value.prediction);
      }
      if (metricsRes.status === 'fulfilled' && metricsRes.value?.data) {
        setModelMetrics(metricsRes.value.data);
      }
      if (aiRes.status === 'fulfilled' && aiRes.value?.report) {
        setAiReport(aiRes.value.report);
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value?.data) {
        setAlerts(alertsRes.value.data);
      }
      if (allAlertsRes.status === 'fulfilled' && allAlertsRes.value?.data) {
        setAllAlertsHistory(allAlertsRes.value.data);
      }
      if (simRes.status === 'fulfilled' && simRes.value?.data) {
        setIsSimRunning(simRes.value.data.isRunning);
        setActiveScenario(simRes.value.data.scenario);
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Socket.IO realtime listener
  useEffect(() => {
    fetchAllData();

    const socket = getSocket();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('sensor_data', (newReading) => {
      setIsConnected(true);
      setPreviousSensor(currentSensorRef.current);
      setCurrentSensor(newReading);

      setSensorHistory((prev) => {
        const updated = [...prev, newReading];
        return updated.length > 35 ? updated.slice(updated.length - 35) : updated;
      });
    });

    socket.on('new_alert', (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev.filter((a) => a._id !== newAlert._id)]);
      setAllAlertsHistory((prev) => [newAlert, ...prev]);
    });

    const periodicSync = setInterval(async () => {
      try {
        const [predRes, alertsRes] = await Promise.allSettled([
          getCurrentPrediction(),
          getActiveAlerts(),
        ]);
        if (predRes.status === 'fulfilled' && predRes.value?.prediction) {
          setPrediction(predRes.value.prediction);
        }
        if (alertsRes.status === 'fulfilled' && alertsRes.value?.data) {
          setAlerts(alertsRes.value.data);
        }
      } catch (e) {
        // silent
      }
    }, 12000);

    return () => {
      clearInterval(periodicSync);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('sensor_data');
      socket.off('new_alert');
    };
  }, []);

  // Simulator scenario switch
  const handleScenarioChange = async (scenario) => {
    setActiveScenario(scenario);
    await setSimulatorScenario(scenario);
    setTimeout(async () => {
      const aiRes = await getAIInsights().catch(() => null);
      if (aiRes?.report) setAiReport(aiRes.report);
      const alertsRes = await getActiveAlerts().catch(() => null);
      if (alertsRes?.data) setAlerts(alertsRes.data);
    }, 3500);
  };

  const handleToggleSim = async (running) => {
    setIsSimRunning(running);
    await toggleSimulator(running);
  };

  const handleAcknowledgeAlert = async (id) => {
    await acknowledgeAlert(id);
    setAlerts((prev) => prev.filter((a) => a._id !== id));
  };

  const handleClearAlerts = async () => {
    await clearAlerts();
    setAlerts([]);
  };

  const handleRegenerateAI = async () => {
    setIsRefreshing(true);
    try {
      const aiRes = await getAIInsights();
      if (aiRes?.report) setAiReport(aiRes.report);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculations for Dew Point and Heat Index
  const calculateDewPoint = (T, RH) => {
    if (!T || !RH) return 18.0;
    const a = 17.27, b = 237.7;
    const alpha = ((a * T) / (b + T)) + Math.log(RH / 100.0);
    const dp = (b * alpha) / (a - alpha);
    return isNaN(dp) ? T : Number(dp.toFixed(1));
  };

  const calculateFeelsLike = (T, RH) => {
    if (!T || !RH) return 28.0;
    if (T < 26) return Number(T.toFixed(1));
    const hi = -8.784 + 1.611 * T + 2.338 * (RH / 100) - 0.146 * T * (RH / 100);
    return Number(Math.max(T, hi).toFixed(1));
  };

  const getDelta = (curr, prev) => {
    if (curr === undefined || prev === undefined || curr === null || prev === null) return { text: '0.0', isUp: false };
    const diff = curr - prev;
    return { text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`, isUp: diff > 0 };
  };

  // Chart preparation
  const chartData = sensorHistory.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    temperature: item.temperature,
    humidity: item.humidity,
    pressure: item.pressure,
    aqi: item.aqi,
    rainfall: item.rainfall,
    windSpeed: item.windSpeed,
  }));

  const compareData = chartData.map((pt, idx) => ({
    ...pt,
    actualTemp: pt.temperature,
    predictedTemp: idx === chartData.length - 1 ? pt.temperature : null,
  }));

  if (prediction && chartData.length > 0) {
    compareData.push({
      time: '+60m Forecast',
      actualTemp: null,
      predictedTemp: prediction.predictedTemperature,
      humidity: prediction.predictedHumidity,
      pressure: prediction.predictedPressure,
      aqi: prediction.predictedAQI,
    });
  }

  // Active alerts count
  const activeAlertCount = alerts.filter((a) => a.status === 'active').length;

  const curlSnippet = `curl -X POST http://localhost:5000/api/sensors/data \\
  -H "Content-Type: application/json" \\
  -d '{
    "temperature": 32.4,
    "humidity": 65.2,
    "pressure": 1011.5,
    "aqi": 78,
    "rainfall": 0.0,
    "windSpeed": 15.0,
    "lightIntensity": 820,
    "location": "ESP32-Node-01"
  }'`;

  return (
    <div className="app-shell">
      {/* 1. TOP EXECUTIVE HEADER */}
      <header className="top-nav-bar">
        <div className="brand-group">
          <div className="brand-logo-glow">
            <Radio size={22} />
          </div>
          <div>
            <h1 className="nav-title">SMART WEATHER MONITORING &amp; ENVIRONMENTAL PREDICTION</h1>
            <p className="nav-subtitle">IoT Sensing • TensorFlow DNN • Generative AI Environmental Insights</p>
          </div>
        </div>

        <div className="nav-controls">
          <div className="live-pill">
            <span className={`pulse-circle ${isConnected ? 'online' : 'connecting'}`} />
            <span>{isConnected ? 'IoT STREAM: ACTIVE' : 'CONNECTING...'}</span>
          </div>

          <div className="clock-pill font-mono">
            <Clock size={14} style={{ color: '#38bdf8' }} />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>

          <button
            className="icon-action-btn"
            onClick={fetchAllData}
            title="Force telemetry refresh"
            disabled={isRefreshing}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
          </button>
        </div>
      </header>

      {/* 2. SUB-HEADER SCENARIO BAR & TABS NAVIGATION */}
      <div className="sub-header-bar">
        {/* Navigation Tabs */}
        <nav className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <Activity size={17} />
            <span>Live Telemetry</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'dnn' ? 'active' : ''}`}
            onClick={() => setActiveTab('dnn')}
          >
            <Brain size={17} />
            <span>DNN Forecast</span>
            <span className="tab-tag">94% Acc</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'genai' ? 'active' : ''}`}
            onClick={() => setActiveTab('genai')}
          >
            <Bot size={17} />
            <span>GenAI Analysis</span>
            <span className="tab-tag gemini">Gemini</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <ShieldAlert size={17} />
            <span>Threshold Alerts</span>
            {activeAlertCount > 0 && <span className="tab-alert-badge">{activeAlertCount}</span>}
          </button>

          <button
            className={`tab-btn ${activeTab === 'hardware' ? 'active' : ''}`}
            onClick={() => setActiveTab('hardware')}
          >
            <Cpu size={17} />
            <span>ESP32 Hardware</span>
          </button>
        </nav>

        {/* Simulator Preset Control */}
        <div className="quick-sim-bar">
          <div className="sim-mode-toggle">
            <button
              className={`sim-toggle-btn ${isSimRunning ? 'running' : 'paused'}`}
              onClick={() => handleToggleSim(!isSimRunning)}
            >
              {isSimRunning ? <Pause size={12} /> : <Play size={12} />}
              <span>{isSimRunning ? 'Simulator' : 'Paused'}</span>
            </button>
          </div>

          <div className="scenario-chips">
            {SCENARIOS.map((sc) => {
              const Icon = sc.icon;
              return (
                <button
                  key={sc.id}
                  className={`scenario-chip ${activeScenario === sc.id ? 'active' : ''}`}
                  onClick={() => handleScenarioChange(sc.id)}
                  title={`Trigger ${sc.label}`}
                >
                  <Icon size={12} />
                  <span>{sc.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. DEDICATED TAB VIEWS */}
      <main className="tab-content-area">
        {/* ========================================================
            VIEW 1: LIVE SENSOR TELEMETRY & BIOMETEOROLOGY
            ======================================================== */}
        {activeTab === 'live' && (
          <div className="view-container animate-fade-in">
            {/* Real-time Metric Cards Row */}
            <div className="clean-metrics-row">
              {/* Temperature */}
              <div className="neat-metric-box temp-theme">
                <div className="box-top">
                  <span className="metric-label">Temperature</span>
                  <div className="box-icon"><Thermometer size={18} /></div>
                </div>
                <div className="box-main">
                  <span className="big-num">{currentSensor?.temperature?.toFixed(1) || '28.5'}</span>
                  <span className="num-unit">°C</span>
                </div>
                <div className="box-foot">
                  <span className={`status-pill ${currentSensor?.temperature >= 40 ? 'critical' : currentSensor?.temperature >= 33 ? 'warning' : 'safe'}`}>
                    {currentSensor?.temperature >= 40 ? 'Extreme Heat' : currentSensor?.temperature >= 33 ? 'Warm' : 'Optimal'}
                  </span>
                  <span className="trend-text">
                    Δ {getDelta(currentSensor?.temperature, previousSensor?.temperature).text}°C
                  </span>
                </div>
              </div>

              {/* Humidity */}
              <div className="neat-metric-box humidity-theme">
                <div className="box-top">
                  <span className="metric-label">Relative Humidity</span>
                  <div className="box-icon"><Droplets size={18} /></div>
                </div>
                <div className="box-main">
                  <span className="big-num">{currentSensor?.humidity?.toFixed(1) || '62.0'}</span>
                  <span className="num-unit">%</span>
                </div>
                <div className="box-foot">
                  <span className={`status-pill ${currentSensor?.humidity >= 85 ? 'critical' : currentSensor?.humidity >= 70 ? 'warning' : 'safe'}`}>
                    {currentSensor?.humidity >= 85 ? 'Saturated' : currentSensor?.humidity >= 70 ? 'Humid' : 'Comfortable'}
                  </span>
                  <span className="trend-text">
                    Δ {getDelta(currentSensor?.humidity, previousSensor?.humidity).text}%
                  </span>
                </div>
              </div>

              {/* Pressure */}
              <div className="neat-metric-box pressure-theme">
                <div className="box-top">
                  <span className="metric-label">Barometric Pressure</span>
                  <div className="box-icon"><Gauge size={18} /></div>
                </div>
                <div className="box-main">
                  <span className="big-num">{currentSensor?.pressure?.toFixed(1) || '1012.8'}</span>
                  <span className="num-unit">hPa</span>
                </div>
                <div className="box-foot">
                  <span className={`status-pill ${currentSensor?.pressure <= 985 ? 'critical' : 'safe'}`}>
                    {currentSensor?.pressure <= 985 ? 'Storm Depression' : 'Stable Atm'}
                  </span>
                  <span className="trend-text">
                    Δ {getDelta(currentSensor?.pressure, previousSensor?.pressure).text} hPa
                  </span>
                </div>
              </div>

              {/* Air Quality */}
              <div className="neat-metric-box aqi-theme">
                <div className="box-top">
                  <span className="metric-label">Air Quality Index</span>
                  <div className="box-icon"><Activity size={18} /></div>
                </div>
                <div className="box-main">
                  <span className="big-num">{Math.round(currentSensor?.aqi || 65)}</span>
                  <span className="num-unit">AQI</span>
                </div>
                <div className="box-foot">
                  <span className={`status-pill ${currentSensor?.aqi >= 150 ? 'critical' : currentSensor?.aqi >= 100 ? 'warning' : 'safe'}`}>
                    {currentSensor?.aqi >= 150 ? 'Unhealthy' : currentSensor?.aqi >= 100 ? 'Moderate' : 'Good'}
                  </span>
                  <span className="trend-text">
                    Δ {getDelta(currentSensor?.aqi, previousSensor?.aqi).text}
                  </span>
                </div>
              </div>

              {/* Rainfall */}
              <div className="neat-metric-box rain-theme">
                <div className="box-top">
                  <span className="metric-label">Precipitation</span>
                  <div className="box-icon"><CloudRain size={18} /></div>
                </div>
                <div className="box-main">
                  <span className="big-num">{currentSensor?.rainfall?.toFixed(1) || '0.0'}</span>
                  <span className="num-unit">mm</span>
                </div>
                <div className="box-foot">
                  <span className={`status-pill ${currentSensor?.rainfall >= 25 ? 'critical' : currentSensor?.rainfall > 0 ? 'warning' : 'safe'}`}>
                    {currentSensor?.rainfall >= 25 ? 'Heavy Rain' : currentSensor?.rainfall > 0 ? 'Drizzle' : 'Dry'}
                  </span>
                  <span className="trend-text">
                    {currentSensor?.rainfall > 0 ? 'Active' : 'No Rain'}
                  </span>
                </div>
              </div>

              {/* Wind Speed */}
              <div className="neat-metric-box wind-theme">
                <div className="box-top">
                  <span className="metric-label">Wind Velocity</span>
                  <div className="box-icon"><Wind size={18} /></div>
                </div>
                <div className="box-main">
                  <span className="big-num">{currentSensor?.windSpeed?.toFixed(1) || '14.2'}</span>
                  <span className="num-unit">km/h</span>
                </div>
                <div className="box-foot">
                  <span className={`status-pill ${currentSensor?.windSpeed >= 40 ? 'critical' : currentSensor?.windSpeed >= 25 ? 'warning' : 'safe'}`}>
                    {currentSensor?.windSpeed >= 40 ? 'Gale Gust' : 'Breeze'}
                  </span>
                  <span className="trend-text">
                    Δ {getDelta(currentSensor?.windSpeed, previousSensor?.windSpeed).text}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Split: Live Trend Chart + Biometeorology Panel */}
            <div className="two-col-layout">
              {/* Left: Continuous Live Telemetry Chart */}
              <div className="neat-card">
                <div className="card-header-clean">
                  <div className="title-with-dot">
                    <span className="pulse-circle online" />
                    <h3>Live Real-Time Telemetry Stream</h3>
                  </div>
                  <span className="badge-subtle font-mono">Sampling: 3.0s</span>
                </div>
                <div style={{ height: '320px', width: '100%', marginTop: '12px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="t" stroke="#f43f5e" unit="°C" tick={{ fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
                      <YAxis yAxisId="h" orientation="right" stroke="#38bdf8" unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0c101a',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '0.8rem'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                      <Line yAxisId="t" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f43f5e" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                      <Line yAxisId="h" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#38bdf8" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right: Biometeorological Gauges & Station Details */}
              <div className="neat-card">
                <div className="card-header-clean">
                  <h3>Biometeorology &amp; Microclimate</h3>
                  <span className="badge-subtle">Calculated Indices</span>
                </div>

                <div className="biomet-grid">
                  <div className="biomet-cell">
                    <span className="biomet-label">HEAT INDEX ("FEELS LIKE")</span>
                    <div className="biomet-val text-rose">
                      {calculateFeelsLike(currentSensor?.temperature, currentSensor?.humidity)} <span className="unit">°C</span>
                    </div>
                    <span className="biomet-desc">Apparent thermal perception</span>
                  </div>

                  <div className="biomet-cell">
                    <span className="biomet-label">DEW POINT CONDENSATION</span>
                    <div className="biomet-val text-blue">
                      {calculateDewPoint(currentSensor?.temperature, currentSensor?.humidity)} <span className="unit">°C</span>
                    </div>
                    <span className="biomet-desc">Moisture saturation threshold</span>
                  </div>

                  <div className="biomet-cell">
                    <span className="biomet-label">SOLAR RADIATION / LUX</span>
                    <div className="biomet-val text-amber">
                      {Math.round(currentSensor?.lightIntensity || 650)} <span className="unit">Lux</span>
                    </div>
                    <span className="biomet-desc">Ambient LDR photocell</span>
                  </div>

                  <div className="biomet-cell">
                    <span className="biomet-label">STATION LOCATION</span>
                    <div className="biomet-val text-emerald" style={{ fontSize: '1.05rem', marginTop: '6px' }}>
                      Environmental Lab
                    </div>
                    <span className="biomet-desc">Node: ESP32-Station-01</span>
                  </div>
                </div>

                <div className="quick-summary-box">
                  <Sparkles size={16} style={{ color: '#00f2fe', flexShrink: 0 }} />
                  <p>
                    {aiReport?.weatherSummary || 'Station operating normally. Atmospheric pressure and ambient temperature within nominal bounds.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 2: DEEP NEURAL NETWORK (DNN) PREDICTIONS
            ======================================================== */}
        {activeTab === 'dnn' && (
          <div className="view-container animate-fade-in">
            {/* DNN Forecast Highlight Cards */}
            <div className="dnn-forecast-row">
              <div className="dnn-box">
                <span className="dnn-box-title">Future Temperature (t+60m)</span>
                <div className="dnn-box-val text-rose">
                  {prediction?.predictedTemperature?.toFixed(1) || '31.8'} <span className="unit">°C</span>
                </div>
                <div className="dnn-delta">
                  <TrendingUp size={13} style={{ color: '#f43f5e' }} />
                  <span>DNN Dense Predictor (Model v1.0)</span>
                </div>
              </div>

              <div className="dnn-box">
                <span className="dnn-box-title">Future Humidity (t+60m)</span>
                <div className="dnn-box-val text-blue">
                  {prediction?.predictedHumidity?.toFixed(1) || '63.2'} <span className="unit">%</span>
                </div>
                <div className="dnn-delta">
                  <TrendingDown size={13} style={{ color: '#38bdf8' }} />
                  <span>Thermodynamic Inverse Shift</span>
                </div>
              </div>

              <div className="dnn-box">
                <span className="dnn-box-title">Future Pressure (t+60m)</span>
                <div className="dnn-box-val text-purple">
                  {prediction?.predictedPressure?.toFixed(1) || '1014.2'} <span className="unit">hPa</span>
                </div>
                <div className="dnn-delta">
                  <Minus size={13} style={{ color: '#94a3b8' }} />
                  <span>Barometric Wave Projection</span>
                </div>
              </div>

              <div className="dnn-box">
                <span className="dnn-box-title">Future AQI (t+60m)</span>
                <div className="dnn-box-val text-emerald">
                  {Math.round(prediction?.predictedAQI || 58)} <span className="unit">AQI</span>
                </div>
                <div className="dnn-delta">
                  <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                  <span>Confidence: {Math.round((prediction?.confidenceScore || 0.94) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Actual vs DNN Prediction Comparison Chart */}
            <div className="neat-card" style={{ marginBottom: '24px' }}>
              <div className="card-header-clean">
                <div>
                  <h3>Actual Recorded Telemetry vs DNN Future Trajectory</h3>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                    Comparing actual sensor history against the +1 hour Deep Neural Network predictive horizon
                  </p>
                </div>
                <span className="badge-dnn font-mono">Dense 128 → 64 → 32 → 4</span>
              </div>

              <div style={{ height: '340px', width: '100%', marginTop: '16px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 11 }} unit="°C" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0c101a',
                        borderColor: 'rgba(168, 85, 247, 0.4)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.8rem' }} />
                    <Line
                      type="monotone"
                      dataKey="actualTemp"
                      name="Actual Temperature (°C)"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#38bdf8' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predictedTemp"
                      name="DNN Forecast Horizon (°C)"
                      stroke="#c084fc"
                      strokeWidth={3}
                      strokeDasharray="6 6"
                      dot={{ r: 7, fill: '#c084fc', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Neural Architecture & Performance Metrics Split */}
            <div className="two-col-layout">
              {/* Architecture Blueprint */}
              <div className="neat-card">
                <div className="card-header-clean">
                  <h3>TensorFlow / Keras Architecture</h3>
                  <span className="badge-subtle">TensorFlow 2.21.0</span>
                </div>

                <div className="dnn-arch-diagram">
                  <div className="arch-layer input">
                    <span className="layer-tag">Input Layer</span>
                    <span className="layer-neurons">7 Features (T, RH, P, AQI, Rain, Wind, Lux)</span>
                  </div>
                  <div className="arch-arrow">↓ Dense Connection + Dropout(0.20)</div>
                  <div className="arch-layer hidden">
                    <span className="layer-tag">Hidden Layer 1</span>
                    <span className="layer-neurons">Dense (128 Neurons, ReLU Activation)</span>
                  </div>
                  <div className="arch-arrow">↓ Dense Connection + Dropout(0.20)</div>
                  <div className="arch-layer hidden">
                    <span className="layer-tag">Hidden Layer 2</span>
                    <span className="layer-neurons">Dense (64 Neurons, ReLU Activation)</span>
                  </div>
                  <div className="arch-arrow">↓ Dense Connection</div>
                  <div className="arch-layer hidden">
                    <span className="layer-tag">Hidden Layer 3</span>
                    <span className="layer-neurons">Dense (32 Neurons, ReLU Activation)</span>
                  </div>
                  <div className="arch-arrow">↓ Linear Regression Output</div>
                  <div className="arch-layer output">
                    <span className="layer-tag">Output Layer</span>
                    <span className="layer-neurons">4 Predictors (Future Temp, RH, Pressure, AQI)</span>
                  </div>
                </div>
              </div>

              {/* Validation Metrics Table */}
              <div className="neat-card">
                <div className="card-header-clean">
                  <h3>DNN Validation Performance (5,000 Records)</h3>
                  <span className="badge-subtle text-emerald">Converged (32 Epochs)</span>
                </div>

                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Target Metric</th>
                      <th>MAE</th>
                      <th>RMSE</th>
                      <th>R² Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Temperature (°C)</td>
                      <td>1.291</td>
                      <td>1.597</td>
                      <td className="text-emerald font-bold">0.9311</td>
                    </tr>
                    <tr>
                      <td>Relative Humidity (%)</td>
                      <td>3.330</td>
                      <td>4.109</td>
                      <td className="text-emerald font-bold">0.8670</td>
                    </tr>
                    <tr>
                      <td>Barometric Pressure (hPa)</td>
                      <td>1.320</td>
                      <td>1.660</td>
                      <td className="text-emerald font-bold">0.8582</td>
                    </tr>
                    <tr>
                      <td>Air Quality (AQI)</td>
                      <td>6.361</td>
                      <td>8.060</td>
                      <td className="text-blue font-bold">0.8477</td>
                    </tr>
                  </tbody>
                </table>

                <div className="metrics-callout">
                  <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>The DNN model achieves strong predictive alignment with an overall $R^2$ of <strong>0.876</strong> on unseen test datasets.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 3: GENERATIVE AI INTELLIGENCE & ADVISORY
            ======================================================== */}
        {activeTab === 'genai' && (
          <div className="view-container animate-fade-in">
            <div className="neat-card genai-master-card">
              <div className="card-header-clean">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="ai-gemini-icon">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h3>GenAI Environmental Narrative &amp; Advisory</h3>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Contextual environmental report synthesized from live sensors and DNN predictions
                    </p>
                  </div>
                </div>

                <button
                  className="refresh-ai-btn"
                  onClick={handleRegenerateAI}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
                  <span>{isRefreshing ? 'Synthesizing...' : 'Regenerate Analysis'}</span>
                </button>
              </div>

              {/* 1. Real-time condition narrative */}
              <div className="ai-section-block">
                <span className="ai-subhead">1. Real-Time Condition Summary</span>
                <div className="ai-quote-box cyan-border">
                  {aiReport?.weatherSummary || 'Generating live meteorological summary...'}
                </div>
              </div>

              {/* 2. DNN Trajectory interpretation */}
              <div className="ai-section-block">
                <span className="ai-subhead">2. Deep Neural Network Trajectory Interpretation</span>
                <div className="ai-quote-box purple-border">
                  {aiReport?.predictionExplanation || 'Analyzing 60-minute future forecast horizon...'}
                </div>
              </div>

              {/* 3. Risk Hazards Assessment */}
              <div className="ai-section-block">
                <span className="ai-subhead">3. Environmental Hazard &amp; Risk Assessment</span>
                <div className="risk-cards-grid">
                  {aiReport?.environmentalRisks?.map((risk, idx) => {
                    const lvl = (risk.level || 'Low').toLowerCase();
                    const badgeClass = lvl === 'severe' || lvl === 'high' ? 'crit' : lvl === 'moderate' ? 'warn' : 'ok';
                    return (
                      <div key={idx} className="risk-card">
                        <div className="risk-card-top">
                          <strong>{risk.category}</strong>
                          <span className={`risk-pill ${badgeClass}`}>{risk.level} Risk</span>
                        </div>
                        <p className="risk-card-text">{risk.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Practical Actionable Recommendations */}
              <div className="ai-section-block">
                <span className="ai-subhead">4. Actionable Safeguards &amp; Operational Recommendations</span>
                <ul className="recom-list">
                  {aiReport?.recommendations?.map((rec, idx) => (
                    <li key={idx}>
                      <span className="recom-bullet">✦</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 5. Future Outlook */}
              {aiReport?.futureOutlook && (
                <div className="future-outlook-banner">
                  <Compass size={20} style={{ color: '#38bdf8', flexShrink: 0 }} />
                  <div>
                    <strong>60-Minute Weather Outlook: </strong>
                    <span>{aiReport.futureOutlook}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 4: THRESHOLD ALERTS & SAFETY CENTER
            ======================================================== */}
        {activeTab === 'alerts' && (
          <div className="view-container animate-fade-in">
            <div className="two-col-layout">
              {/* Active & Recent Alerts */}
              <div className="neat-card">
                <div className="card-header-clean">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={20} style={{ color: activeAlertCount > 0 ? '#f43f5e' : '#10b981' }} />
                    <h3>Triggered Environmental Alerts</h3>
                    {activeAlertCount > 0 && <span className="tab-alert-badge">{activeAlertCount} Active</span>}
                  </div>

                  {activeAlertCount > 0 && (
                    <button className="small-action-btn" onClick={handleClearAlerts}>
                      <CheckCheck size={14} />
                      <span>Resolve All</span>
                    </button>
                  )}
                </div>

                {alerts.length === 0 ? (
                  <div className="empty-state-box">
                    <CheckCircle2 size={36} style={{ color: '#10b981', marginBottom: '8px' }} />
                    <p>No active alerts. All parameters are within normal threshold boundaries.</p>
                  </div>
                ) : (
                  <div className="alerts-clean-list">
                    {alerts.map((alert) => (
                      <div key={alert._id || alert.timestamp} className={`alert-row ${alert.severity}`}>
                        <div className="alert-row-left">
                          <span className="alert-type-name">{alert.type.replace(/_/g, ' ')}</span>
                          <p className="alert-text">{alert.message}</p>
                          <span className="alert-time font-mono">
                            {new Date(alert.timestamp).toLocaleTimeString()} • Recorded: {alert.value} (Threshold: {alert.threshold})
                          </span>
                        </div>
                        {alert.status === 'active' && (
                          <button
                            className="ack-clean-btn"
                            onClick={() => handleAcknowledgeAlert(alert._id)}
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Predefined Safety Thresholds Reference */}
              <div className="neat-card">
                <div className="card-header-clean">
                  <h3>Defined Safety Thresholds</h3>
                  <span className="badge-subtle">Trigger Criteria</span>
                </div>

                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Condition</th>
                      <th>Warning Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Temperature</td>
                      <td>&gt; 40.0 °C</td>
                      <td><span className="pill-warn">High Temperature</span></td>
                    </tr>
                    <tr>
                      <td>Relative Humidity</td>
                      <td>&gt; 85.0 %</td>
                      <td><span className="pill-warn">High Humidity</span></td>
                    </tr>
                    <tr>
                      <td>Air Quality (AQI)</td>
                      <td>&gt; 150 AQI</td>
                      <td><span className="pill-crit">Poor / Hazardous Air</span></td>
                    </tr>
                    <tr>
                      <td>Atmospheric Pressure</td>
                      <td>&lt; 985.0 hPa</td>
                      <td><span className="pill-crit">Barometric Depression</span></td>
                    </tr>
                    <tr>
                      <td>Rainfall Precipitation</td>
                      <td>&gt; 25.0 mm</td>
                      <td><span className="pill-warn">Heavy Rainfall</span></td>
                    </tr>
                    <tr>
                      <td>Wind Velocity</td>
                      <td>&gt; 40.0 km/h</td>
                      <td><span className="pill-warn">Gale Warning</span></td>
                    </tr>
                  </tbody>
                </table>

                <div className="quick-info-box">
                  <p>When an incoming sensor reading breaches these thresholds, an alert is automatically generated, persisted to MongoDB, and broadcasted via WebSockets.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 5: IOT HARDWARE NODE INTEGRATION
            ======================================================== */}
        {activeTab === 'hardware' && (
          <div className="view-container animate-fade-in">
            <div className="two-col-layout">
              {/* Pinout Connection Table */}
              <div className="neat-card">
                <div className="card-header-clean">
                  <h3>ESP32 Microcontroller Pinout Table</h3>
                  <span className="badge-subtle">Hardware Spec</span>
                </div>

                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Sensor Model</th>
                      <th>ESP32 Pin</th>
                      <th>Protocol</th>
                      <th>Measured Variable</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>DHT22 / AM2302</strong></td>
                      <td>GPIO 4 (D4)</td>
                      <td>1-Wire Digital</td>
                      <td>Temperature (°C) &amp; Humidity (%)</td>
                    </tr>
                    <tr>
                      <td><strong>BMP280 / BME280</strong></td>
                      <td>GPIO 21 (SDA), 22 (SCL)</td>
                      <td>I2C Bus</td>
                      <td>Barometric Pressure (hPa)</td>
                    </tr>
                    <tr>
                      <td><strong>MQ-135 Gas Sensor</strong></td>
                      <td>GPIO 34 (ADC1_CH6)</td>
                      <td>Analog (0-4095)</td>
                      <td>Toxic Gases &amp; AQI index</td>
                    </tr>
                    <tr>
                      <td><strong>FC-37 Rain Board</strong></td>
                      <td>GPIO 35 (ADC1_CH7)</td>
                      <td>Analog / Digital</td>
                      <td>Surface Rain accumulation</td>
                    </tr>
                    <tr>
                      <td><strong>LDR Photoresistor</strong></td>
                      <td>GPIO 32 (ADC1_CH4)</td>
                      <td>Analog Divider</td>
                      <td>Solar Daylight Intensity (Lux)</td>
                    </tr>
                  </tbody>
                </table>

                <div className="code-box-wrap">
                  <div className="code-header">
                    <span>ESP32 Arduino Firmware: iot/esp32_firmware.ino</span>
                  </div>
                  <pre className="code-block font-mono">
{`#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* serverEndpoint = "http://192.168.1.100:5000/api/sensors/data";

void readAndTransmitData() {
  StaticJsonDocument<300> doc;
  doc["temperature"] = dht.readTemperature();
  doc["humidity"] = dht.readHumidity();
  doc["pressure"] = bmp.readPressure() / 100.0F;
  doc["aqi"] = map(analogRead(34), 200, 3200, 30, 250);
  doc["location"] = "ESP32-Station-01";
  
  HTTPClient http;
  http.begin(serverEndpoint);
  http.addHeader("Content-Type", "application/json");
  String payload;
  serializeJson(doc, payload);
  http.POST(payload);
  http.end();
}`}
                  </pre>
                </div>
              </div>

              {/* Ingestion API & Testing Console */}
              <div className="neat-card">
                <div className="card-header-clean">
                  <h3>HTTP REST Ingestion Protocol</h3>
                  <span className="badge-subtle font-mono">POST /api/sensors/data</span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  The backend accepts telemetry via <code>HTTP POST /api/sensors/data</code>. You can test manual sensor feeds using this cURL request:
                </p>

                <div style={{ position: 'relative', marginTop: '12px' }}>
                  <pre className="code-block font-mono">{curlSnippet}</pre>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(curlSnippet);
                      setCopiedCurl(true);
                      setTimeout(() => setCopiedCurl(false), 2000);
                    }}
                  >
                    {copiedCurl ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>

                <div className="quick-info-box" style={{ marginTop: '20px' }}>
                  <strong>Dual Input Support:</strong> If real hardware is disconnected, the integrated <strong>IoT Physics Simulator</strong> automatically takes over, supplying correlated diurnal weather cycles so that the dashboard and DNN model always receive live inputs.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
