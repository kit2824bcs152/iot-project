import React, { useState, useEffect } from 'react';
import { CloudLightning, Wifi, Cpu, Activity, BookOpen, RefreshCw } from 'lucide-react';

export default function Header({ isConnected, onOpenHardware, onRefreshAll, isRefreshing }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="header-wrapper">
      <div className="brand-section">
        <div className="brand-icon-box">
          <CloudLightning size={26} />
        </div>
        <div>
          <h1 className="brand-title">
            SMART WEATHER MONITORING &amp; ENVIRONMENTAL PREDICTION
          </h1>
          <div className="brand-subtitle">
            <span>IoT Sensor Telemetry</span>
            <span>•</span>
            <span>Deep Neural Network (DNN)</span>
            <span>•</span>
            <span>Generative AI Insights</span>
          </div>
        </div>
      </div>

      <div className="header-status-group">
        <div className="status-badge font-mono">
          <div className={`pulse-dot ${isConnected ? 'online' : 'offline'}`} />
          <span>{isConnected ? 'IoT TELEMETRY: LIVE' : 'CONNECTING...'}</span>
        </div>

        <div className="status-badge font-mono" style={{ color: '#94a3b8' }}>
          <span>{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</span>
        </div>

        <button 
          className="header-btn" 
          onClick={onRefreshAll} 
          title="Force refresh all analytics"
          disabled={isRefreshing}
        >
          <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
          <span>Sync</span>
        </button>

        <button className="header-btn primary" onClick={onOpenHardware}>
          <Cpu size={16} />
          <span>ESP32 Hardware &amp; Guide</span>
        </button>
      </div>
    </header>
  );
}
