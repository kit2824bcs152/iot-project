import React, { useState } from 'react';
import { Sparkles, Bot, AlertTriangle, ShieldCheck, RefreshCw, Compass } from 'lucide-react';

export default function GenAIReport({ report, onRegenerate, isLoading }) {
  if (!report) {
    return (
      <div className="glass-panel genai-panel" style={{ textAlign: 'center', padding: '40px' }}>
        <Sparkles size={28} style={{ color: '#00f2fe', marginBottom: '12px' }} />
        <p style={{ color: '#94a3b8' }}>Synthesizing Generative AI Environmental Insights...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel genai-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(2, 132, 199, 0.2))',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00f2fe'
          }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-heading" style={{ fontSize: '1.05rem', color: '#ffffff' }}>
              Generative AI Environmental Intelligence
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {report.source || 'LLM Agent'}
            </span>
          </div>
        </div>

        <button
          className="header-btn"
          onClick={onRegenerate}
          disabled={isLoading}
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
        >
          <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
          <span>{isLoading ? 'Analyzing...' : 'Refresh AI'}</span>
        </button>
      </div>

      {/* 1. Live Weather Summary */}
      <div>
        <span style={{ fontSize: '0.76rem', color: '#00f2fe', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Real-Time Condition Summary
        </span>
        <div className="ai-narrative-box">
          {report.weatherSummary}
        </div>
      </div>

      {/* 2. DNN Trajectory Analysis */}
      <div>
        <span style={{ fontSize: '0.76rem', color: '#c084fc', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          DNN Forecast Interpretation (60-Min Horizon)
        </span>
        <div className="ai-narrative-box" style={{ borderLeftColor: '#c084fc' }}>
          {report.predictionExplanation}
        </div>
      </div>

      {/* 3. Environmental Risks */}
      <div style={{ margin: '14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <AlertTriangle size={15} style={{ color: '#fbbf24' }} />
          <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: '700', textTransform: 'uppercase' }}>
            Risk Evaluation &amp; Hazards
          </span>
        </div>
        <div className="ai-risk-card-group">
          {report.environmentalRisks && report.environmentalRisks.map((risk, idx) => {
            const lvl = (risk.level || 'Low').toLowerCase();
            const badgeClass = lvl === 'severe' || lvl === 'high' ? 'risk-high' : lvl === 'moderate' ? 'risk-moderate' : 'risk-low';
            return (
              <div key={idx} className="ai-risk-item">
                <div>
                  <strong style={{ color: '#ffffff' }}>{risk.category}:</strong>{' '}
                  <span style={{ color: '#cbd5e1' }}>{risk.detail}</span>
                </div>
                <span className={`risk-level-badge ${badgeClass}`}>
                  {risk.level}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Actionable Recommendations */}
      <div style={{ margin: '14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <ShieldCheck size={15} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700', textTransform: 'uppercase' }}>
            Actionable Safeguards &amp; Operational Directives
          </span>
        </div>
        <ul className="ai-recommendation-list">
          {report.recommendations && report.recommendations.map((rec, idx) => (
            <li key={idx}>
              <span className="ai-bullet">✦</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Future Outlook */}
      {report.futureOutlook && (
        <div style={{
          marginTop: '16px',
          padding: '12px 14px',
          background: 'rgba(56, 189, 248, 0.08)',
          borderRadius: '10px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.82rem',
          color: '#bae6fd'
        }}>
          <Compass size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <span><strong>Future Outlook:</strong> {report.futureOutlook}</span>
        </div>
      )}
    </div>
  );
}
