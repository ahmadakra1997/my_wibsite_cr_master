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

  const isSignup = mode === 'signup';

  const handleSubmit = (e) => {
    e.preventDefault();

    const isSignupMode = mode === 'signup';

    if (isSignupMode && password !== confirm) {
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
      title: isSignupMode ? 'Account ready' : 'Welcome back',
      description: 'Routing you to the trading cockpit…',
      type: 'success',
    });

    navigate('/trading');
  };

  const handleForgotPassword = () => {
    addToast({
      title: 'Reset link',
      description:
        'Password reset flow is not wired yet — connect to backend later.',
      type: 'info',
    });
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        {/* يسار: النص / البراند */}
        <div className="auth-left">
          <div className="auth-logo-badge">
            <span>Quantum AI Trader</span>
          </div>

          <h1 className="auth-title">
            Secure access to your{' '}
            <span>automated trading cockpit.</span>
          </h1>

          <p className="auth-subtitle">
            Log in to control your bots, monitor risk and manage live
            trading sessions — all from a single neon interface.
          </p>

          <div className="auth-meta">
            <div className="auth-meta-item">
              <div className="auth-meta-label">Sessions</div>
              <div className="auth-meta-value">24 / 7</div>
            </div>

            <div className="auth-meta-item">
              <div className="auth-meta-label">Security</div>
              <div className="auth-meta-value">2FA-ready</div>
            </div>

            <div className="auth-meta-item">
              <div className="auth-meta-label">Latency</div>
              <div className="auth-meta-value">&lt; 5 ms*</div>
            </div>
          </div>
        </div>

        {/* يمين: الفورم */}
        <div className="auth-right">
          {/* Tabs: Log in / Create account */}
          <div className="auth-tabs">
            <button
              type="button"
              className={
                mode === 'login'
                  ? 'auth-tab auth-tab-active'
                  : 'auth-tab'
              }
              onClick={() => setMode('login')}
            >
              Log In
            </button>
            <button
              type="button"
              className={
                mode === 'signup'
                  ? 'auth-tab auth-tab-active'
                  : 'auth-tab'
              }
              onClick={() => setMode('signup')}
            >
              Create Account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="auth-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div className="auth-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Confirm password في وضع signup فقط */}
            {isSignup && (
              <div className="auth-field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                />
              </div>
            )}

            {/* Remember + Forgot password */}
            <div className="auth-row">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() =>
                    setRemember((v) => !v)
                  }
                />
                <span>Remember this device</span>
              </label>

              {mode === 'login' && (
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="auth-submit">
              {isSignup ? 'Create & Continue' : 'Log In'}
            </button>

            <div className="auth-footer-note">
              Back to{' '}
              <Link to="/">
                Landing
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPanel;
