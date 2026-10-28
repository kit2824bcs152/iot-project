import React from 'react';
import { Sliders, Play, Pause, Flame, CloudRain, Wind, AlertTriangle, Sun } from 'lucide-react';

const SCENARIOS = [
  { id: 'NORMAL', label: 'Normal Baseline', icon: Sun, color: '#38bdf8' },
  { id: 'HEATWAVE', label: 'Heatwave (>40°C)', icon: Flame, color: '#f43f5e' },
  { id: 'STORM', label: 'Severe Storm (<985hPa)', icon: CloudRain, color: '#38bdf8' },
  { id: 'POOR_AIR', label: 'Hazardous AQI (>160)', icon: AlertTriangle, color: '#f59e0b' },
  { id: 'RAINY', label: 'Rainy Front (18mm)', icon: CloudRain, color: '#10b981' },
];

export default function SimulationControls({ currentScenario, isSimRunning, onSelectScenario, onToggleSim }) {
  return (
    <div className="sim-control-bar">
      <div className="sim-label-group">
        <Sliders size={18} style={{ color: '#00f2fe' }} />
        <span>IoT Data Source:</span>
        <button
          className={`header-btn ${isSimRunning ? 'primary' : ''}`}
          onClick={() => onToggleSim(!isSimRunning)}
          style={{ padding: '4px 12px', fontSize: '0.78rem' }}
        >
          {isSimRunning ? <Pause size={14} /> : <Play size={14} />}
          <span>{isSimRunning ? 'Simulator Active' : 'Simulator Paused'}</span>
        </button>
      </div>

      <div className="scenario-pill-group">
        <span style={{ fontSize: '0.78rem', color: '#64748b', alignSelf: 'center', marginRight: '6px' }}>
          Simulate Condition:
        </span>
        {SCENARIOS.map((sc) => {
          const Icon = sc.icon;
          const isActive = currentScenario === sc.id;
          return (
            <button
              key={sc.id}
              className={`scenario-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectScenario(sc.id)}
            >
              <Icon size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: '-1px' }} />
              <span>{sc.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
