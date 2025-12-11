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
      description:
        'Your interface, notification and risk preferences have been updated.',
      type: 'success',
    });
  };

  return (
    <div className="settings-root">
      <div className="settings-card">
        <div className="settings-header">
          <div>
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">
              Configure your interface, alerts and default risk parameters for
              your trading bots.
            </p>
          </div>
          <Link to="/dashboard" className="settings-link">
            Back to Dashboard
          </Link>
        </div>

        <form className="settings-grid" onSubmit={handleSave}>
          <section className="settings-section">
            <h2>Interface</h2>
            <p>Control the visual identity and layout preferences.</p>

            <div className="settings-field">
              <label className="settings-label">Theme</label>
              <div className="settings-pill-row">
                <button
                  type="button"
                  className={`settings-pill ${
                    theme === 'quantum' ? 'settings-pill-active' : ''
                  }`}
                  onClick={() => setTheme('quantum')}
                >
                  Quantum Neon
                </button>
                <button
                  type="button"
                  className={`settings-pill ${
                    theme === 'light' ? 'settings-pill-active' : ''
                  }`}
                  onClick={() => setTheme('light')}
                >
                  Light (coming soon)
                </button>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2>Notifications</h2>
            <p>Choose how you’d like to be notified about trading events.</p>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={() => setEmailAlerts((v) => !v)}
              />
              <span>
                Email alerts for critical events (bot errors, risk breaches)
              </span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={pushAlerts}
                onChange={() => setPushAlerts((v) => !v)}
              />
              <span>In-app push toasts for executions and fills</span>
            </label>
          </section>

          <section className="settings-section">
            <h2>Default Risk Guardrails</h2>
            <p>
              Baseline limits that your bots should respect by default. These
              can still be overridden per-strategy.
            </p>

            <div className="settings-field-inline">
              <label>
                <span className="settings-label">Max leverage</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxLeverage}
                  onChange={(e) =>
                    setMaxLeverage(Number(e.target.value) || 1)
                  }
                />
              </label>

              <label>
                <span className="settings-label">
                  Daily loss limit (%)
                </span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={dailyLossLimit}
                  onChange={(e) =>
                    setDailyLossLimit(Number(e.target.value) || 1)
                  }
                />
              </label>
            </div>
          </section>

          <div className="settings-footer">
            <button type="submit" className="settings-save">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
