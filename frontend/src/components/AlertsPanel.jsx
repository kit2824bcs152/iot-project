import React from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Droplets, 
  Wind, 
  Gauge, 
  CloudRain, 
  ShieldAlert, 
  CheckCheck, 
  Trash2 
} from 'lucide-react';

export default function AlertsPanel({ alerts, onAcknowledge, onClearAll }) {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'HIGH_TEMPERATURE': return Flame;
      case 'HIGH_HUMIDITY': return Droplets;
      case 'POOR_AQI':
      case 'HAZARDOUS_AQI': return ShieldAlert;
      case 'PRESSURE_ANOMALY': return Gauge;
      case 'HEAVY_RAINFALL': return CloudRain;
      case 'STRONG_WIND': return Wind;
      default: return AlertTriangle;
    }
  };

  const activeCount = alerts ? alerts.filter(a => a.status === 'active').length : 0;

  return (
    <div className="glass-panel alerts-card">
      <div className="alerts-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ShieldAlert size={20} style={{ color: activeCount > 0 ? '#f43f5e' : '#10b981' }} />
          <h3 className="font-heading" style={{ fontSize: '1.05rem', color: '#ffffff', marginLeft: '8px' }}>
            System Alerts &amp; Threshold Triggers
          </h3>
          {activeCount > 0 && <span className="alert-counter">{activeCount}</span>}
        </div>

        {activeCount > 0 && (
          <button
            className="header-btn"
            onClick={onClearAll}
            style={{ padding: '4px 10px', fontSize: '0.74rem', color: '#fb7185' }}
            title="Mark all as resolved"
          >
            <CheckCheck size={13} />
            <span>Resolve All</span>
          </button>
        )}
      </div>

      {(!alerts || alerts.length === 0) ? (
        <div style={{
          textAlign: 'center',
          padding: '30px 10px',
          color: '#64748b',
          fontSize: '0.85rem'
        }}>
          <ShieldAlert size={28} style={{ color: '#10b981', margin: '0 auto 8px auto', display: 'block', opacity: 0.8 }} />
          All environmental parameters are within safe nominal thresholds.
        </div>
      ) : (
        <div className="alert-list">
          {alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            const alertClass = isCritical ? 'critical' : isWarning ? 'warning' : 'info';
            const timeStr = new Date(alert.timestamp).toLocaleTimeString();

            return (
              <div key={alert._id || alert.timestamp} className={`alert-item ${alertClass}`}>
                <div style={{ marginTop: '2px' }}>
                  <Icon size={18} />
                </div>

                <div className="alert-body">
                  <div className="alert-type-title">
                    <span>{alert.type.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', opacity: 0.8 }}>
                      • {alert.severity}
                    </span>
                  </div>
                  <div className="alert-msg">{alert.message}</div>
                  <div className="alert-meta">
                    Triggered at {timeStr} | Recorded Value: {alert.value} (Limit: {alert.threshold})
                  </div>
                </div>

                {alert.status === 'active' && (
                  <button
                    className="ack-btn"
                    onClick={() => onAcknowledge(alert._id)}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
