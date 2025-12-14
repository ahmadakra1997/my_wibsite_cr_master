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
    <main className="settings-root">
      <div className="settings-card">
        <header className="settings-header">
          <div>
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">
              Configure your interface, alerts and default risk
              parameters for your trading bots.
            </p>
          </div>

          <div className="settings-header-actions">
            <Link to="/dashboard" className="settings-link-back">
              Back to Dashboard
            </Link>
          </div>
        </header>

        <form className="settings-form" onSubmit={handleSave}>
          {/* Interface */}
          <section className="settings-section">
            <h2 className="settings-section-title">Interface</h2>
            <p className="settings-section-sub">
              Control the visual identity and layout preferences.
            </p>

            <div className="settings-field-group">
              <div className="settings-field-label">Theme</div>
              <div className="settings-radio-group">
                <label className="settings-radio">
                  <input
                    type="radio"
                    name="theme"
                    value="quantum"
                    checked={theme === 'quantum'}
                    onChange={() => setTheme('quantum')}
                  />
                  <span>Quantum Neon</span>
                </label>

                <label className="settings-radio settings-radio-disabled">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={() => setTheme('light')}
                    disabled
                  />
                  <span>Light (coming soon)</span>
                </label>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="settings-section">
            <h2 className="settings-section-title">Notifications</h2>
            <p className="settings-section-sub">
              Choose how you’d like to be notified about trading events.
            </p>

            <div className="settings-field-group">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={() =>
                    setEmailAlerts((v) => !v)
                  }
                />
                <span>
                  Email alerts for critical events (bot errors, risk
                  breaches)
                </span>
              </label>

              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={() =>
                    setPushAlerts((v) => !v)
                  }
                />
                <span>
                  In-app push toasts for executions and fills
                </span>
              </label>
            </div>
          </section>

          {/* Default Risk Guardrails */}
          <section className="settings-section">
            <h2 className="settings-section-title">
              Default Risk Guardrails
            </h2>
            <p className="settings-section-sub">
              Baseline limits that your bots should respect by default.
              These can still be overridden per-strategy.
            </p>

            <div className="settings-field-grid">
              <div className="settings-field">
                <label className="settings-field-label">
                  Max leverage
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxLeverage}
                  onChange={(e) =>
                    setMaxLeverage(
                      Number(e.target.value) || 1,
                    )
                  }
                />
              </div>

              <div className="settings-field">
                <label className="settings-field-label">
                  Daily loss limit (%)
                </label>
                <input
                  type="number"
                  min={1}
                  value={dailyLossLimit}
                  onChange={(e) =>
                    setDailyLossLimit(
                      Number(e.target.value) || 1,
                    )
                  }
                />
              </div>
            </div>
          </section>

          <div className="settings-footer">
            <button type="submit" className="settings-submit">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default SettingsPage;
