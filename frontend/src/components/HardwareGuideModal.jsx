import React, { useState } from 'react';
import { X, Cpu, Copy, Check, Terminal, ExternalLink, HardDrive } from 'lucide-react';

export default function HardwareGuideModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const curlExample = `curl -X POST http://localhost:5000/api/sensors/data \\
  -H "Content-Type: application/json" \\
  -d '{
    "temperature": 32.4,
    "humidity": 65.2,
    "pressure": 1011.5,
    "aqi": 78,
    "rainfall": 0.0,
    "windSpeed": 15.0,
    "lightIntensity": 820,
    "location": "ESP32-Node-Lab01"
  }'`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(curlExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={22} style={{ color: '#00f2fe' }} />
            <h2 className="font-heading" style={{ fontSize: '1.25rem', color: '#ffffff' }}>
              IoT ESP32 Hardware Integration &amp; Pinout
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <h4 style={{ color: '#38bdf8', marginBottom: '8px' }}>Supported Sensors &amp; Microcontroller</h4>
          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '14px' }}>
            The physical environmental monitoring node is built using an <strong>ESP32-WROOM-32</strong> dual-core microcontroller connected to 5 environmental transducers via I2C and analog-to-digital channels.
          </p>

          <table className="metrics-table" style={{ marginBottom: '18px' }}>
            <thead>
              <tr>
                <th>Sensor Type</th>
                <th>Model</th>
                <th>ESP32 Pin</th>
                <th>Parameter Measured</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Digital Temperature &amp; Humidity</td>
                <td>DHT22 / AM2302</td>
                <td>GPIO 4 (D4)</td>
                <td>Temperature (°C) &amp; Humidity (%)</td>
              </tr>
              <tr>
                <td>Digital Barometer</td>
                <td>BMP280 / BME280</td>
                <td>GPIO 21 (SDA), GPIO 22 (SCL)</td>
                <td>Barometric Pressure (hPa)</td>
              </tr>
              <tr>
                <td>Air Quality Gas Sensor</td>
                <td>MQ-135 Gas Sensor</td>
                <td>GPIO 34 (Analog A0)</td>
                <td>Toxic gases, smoke &amp; AQI</td>
              </tr>
              <tr>
                <td>Precipitation Detector</td>
                <td>FC-37 Rain Board</td>
                <td>GPIO 35 (Analog)</td>
                <td>Surface Rainfall accumulation</td>
              </tr>
              <tr>
                <td>Ambient Light Sensor</td>
                <td>LDR Photoresistor</td>
                <td>GPIO 32 (Analog)</td>
                <td>Solar Light Intensity (Lux)</td>
              </tr>
            </tbody>
          </table>

          <h4 style={{ color: '#38bdf8', margin: '14px 0 6px 0' }}>HTTP REST Ingestion Protocol</h4>
          <p style={{ color: '#cbd5e1', fontSize: '0.84rem' }}>
            Physical hardware nodes POST telemetry to endpoint <code>/api/sensors/data</code> every 5 seconds.
          </p>

          <div style={{ position: 'relative' }}>
            <div className="code-snippet">{curlExample}</div>
            <button
              onClick={copyToClipboard}
              style={{
                position: 'absolute',
                top: '18px',
                right: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div style={{ marginTop: '14px', fontSize: '0.8rem', color: '#94a3b8' }}>
            Complete Arduino C++ sketch available in workspace at: <code>iot/esp32_firmware.ino</code>
          </div>
        </div>
      </div>
    </div>
  );
}
