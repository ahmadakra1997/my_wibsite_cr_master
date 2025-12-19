import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FeaturesSection.css';

const FEATURES = [
  {
    id: 'signals',
    color: '#22d3ee',
    icon: '📡',
    title: 'Quantum Signals',
    description: 'إشارات لحظية مع فلترة ضوضاء السوق بذكاء.',
    specs: ['Real-time', 'Noise filter', 'Multi-source'],
    details: ['تجميع من عدة مصادر', 'تنبيهات قابلة للتخصيص', 'إحصائيات لحظية'],
  },
  {
    id: 'risk',
    color: '#4ade80',
    icon: '🛡️',
    title: 'Risk Shield',
    description: 'مراقبة المخاطر وإدارة Exposure بشكل واضح.',
    specs: ['Exposure', 'Stops', 'Limits'],
    details: ['قواعد حماية تلقائية', 'تنبيهات تجاوز', 'قراءة سريعة للمخاطر'],
  },
  {
    id: 'speed',
    color: '#60a5fa',
    icon: '⚡',
    title: 'Execution Speed',
    description: 'واجهة خفيفة وعمليات سريعة بدون تعقيد.',
    specs: ['Low-latency', 'Optimized UI', 'Stable'],
    details: ['UI سريع', 'تحديثات سلسة', 'تقليل إعادة الرندر'],
  },
];

const DEFAULT_TOGGLES = [
  { id: 'auto', icon: '🤖', text: 'Auto Mode', color: '#22d3ee' },
  { id: 'hedge', icon: '🧩', text: 'Hedge', color: '#4ade80' },
  { id: 'alerts', icon: '🔔', text: 'Alerts', color: '#60a5fa' },
];

export default function FeaturesSection() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = React.useState(FEATURES[0].id);
  const [toggles, setToggles] = React.useState(() => new Set(['alerts']));
  const [visible, setVisible] = React.useState(false);

  const rootRef = React.useRef(null);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const any = entries.some((e) => e.isIntersecting);
        if (any) setVisible(true);
      },
      { threshold: 0.18 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveId((prev) => {
        const idx = FEATURES.findIndex((f) => f.id === prev);
        const next = FEATURES[(idx + 1) % FEATURES.length];
        return next.id;
      });
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  const activeFeature = React.useMemo(
    () => FEATURES.find((f) => f.id === activeId) || FEATURES[0],
    [activeId]
  );

  const toggle = (id) => {
    setToggles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stats = React.useMemo(() => {
    const baseSignals = toggles.has('auto') ? 42 : 28;
    const riskScore = toggles.has('hedge') ? 'LOW' : 'MED';
    const alerts = toggles.has('alerts') ? 'ON' : 'OFF';
    return [
      { icon: '📈', value: `${baseSignals}/min`, label: 'Signal Rate' },
      { icon: '🧯', value: riskScore, label: 'Risk' },
      { icon: '🔔', value: alerts, label: 'Alerts' },
    ];
  }, [toggles]);

  return (
    <section
      ref={rootRef}
      className={`features-section ${visible ? 'features-visible' : ''}`}
      style={{ '--feature-color': activeFeature.color }}
    >
      <div className="features-bg" />

      <header className="features-header">
        <div className="features-eyebrow">
          <span>⚛️</span>
          <span>Quantum Modules</span>
        </div>
        <h3 className="features-title">FEATURES</h3>
        <p className="features-description">
          مكوّنات متناسقة مع الثيم، توازن بين الجمال والوظيفة، وتبقى ثابتة بدون كراش.
        </p>
      </header>

      <div className="features-grid">
        {FEATURES.map((f) => {
          const isActive = f.id === activeId;
          return (
            <button
              key={f.id}
              type="button"
              className={`feature-card ${isActive ? 'feature-card-active' : ''}`}
              onClick={() => setActiveId(f.id)}
              style={{ '--feature-color': f.color }}
            >
              <div className="feature-glow" />
              <div className="feature-card-header">
                <span className="feature-icon" aria-hidden="true">{f.icon}</span>
                {isActive && <span className="feature-active-badge">ACTIVE</span>}
              </div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-description">{f.description}</p>

              <div className="feature-specs">
                {f.specs.map((s) => (
                  <span className="feature-spec-pill" key={s}>{s}</span>
                ))}
              </div>

              <ul className="feature-details">
                {f.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="features-control-panel">
        <h4 className="features-control-title">Control Panel</h4>
        <p className="features-control-description">
          فعّل/عطّل بعض الخصائص (واجهات فقط — بدون كسر أي اتصال أو روت).
        </p>

        <div className="features-toggle-row">
          {DEFAULT_TOGGLES.map((t) => {
            const on = toggles.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                className={`feature-toggle ${on ? 'feature-toggle-active' : ''}`}
                onClick={() => toggle(t.id)}
                style={{ '--feature-color': t.color }}
              >
                <span className="feature-toggle-icon">{t.icon}</span>
                <span className="feature-toggle-text">{t.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="features-stats">
        <h4 className="features-stats-title">Live Stats</h4>
        <p className="features-stats-description">إحصائيات عرض (UI) متزامنة مع الـ toggles.</p>

        <div className="features-stats-grid">
          {stats.map((s) => (
            <div className="features-stat-card" key={s.label}>
              <div className="features-stat-icon">{s.icon}</div>
              <div className="features-stat-value">{s.value}</div>
              <div className="features-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="features-how">
        <h4 className="features-how-title">How it works</h4>
        <p className="features-how-description">خطوات مبسطة بدون تعقيد.</p>

        <ol className="features-how-steps">
          <li>
            <h4>Connect</h4>
            <p>تشغيل الواجهة والاتصال (إن وجد) بشكل آمن.</p>
          </li>
          <li>
            <h4>Observe</h4>
            <p>متابعة إشارات السوق، دفتر الأوامر، والصفقات.</p>
          </li>
          <li>
            <h4>Act</h4>
            <p>تنفيذ قرار سريع عبر التداول الحي.</p>
          </li>
        </ol>
      </div>

      <div className="features-cta">
        <h4 className="features-cta-title">Ready to launch?</h4>
        <p className="features-cta-description">انتقل مباشرة للتداول الحي أو ارجع للأعلى.</p>

        <div className="features-cta-actions">
          <button
            type="button"
            className="features-cta-btn features-cta-primary"
            onClick={() => navigate('/trading')}
          >
            Go Trading
          </button>
          <button
            type="button"
            className="features-cta-btn features-cta-secondary"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Back Top
          </button>
        </div>
      </div>
    </section>
  );
}
