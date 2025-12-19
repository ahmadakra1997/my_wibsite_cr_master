import React from 'react';
import { Link } from 'react-router-dom';

import FeaturesSection from '../FeaturesSection';
import LivePerformance from '../LivePerformance';

import './LandingPage.css';

export default function LandingPage() {
  const bars = React.useMemo(() => [22, 34, 28, 46, 52, 41, 64, 58, 72, 55, 66, 80, 62, 74, 68, 88, 60, 78], []);

  return (
    <div className="landing-root">
      <section className="landing-hero">
        <div className="landing-hero-text">
          <div className="landing-badge">
            <span className="landing-badge-dot" />
            QUANTUM AI • TRADING UI
          </div>

          <h1 className="landing-title">
            منصة تداول <span>Quantum</span> بواجهة حيّة وآمنة
          </h1>

          <p className="landing-subtitle">
            تجربة UI متقدمة + حماية من الكراش + مكوّنات جاهزة للربط مع الباك-إند،
            بدون ما ننقص أي وظيفة.
          </p>

          <div className="landing-cta-row">
            <Link className="landing-btn landing-btn-primary" to="/trading">
              فتح التداول الحي
            </Link>
            <a className="landing-btn landing-btn-ghost" href="#features">
              استكشاف الخصائص
            </a>
          </div>

          <div className="landing-meta">
            <div className="landing-meta-item">
              <div className="landing-meta-label">Mode</div>
              <span className="landing-meta-value">LIVE</span>
            </div>
            <div className="landing-meta-item">
              <div className="landing-meta-label">Latency</div>
              <span className="landing-meta-value">~ 38ms</span>
            </div>
            <div className="landing-meta-item">
              <div className="landing-meta-label">Uptime</div>
              <span className="landing-meta-value">99.98%</span>
            </div>
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="landing-screen">
            <div className="landing-screen-header">
              <div className="landing-screen-title">Live Console</div>
              <div className="landing-screen-status">ONLINE</div>
            </div>

            <div className="landing-screen-chart">
              <div className="landing-chart-lines" />
              <div className="landing-chart-bars">
                {bars.map((h, idx) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={idx}
                    className="landing-chart-bar"
                    style={{ height: `${h * 1.6}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="landing-screen-footer">
              <div>
                <span className="landing-screen-label">PnL</span>
                <span className="landing-screen-value">+124.8</span>
              </div>
              <div>
                <span className="landing-screen-label">Risk</span>
                <span className="landing-screen-value">LOW</span>
              </div>
              <div>
                <span className="landing-screen-label">Signals</span>
                <span className="landing-screen-value">28/min</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-header">
          <h2>Modules</h2>
          <p>قسم خصائص متقدم (مستقل) ومتوافق مع RTL/LTR.</p>
        </div>

        <FeaturesSection />
      </section>

      <LivePerformance />
    </div>
  );
}
