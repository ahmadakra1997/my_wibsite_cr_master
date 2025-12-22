// frontend/src/components/settings/SettingsPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../common/ToastProvider';

import './SettingsPage.css';

const SettingsPage = () => {
  const [theme, setTheme] = useState('quantum');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [maxLeverage, setMaxLeverage] = useState(5);
  const [dailyLossLimit, setDailyLossLimit] = useState(10);

  const { addToast } = useToast();

  const handleSave = (e) => {
    e.preventDefault();

    // هنا لاحقاً تربط بالـ backend
    addToast({
      title: 'Settings saved',
      description: 'Your interface, notification and risk preferences have been updated.',
      type: 'success',
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: '18px auto', padding: '0 14px' }}>
      <div
        style={{
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(56,189,248,0.18)',
          background: 'linear-gradient(135deg, rgba(2,6,23,0.95), rgba(8,47,73,0.70))',
          boxShadow: '0 20px 60px rgba(2,6,23,0.72)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div>
            <h1 style={{ margin: 0, color: 'rgba(226,232,240,0.98)', fontWeight: 950 }}>Settings</h1>
            <p style={{ margin: '6px 0 0', color: 'rgba(148,163,184,0.95)', lineHeight: 1.7 }}>
              Configure your interface, alerts and default risk parameters for your trading bots.
            </p>
          </div>

          <Link
            to="/dashboard"
            style={{
              textDecoration: 'none',
              borderRadius: 14,
              padding: '10px 12px',
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(15,23,42,0.55)',
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 950,
              height: 'fit-content',
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ marginTop: 12, display: 'grid', gap: 12 }}>
        {/* Interface */}
        <section
          style={{
            borderRadius: 22,
            padding: 16,
            border: '1px solid rgba(45,212,191,0.16)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <h2 style={{ margin: 0, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>Interface</h2>
          <p style={{ margin: '6px 0 0', color: 'rgba(148,163,184,0.95)', lineHeight: 1.7 }}>
            Control the visual identity and layout preferences.
          </p>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <div style={{ color: 'rgba(148,163,184,0.95)', fontWeight: 900 }}>Theme</div>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'rgba(226,232,240,0.92)', fontWeight: 900 }}>
              <input
                type="radio"
                name="theme"
                checked={theme === 'quantum'}
                onChange={() => setTheme('quantum')}
              />
              Quantum Neon
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'rgba(148,163,184,0.95)', fontWeight: 900, opacity: 0.7 }}>
              <input
                type="radio"
                name="theme"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
                disabled
              />
              Light (coming soon)
            </label>
          </div>
        </section>

        {/* Notifications */}
        <section
          style={{
            borderRadius: 22,
            padding: 16,
            border: '1px solid rgba(56,189,248,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <h2 style={{ margin: 0, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>Notifications</h2>
          <p style={{ margin: '6px 0 0', color: 'rgba(148,163,184,0.95)', lineHeight: 1.7 }}>
            Choose how you’d like to be notified about trading events.
          </p>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'rgba(226,232,240,0.92)', fontWeight: 900 }}>
              <input type="checkbox" checked={emailAlerts} onChange={() => setEmailAlerts((v) => !v)} />
              Email alerts for critical events (bot errors, risk breaches)
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'rgba(226,232,240,0.92)', fontWeight: 900 }}>
              <input type="checkbox" checked={pushAlerts} onChange={() => setPushAlerts((v) => !v)} />
              In-app push toasts for executions and fills
            </label>
          </div>
        </section>

        {/* Default Risk Guardrails */}
        <section
          style={{
            borderRadius: 22,
            padding: 16,
            border: '1px solid rgba(0,255,136,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <h2 style={{ margin: 0, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>Default Risk Guardrails</h2>
          <p style={{ margin: '6px 0 0', color: 'rgba(148,163,184,0.95)', lineHeight: 1.7 }}>
            Baseline limits that your bots should respect by default. These can still be overridden per-strategy.
          </p>

          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 900 }}>
              Max leverage
              <input
                type="number"
                min={1}
                max={125}
                value={maxLeverage}
                onChange={(e) => setMaxLeverage(Number(e.target.value) || 1)}
                style={{
                  borderRadius: 14,
                  padding: '10px 12px',
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: 'rgba(15,23,42,0.55)',
                  color: 'rgba(226,232,240,0.95)',
                  outline: 'none',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 900 }}>
              Daily loss limit (%)
              <input
                type="number"
                min={1}
                max={100}
                value={dailyLossLimit}
                onChange={(e) => setDailyLossLimit(Number(e.target.value) || 1)}
                style={{
                  borderRadius: 14,
                  padding: '10px 12px',
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: 'rgba(15,23,42,0.55)',
                  color: 'rgba(226,232,240,0.95)',
                  outline: 'none',
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            style={{
              marginTop: 12,
              borderRadius: 14,
              padding: '10px 12px',
              border: '1px solid rgba(0,255,136,0.35)',
              background: 'linear-gradient(135deg, rgba(56,189,248,0.14), rgba(0,255,136,0.10))',
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 950,
              cursor: 'pointer',
              width: 'fit-content',
            }}
          >
            Save Settings
          </button>
        </section>
      </form>
    </div>
  );
};

export default SettingsPage;
