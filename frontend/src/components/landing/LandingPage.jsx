// frontend/src/components/landing/LandingPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-root">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-text">
          <div className="landing-badge">Quantum AI Trader</div>
          <h1 className="landing-title">
            AI-Powered
            <span> Automated Trading </span>
            for the Next Era of Markets.
          </h1>
          <p className="landing-subtitle">
            Advanced order-book analytics, execution bots and real-time risk
            monitoring — all in one neon-powered trading cockpit.
          </p>

          <div className="landing-cta-row">
            <Link to="/trading" className="landing-btn landing-btn-primary">
              Launch Trading Interface
            </Link>
            <Link to="/dashboard" className="landing-btn landing-btn-ghost">
              View Performance Dashboard
            </Link>
          </div>

          <div className="landing-meta">
            <div className="landing-meta-item">
              <span className="landing-meta-label">Latency</span>
              <span className="landing-meta-value">&lt; 5 ms</span>
            </div>
            <div className="landing-meta-item">
              <span className="landing-meta-label">Automation</span>
              <span className="landing-meta-value">24 / 7</span>
            </div>
            <div className="landing-meta-item">
              <span className="landing-meta-label">Uptime</span>
              <span className="landing-meta-value">99.9%</span>
            </div>
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="landing-screen">
            <div className="landing-screen-header">
              <span className="landing-screen-title">Quantum AI Trader</span>
              <span className="landing-screen-status">LIVE</span>
            </div>
            <div className="landing-screen-chart">
              {/* تمثيل بسيط لشموع وخطوط */}
              <div className="landing-chart-lines" />
              <div className="landing-chart-bars">
                {Array.from({ length: 22 }).map((_, idx) => (
                  <span
                    key={idx}
                    className="landing-chart-bar"
                    style={{
                      height: `${40 + Math.sin(idx / 2) * 30 + idx % 7 * 4}%`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="landing-screen-footer">
              <div>
                <span className="landing-screen-label">Bot Status</span>
                <span className="landing-screen-value text-up">Running</span>
              </div>
              <div>
                <span className="landing-screen-label">PnL (30d)</span>
                <span className="landing-screen-value text-up">+12.4%</span>
              </div>
              <div>
                <span className="landing-screen-label">Risk</span>
                <span className="landing-screen-value">Balanced</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-section-header">
          <h2>Designed for Quant-Grade Trading.</h2>
          <p>
            From deep order-book analytics to AI execution bots – every pixel is
            crafted for serious traders.
          </p>
        </div>

        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <h3>AI Order-Book Engine</h3>
            <p>
              Real-time imbalance detection, liquidity walls, and micro-structure
              signals directly wired into your strategies.
            </p>
          </div>
          <div className="landing-feature-card">
            <h3>Autonomous Bots</h3>
            <p>
              Deploy scalpers, market-makers or swing bots with one click and
              monitor them from a unified cockpit.
            </p>
          </div>
          <div className="landing-feature-card">
            <h3>Risk in Real Time</h3>
            <p>
              Track leverage, exposure and drawdown instantly with neon-clear
              risk meters and alerts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
