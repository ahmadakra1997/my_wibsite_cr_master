// frontend/src/components/landing/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

import FeaturesSection from '../FeaturesSection';
import LivePerformance from '../LivePerformance';

import './LandingPage.css';

export default function LandingPage() {
  const bars = React.useMemo(
    () => [22, 34, 28, 46, 52, 41, 64, 58, 72, 55, 66, 80, 62, 74, 68, 88, 60, 78],
    [],
  );

  return (
    <div className="landing-page quantum-landing" style={{ padding: '14px', maxWidth: 1200, margin: '0 auto' }}>
      {/* HERO */}
      <section
        className="lp-hero"
        style={{
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(56,189,248,0.18)',
          background: 'linear-gradient(135deg, rgba(2,6,23,0.95), rgba(8,47,73,0.70))',
          boxShadow: '0 20px 60px rgba(2,6,23,0.72)',
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: 14,
        }}
      >
        {/* Left */}
        <div style={{ minWidth: 0 }}>
          <div
            className="lp-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(45,212,191,0.30)',
              background: 'rgba(45,212,191,0.10)',
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 900,
              letterSpacing: '0.10em',
              fontSize: 11,
            }}
          >
            QUANTUM AI • TRADING UI
          </div>

          <h1
            style={{
              margin: '12px 0 6px',
              color: 'rgba(226,232,240,0.98)',
              fontWeight: 950,
              letterSpacing: '0.02em',
              lineHeight: 1.15,
              fontSize: 28,
            }}
          >
            منصة تداول Quantum بواجهة حيّة وآمنة
          </h1>

          <p style={{ margin: 0, color: 'rgba(148,163,184,0.95)', lineHeight: 1.7, fontSize: 14 }}>
            تجربة UI متقدمة + حماية من الكراش + مكوّنات جاهزة للربط مع الباك-إند، بدون ما ننقص أي وظيفة.
          </p>

          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to="/trading"
              className="lp-btn lp-btn-primary"
              style={{
                textDecoration: 'none',
                borderRadius: 14,
                padding: '10px 12px',
                border: '1px solid rgba(0,255,136,0.35)',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(0,255,136,0.12))',
                color: 'rgba(226,232,240,0.98)',
                fontWeight: 950,
              }}
            >
              فتح التداول الحي
            </Link>

            <a
              href="#modules"
              className="lp-btn lp-btn-secondary"
              style={{
                textDecoration: 'none',
                borderRadius: 14,
                padding: '10px 12px',
                border: '1px solid rgba(56,189,248,0.22)',
                background: 'rgba(15,23,42,0.55)',
                color: 'rgba(226,232,240,0.92)',
                fontWeight: 900,
              }}
            >
              استكشاف الخصائص
            </a>
          </div>

          {/* Stats */}
          <div
            className="lp-stats"
            style={{
              marginTop: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 10,
            }}
          >
            <div
              style={{
                borderRadius: 16,
                padding: 12,
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'rgba(15,23,42,0.55)',
              }}
            >
              <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12 }}>Mode</div>
              <div style={{ marginTop: 4, color: 'rgba(226,232,240,0.96)', fontWeight: 950, letterSpacing: '0.06em' }}>
                LIVE
              </div>
            </div>

            <div
              style={{
                borderRadius: 16,
                padding: 12,
                border: '1px solid rgba(56,189,248,0.18)',
                background: 'rgba(15,23,42,0.55)',
              }}
            >
              <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12 }}>Latency</div>
              <div style={{ marginTop: 4, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>~ 38ms</div>
            </div>

            <div
              style={{
                borderRadius: 16,
                padding: 12,
                border: '1px solid rgba(0,255,136,0.16)',
                background: 'rgba(15,23,42,0.55)',
              }}
            >
              <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12 }}>Uptime</div>
              <div style={{ marginTop: 4, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>99.98%</div>
            </div>
          </div>
        </div>

        {/* Right: Live Console */}
        <div style={{ minWidth: 0 }}>
          <div
            className="lp-console"
            style={{
              borderRadius: 18,
              padding: 14,
              border: '1px solid rgba(45,212,191,0.20)',
              background: 'linear-gradient(135deg, rgba(15,23,42,0.70), rgba(2,6,23,0.88))',
              boxShadow: '0 18px 46px rgba(2,6,23,0.62)',
              height: '100%',
              display: 'grid',
              gap: 10,
              alignContent: 'start',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ fontWeight: 950, color: 'rgba(226,232,240,0.95)' }}>Live Console</div>
              <div
                style={{
                  borderRadius: 999,
                  padding: '4px 8px',
                  border: '1px solid rgba(0,255,136,0.25)',
                  background: 'rgba(0,255,136,0.08)',
                  color: 'rgba(226,232,240,0.95)',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                }}
              >
                ONLINE
              </div>
            </div>

            {/* Mini bars */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 70 }}>
              {(bars || []).map((h, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 8,
                    height: Math.max(8, Number(h) || 8),
                    borderRadius: 10,
                    border: '1px solid rgba(56,189,248,0.22)',
                    background: 'linear-gradient(180deg, rgba(56,189,248,0.28), rgba(0,255,136,0.10))',
                  }}
                  aria-hidden="true"
                />
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
              <div
                style={{
                  borderRadius: 14,
                  padding: 10,
                  border: '1px solid rgba(56,189,248,0.18)',
                  background: 'rgba(15,23,42,0.55)',
                }}
              >
                <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 11 }}>PnL</div>
                <div style={{ marginTop: 4, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>+124.8</div>
              </div>

              <div
                style={{
                  borderRadius: 14,
                  padding: 10,
                  border: '1px solid rgba(0,255,136,0.14)',
                  background: 'rgba(15,23,42,0.55)',
                }}
              >
                <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 11 }}>Risk</div>
                <div style={{ marginTop: 4, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>LOW</div>
              </div>

              <div
                style={{
                  borderRadius: 14,
                  padding: 10,
                  border: '1px solid rgba(45,212,191,0.14)',
                  background: 'rgba(15,23,42,0.55)',
                }}
              >
                <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 11 }}>Signals</div>
                <div style={{ marginTop: 4, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>28/min</div>
              </div>
            </div>
          </div>
        </div>

        <style>
          {`
            @media (max-width: 980px){
              .lp-hero { grid-template-columns: 1fr !important; }
            }
          `}
        </style>
      </section>

      {/* Modules */}
      <section id="modules" style={{ marginTop: 14 }}>
        <div
          style={{
            borderRadius: 18,
            padding: 14,
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(15,23,42,0.55)',
          }}
        >
          <h2 style={{ margin: 0, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>Modules</h2>
          <p style={{ margin: '6px 0 0', color: 'rgba(148,163,184,0.95)', lineHeight: 1.7 }}>
            قسم خصائص متقدم (مستقل) ومتوافق مع RTL/LTR.
          </p>
        </div>

        <div style={{ marginTop: 12 }}>
          <FeaturesSection />
        </div>

        <div style={{ marginTop: 12 }}>
          <LivePerformance />
        </div>
      </section>
    </div>
  );
}
