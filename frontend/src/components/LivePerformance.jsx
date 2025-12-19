import React from 'react';
import './LivePerformance.css';

const TIMEFRAMES = [
  { id: '1H', label: '1H' },
  { id: '6H', label: '6H' },
  { id: '1D', label: '1D' },
  { id: '1W', label: '1W' },
];

function makeSeries(n) {
  // سلسلة ثابتة (بدون عشوائية) لتجنّب اختلاف SSR/CSR
  const arr = [];
  for (let i = 0; i < n; i += 1) {
    const v = 40 + Math.round(28 * Math.sin(i / 3) + 12 * Math.cos(i / 2));
    arr.push(Math.max(6, Math.min(92, v)));
  }
  return arr;
}

export default function LivePerformance() {
  const [tf, setTf] = React.useState('1D');
  const [alerts, setAlerts] = React.useState([
    { id: 'a1', type: 'success', icon: '✅', msg: 'Order filled', pair: 'BTC/USDT', profit: '+12.4', time: '2m' },
    { id: 'a2', type: 'info', icon: 'ℹ️', msg: 'Signal detected', pair: 'ETH/USDT', profit: '+3.1', time: '7m' },
    { id: 'a3', type: 'warning', icon: '⚠️', msg: 'High volatility', pair: 'SOL/USDT', profit: '—', time: '11m' },
  ]);

  const series = React.useMemo(() => makeSeries(tf === '1H' ? 10 : tf === '6H' ? 14 : tf === '1D' ? 18 : 24), [tf]);

  const pairs = React.useMemo(
    () => [
      { sym: 'BTC/USDT', price: '103,420', chg: '+1.2%', vol: '1.4B', pos: true },
      { sym: 'ETH/USDT', price: '4,780', chg: '+0.6%', vol: '820M', pos: true },
      { sym: 'SOL/USDT', price: '224.2', chg: '-0.4%', vol: '310M', pos: false },
      { sym: 'XRP/USDT', price: '2.14', chg: '+0.2%', vol: '460M', pos: true },
    ],
    []
  );

  const clearAlerts = () => setAlerts([]);

  return (
    <section className="performance-section">
      <div className="performance-background">
        <div className="quantum-particles-performance" />
        <div className="neon-grid-performance" />
        <div className="performance-glow" />
      </div>

      <div className="performance-container">
        <div className="performance-header">
          <div className="header-badge">
            <span className="badge-icon">📈</span>
            <span style={{ color: 'rgba(226,232,240,0.92)', fontWeight: 700 }}>Live Performance</span>
          </div>

          <div className="performance-title">
            Quantum <span className="title-highlight">Insights</span>
          </div>
          <p className="performance-subtitle">
            لوحة أداء مرئية — جاهزة للربط ببيانات حقيقية لاحقاً، بدون كراش وبدون تغيير الثيم.
          </p>
        </div>

        <div className="timeframe-controls">
          <div className="controls-header">
            <h3 className="controls-title">Timeframe</h3>
            <div className="live-indicator">
              <span className="live-dot" />
              LIVE
            </div>
          </div>

          <div className="timeframe-buttons">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`timeframe-btn ${tf === t.id ? 'timeframe-active' : ''}`}
                onClick={() => setTf(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="performance-grid">
          {/* Chart */}
          <div className="performance-card chart-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">🧭</span>
                Profit / Volume
              </h3>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color profit-color" />
                  Profit
                </div>
                <div className="legend-item">
                  <span className="legend-color volume-color" />
                  Volume
                </div>
              </div>
            </div>

            <div className="chart-container">
              <div className="live-chart">
                <div className="chart-area">
                  {series.map((v, i) => {
                    const left = (i / Math.max(1, series.length - 1)) * 100;
                    const bottom = v;
                    return (
                      <div
                        key={`${i}-${v}`}
                        className="chart-point"
                        style={{ left: `${left}%`, bottom: `${bottom}%` }}
                      >
                        <div className="point-tooltip">{`P: ${Math.round(v)} • V: ${Math.round(60 + v)}`}</div>
                      </div>
                    );
                  })}
                  <div className="chart-line" />
                </div>

                <div className="chart-labels">
                  <span>Start</span>
                  <span>Now</span>
                </div>

                <div className="chart-stats">
                  <div className="chart-stat">
                    <span className="stat-label">Today PnL</span>
                    <span className="stat-value">+124.8</span>
                  </div>
                  <div className="chart-stat">
                    <span className="stat-label">Volume</span>
                    <span className="stat-value">3.1B</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="performance-card stats-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">📊</span>
                Snapshot
              </h3>
              <div className="stats-update">updated: just now</div>
            </div>

            <div className="stats-grid">
              <div className="stat-item primary">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-value">+12.4%</div>
                  <div className="stat-label">Weekly ROI</div>
                </div>
                <div className="stat-trend positive">↗</div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">78%</div>
                  <div className="stat-label">Win rate</div>
                </div>
                <div className="stat-badge excellent">EXCELLENT</div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">🧠</div>
                <div className="stat-content">
                  <div className="stat-value">0.82</div>
                  <div className="stat-label">AI Confidence</div>
                </div>
                <div className="stat-badge good">GOOD</div>
              </div>
            </div>
          </div>

          {/* Pairs */}
          <div className="performance-card pairs-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">🪙</span>
                Pairs
              </h3>
              <div className="pairs-count">
                <span className="count-badge">{pairs.length}</span>
              </div>
            </div>

            <div className="pairs-list">
              {pairs.map((p) => (
                <div className="pair-item" key={p.sym}>
                  <div className="pair-symbol">{p.sym}</div>
                  <div className="pair-price">{p.price}</div>
                  <div className={`pair-change ${p.pos ? 'positive' : 'negative'}`}>{p.chg}</div>
                  <div className="pair-volume">{p.vol}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="performance-card alerts-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">🚨</span>
                Alerts
                {alerts.length > 0 && <span className="alerts-badge">{alerts.length}</span>}
              </h3>

              <button type="button" className="alerts-clear" onClick={clearAlerts}>
                Clear
              </button>
            </div>

            <div className="alerts-container">
              {alerts.length === 0 ? (
                <div className="no-alerts">
                  <div className="no-alerts-icon">🫧</div>
                  No alerts right now
                </div>
              ) : (
                alerts.map((a) => (
                  <div key={a.id} className={`alert-item alert-${a.type || 'default'}`}>
                    <div className="alert-icon">{a.icon}</div>
                    <div className="alert-content">
                      <div className="alert-message">{a.msg}</div>
                      <div className="alert-details">
                        <span className="alert-pair">{a.pair}</span>
                        <span className="alert-profit">{a.profit}</span>
                        <span className="alert-time">{a.time}</span>
                      </div>
                    </div>
                    <div className="alert-actions">
                      <button type="button" className="action-btn" aria-label="Acknowledge">
                        ✓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Advanced analytics */}
        <div className="advanced-analytics">
          <div className="analytics-header">
            <div className="analytics-title">Advanced Analytics</div>
            <div className="analytics-subtitle">مقاييس UI جاهزة — تتغذى من API لاحقاً.</div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-icon">🧪</div>
              <div className="analytics-content">
                <h4>Strategy Health</h4>
                <div className="analytics-value">92%</div>
                <div className="analytics-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '92%' }} />
                  </div>
                </div>
                <div className="analytics-trend positive">+4.1% this week</div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon">⏱️</div>
              <div className="analytics-content">
                <h4>Latency</h4>
                <div className="analytics-value">38ms</div>
                <div className="analytics-description">Execution-to-confirm</div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon">🟢</div>
              <div className="analytics-content">
                <h4>Uptime</h4>
                <div className="analytics-value">99.98%</div>
                <div className="analytics-uptime">stable</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
