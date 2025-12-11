// frontend/src/components/auth/AuthPanel.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../common/ToastProvider';
import './AuthPanel.css';

const AuthPanel = () => {
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    const isSignup = mode === 'signup';

    if (isSignup && password !== confirm) {
      addToast({
        title: 'Passwords do not match',
        description:
          'Please make sure your password and confirmation are identical.',
        type: 'error',
      });
      return;
    }

    // هنا لاحقاً يوضع منطق الاتصال بالـ backend
    addToast({
      title: isSignup ? 'Account ready' : 'Welcome back',
      description: 'Routing you to the trading cockpit…',
      type: 'success',
    });

    navigate('/trading');
  };

  const isSignup = mode === 'signup';

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-logo-badge">Quantum AI Trader</div>
          <h1 className="auth-title">
            Secure access to your
            <span> automated trading cockpit.</span>
          </h1>
          <p className="auth-subtitle">
            Log in to control your bots, monitor risk and manage live trading
            sessions — all from a single neon interface.
          </p>

          <div className="auth-meta">
            <div className="auth-meta-item">
              <span className="auth-meta-label">Sessions</span>
              <span className="auth-meta-value">24/7</span>
            </div>
            <div className="auth-meta-item">
              <span className="auth-meta-label">Security</span>
              <span className="auth-meta-value">2FA-ready</span>
            </div>
            <div className="auth-meta-item">
              <span className="auth-meta-label">Latency</span>
              <span className="auth-meta-value">&lt; 5 ms*</span>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'auth-tab-active' : ''}`}
              onClick={() => setMode('login')}
            >
              Log In
            </button>
            <button
              type="button"
              className={`auth-tab ${
                mode === 'signup' ? 'auth-tab-active' : ''
              }`}
              onClick={() => setMode('signup')}
            >
              Create Account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {isSignup && (
              <label className="auth-field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            )}

            <div className="auth-row">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember((v) => !v)}
                />
                <span>Remember this device</span>
              </label>

              {mode === 'login' && (
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() =>
                    addToast({
                      title: 'Reset link',
                      description:
                        'Password reset flow is not wired yet — connect to backend later.',
                      type: 'info',
                    })
                  }
                >
                  Forgot password?
                </button>
              )}
            </div>

            <button type="submit" className="auth-submit">
              {isSignup ? 'Create & Continue' : 'Log In'}
            </button>

            <div className="auth-footer-note">
              <span>Back to </span>
              <Link to="/">Landing</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPanel;
