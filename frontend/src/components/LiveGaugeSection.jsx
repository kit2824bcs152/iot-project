import React from 'react';
import { SunMedium, Compass, Flame, Droplets, MapPin, Radio } from 'lucide-react';

export default function LiveGaugeSection({ current }) {
  if (!current) return null;

  // Magnus-Tetens formula for Dew Point
  const calculateDewPoint = (T, RH) => {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * T) / (b + T)) + Math.log(RH / 100.0);
    const dewPoint = (b * alpha) / (a - alpha);
    return isNaN(dewPoint) ? T : dewPoint.toFixed(1);
  };

  // Simplified Heat Index approximation
  const calculateFeelsLike = (T, RH) => {
    if (T < 26) return T.toFixed(1);
    const hi = -8.784 + 1.611 * T + 2.338 * (RH / 100) - 0.146 * T * (RH / 100);
    return Math.max(T, hi).toFixed(1);
  };

  const dewPoint = calculateDewPoint(current.temperature, current.humidity);
  const feelsLike = calculateFeelsLike(current.temperature, current.humidity);

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} style={{ color: '#00f2fe' }} />
          <h3 className="font-heading" style={{ fontSize: '1rem', color: '#ffffff' }}>
            Live Environmental Biometeorology &amp; Station Telemetry
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
          <MapPin size={14} style={{ color: '#38bdf8' }} />
          <span>{current.location || 'IoT-Station-01 (Environmental Lab)'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div style={{ padding: '14px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
            <span>FEELS LIKE / HEAT INDEX</span>
            <Flame size={16} style={{ color: '#f43f5e' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '6px', color: '#ffffff' }}>
            {feelsLike} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>°C</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            Thermal comfort index
          </div>
        </div>

        <div style={{ padding: '14px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
            <span>DEW POINT CONDENSATION</span>
            <Droplets size={16} style={{ color: '#38bdf8' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '6px', color: '#ffffff' }}>
            {dewPoint} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>°C</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            Moisture saturation point
          </div>
        </div>

        <div style={{ padding: '14px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
            <span>LIGHT INTENSITY (LDR)</span>
            <SunMedium size={16} style={{ color: '#fbbf24' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '6px', color: '#ffffff' }}>
            {Math.round(current.lightIntensity || 650)} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Lux</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            {(current.lightIntensity || 650) > 800 ? 'Direct Sunlight' : 'Ambient Daylight'}
          </div>
        </div>

        <div style={{ padding: '14px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
            <span>AIR STABILITY</span>
            <Compass size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '6px', color: '#ffffff' }}>
            {current.windSpeed < 10 ? 'Calm' : current.windSpeed < 25 ? 'Moderate' : 'Gale Gusts'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            Atmospheric dispersion
          </div>
        </div>
      </div>
    </div>
  );
}
