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
        description: 'Please make sure your password and confirmation are identical.',
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
      description: 'Password reset flow is not wired yet — connect to backend later.',
      type: 'info',
    });
  };

  return (
    <div
      className="auth-panel"
      style={{
        maxWidth: 1100,
        margin: '18px auto',
        padding: '0 14px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}
    >
      {/* يسار: النص / البراند */}
      <div
        className="auth-panel-left"
        style={{
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(56,189,248,0.18)',
          background: 'linear-gradient(135deg, rgba(2,6,23,0.95), rgba(8,47,73,0.70))',
          boxShadow: '0 20px 60px rgba(2,6,23,0.72)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid rgba(45,212,191,0.28)',
            background: 'rgba(45,212,191,0.10)',
            color: 'rgba(226,232,240,0.95)',
            fontWeight: 950,
            letterSpacing: '0.10em',
            fontSize: 11,
          }}
        >
          Quantum AI Trader
        </div>

        <h1 style={{ margin: '12px 0 6px', color: 'rgba(226,232,240,0.98)', fontWeight: 950, fontSize: 26 }}>
          Secure access to your automated trading cockpit.
        </h1>

        <p style={{ margin: 0, color: 'rgba(148,163,184,0.95)', lineHeight: 1.7, fontSize: 14 }}>
          Log in to control your bots, monitor risk and manage live trading sessions — all from a single neon interface.
        </p>

        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div style={{ borderRadius: 16, padding: 12, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(15,23,42,0.55)' }}>
            <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12 }}>Sessions</div>
            <div style={{ marginTop: 4, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>24 / 7</div>
          </div>
          <div style={{ borderRadius: 16, padding: 12, border: '1px solid rgba(56,189,248,0.16)', background: 'rgba(15,23,42,0.55)' }}>
            <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12 }}>Security</div>
            <div style={{ marginTop: 4, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>2FA-ready</div>
          </div>
          <div style={{ borderRadius: 16, padding: 12, border: '1px solid rgba(0,255,136,0.14)', background: 'rgba(15,23,42,0.55)' }}>
            <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12 }}>Latency</div>
            <div style={{ marginTop: 4, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>{'< 5 ms*'}</div>
          </div>
        </div>
      </div>

      {/* يمين: الفورم */}
      <div
        className="auth-panel-right"
        style={{
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(0,255,136,0.14)',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.78), rgba(2,6,23,0.92))',
          boxShadow: '0 20px 60px rgba(2,6,23,0.72)',
        }}
      >
        {/* Tabs: Log in / Create account */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              borderRadius: 14,
              padding: '10px 12px',
              border: mode === 'login' ? '1px solid rgba(56,189,248,0.55)' : '1px solid rgba(148,163,184,0.18)',
              background: mode === 'login' ? 'rgba(56,189,248,0.10)' : 'rgba(15,23,42,0.55)',
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 950,
              cursor: 'pointer',
            }}
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{
              borderRadius: 14,
              padding: '10px 12px',
              border: mode === 'signup' ? '1px solid rgba(0,255,136,0.55)' : '1px solid rgba(148,163,184,0.18)',
              background: mode === 'signup' ? 'rgba(0,255,136,0.10)' : 'rgba(15,23,42,0.55)',
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 950,
              cursor: 'pointer',
            }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 12, display: 'grid', gap: 12 }}>
          {/* Email */}
          <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 800 }}>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              type="email"
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

          {/* Password */}
          <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 800 }}>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              type="password"
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

          {/* Confirm password في وضع signup فقط */}
          {isSignup ? (
            <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 800 }}>
              Confirm Password
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                type="password"
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
          ) : null}

          {/* Remember + Forgot password */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(226,232,240,0.92)', fontWeight: 850 }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember((v) => !v)}
              />
              Remember this device
            </label>

            {mode === 'login' ? (
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'rgba(56,189,248,0.95)',
                  fontWeight: 900,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Forgot password?
              </button>
            ) : null}
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={{
              borderRadius: 14,
              padding: '10px 12px',
              border: '1px solid rgba(56,189,248,0.40)',
              background: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(0,255,136,0.10))',
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 950,
              cursor: 'pointer',
              width: 'fit-content',
            }}
          >
            {isSignup ? 'Create & Continue' : 'Log In'}
          </button>

          <div style={{ color: 'rgba(148,163,184,0.95)', fontWeight: 800 }}>
            Back to <Link to="/" style={{ color: 'rgba(226,232,240,0.95)', fontWeight: 950 }}>Landing</Link>
          </div>
        </form>
      </div>

      <style>
        {`
          @media (max-width: 980px){
            .auth-panel { grid-template-columns: 1fr !important; }
          }
        `}
      </style>
    </div>
  );
};

export default AuthPanel;
