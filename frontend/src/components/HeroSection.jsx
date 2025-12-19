// frontend/src/components/HeroSection.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './HeroSection.css';

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const HeroSection = () => {
  const { t } = useTranslation();

  const [currentStat, setCurrentStat] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const sectionRef = useRef(null);

  const stats = useMemo(
    () => [
      {
        number: '99.7%',
        label: t('stats.accuracyRate', 'دقة التنبؤ'),
        icon: '🎯',
        suffix: t('stats.suffix.accuracy', 'دقة'),
      },
      {
        number: '0.002s',
        label: t('stats.executionSpeed', 'سرعة التنفيذ'),
        icon: '⚡',
        suffix: t('stats.suffix.speed', 'سرعة'),
      },
      {
        number: '24/7',
        label: t('stats.marketCoverage', 'تغطية الأسواق'),
        icon: '🌍',
        suffix: t('stats.suffix.runtime', 'تشغيل'),
      },
      {
        number: 'QA+',
        label: t('stats.aiTechnology', 'تقنية الذكاء الاصطناعي'),
        icon: '🧠',
        suffix: t('stats.suffix.ai', 'ذكاء'),
      },
    ],
    [t]
  );

  const techBadges = useMemo(
    () => [
      { label: t('techBadges.quantumAI', 'Quantum AI Engine'), icon: '⚛️' },
      { label: t('techBadges.machineLearning', 'Machine Learning'), icon: '🤖' },
      { label: t('techBadges.realTimeAnalytics', 'Real-time Analytics'), icon: '📈' },
      { label: t('techBadges.multiPlatform', 'Multi-Platform'), icon: '🧩' },
      { label: t('techBadges.encryptedSecurity', 'Encrypted Security'), icon: '🔐' },
      { label: t('techBadges.autoTrading', 'Auto Trading 24/7'), icon: '🛰️' },
    ],
    [t]
  );

  const heroMetrics = useMemo(
    () => [
      { label: 'Uptime', value: '99.9%', hint: 'Core Engine' },
      { label: 'Automation', value: '24 / 24', hint: 'Active Modules' },
      { label: 'Latency', value: '< 5 ms', hint: 'Order Routing' },
      { label: 'Regions', value: '12+', hint: 'Global Coverage' },
    ],
    []
  );

  // رصد ظهور القسم في الشاشة لتفعيل الأنيميشن
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // تدوير الإحصائيات كل 3 ثواني
  useEffect(() => {
    if (!stats?.length || stats.length < 2) return;

    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [stats]);

  const handleMouseMove = (e) => {
    const el = sectionRef.current;
    if (!el || typeof el.getBoundingClientRect !== 'function') return;

    const rect = el.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x: clamp(x, 0, 100), y: clamp(y, 0, 100) });
  };

  const scrollToId = (id) => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById(id);
    if (target?.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToFeatures = () => {
    scrollToId('features');
  };

  const heroStyle = {
    '--mouse-x': `${mousePosition.x}%`,
    '--mouse-y': `${mousePosition.y}%`,
  };

  const active = stats?.[currentStat] || stats?.[0] || { number: '--', label: '', suffix: '', icon: '✨' };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className={`hero-section ${isVisible ? 'hero-section--visible' : ''}`}
      onMouseMove={handleMouseMove}
      style={heroStyle}
    >
      {/* خلفية ديناميكية ودوائر متحركة */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-bg__radial" />
        <div className="hero-bg__grid" />
        <div className="hero-bg__orbs">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="hero-orb" />
          ))}
        </div>
      </div>

      <div className="hero-container">
        <div className="hero-content">
          {/* العمود النصي */}
          <div className="hero-left">
            {/* الشعار / الـ Tagline */}
            <div className="hero-overline">
              <span className="hero-overline__pill">{t('hero.overline', 'QA TRADER • QUANTUM AI')}</span>
              <span className="hero-overline__sub">{t('hero.subTagline', 'ADVANCED AI TRADING PLATFORM')}</span>
            </div>

            {/* العنوان الرئيسي */}
            <h1 className="hero-title">
              <span className="hero-title__main">{t('hero.title.main', 'QUANTUM AI TRADING PLATFORM')}</span>
              <span className="hero-title__highlight">{t('hero.title.highlight', 'ثورة في عالم التداول الآلي')}</span>
            </h1>

            {/* وصف قصير */}
            <p className="hero-description">
              {t(
                'hero.description',
                'اختبر قوة تقنية QUANTUM AI لتحقيق أداء غير مسبوق في أسواق التداول العالمية، مع أتمتة كاملة، إدارة مخاطر ذكية، ومراقبة حية على مدار الساعة.'
              )}
            </p>

            {/* الإحصائية المتحركة */}
            <div className="hero-stat" aria-live="polite">
              <div className="hero-stat__left">
                <div className="hero-stat__icon" aria-hidden="true">
                  {active?.icon || '✨'}
                </div>
                <div className="hero-stat__value">
                  <span className="hero-stat__number">{active?.number ?? '--'}</span>
                  <span className="hero-stat__suffix">{active?.suffix ?? ''}</span>
                </div>
              </div>
              <div className="hero-stat__label">{active?.label ?? ''}</div>

              <div className="hero-stat__dots" aria-label={t('hero.stats.switcher', 'تبديل الإحصائيات')}>
                {stats.map((stat, index) => (
                  <button
                    key={`${stat.label}-${index}`}
                    type="button"
                    onClick={() => setCurrentStat(index)}
                    className={index === currentStat ? 'hero-stat-dot hero-stat-dot--active' : 'hero-stat-dot'}
                    aria-label={stat.label}
                  />
                ))}
              </div>
            </div>

            {/* أزرار الـ CTA */}
            <div className="hero-cta">
              <a className="hero-btn hero-btn--primary" href="/trading">
                {t('hero.cta.primary', 'ابدأ التداول الآلي الآن')}
              </a>

              <button type="button" className="hero-btn hero-btn--secondary" onClick={scrollToFeatures}>
                {t('hero.cta.features', 'استعرض الميزات')}
              </button>

              <button type="button" className="hero-btn hero-btn--ghost" onClick={() => scrollToId('live-performance')}>
                {t('hero.cta.liveDemo', 'شاهد العرض الحي')}
              </button>
            </div>

            {/* شارات التكنولوجيا */}
            <div className="hero-tech">
              <div className="hero-tech__label">⚡ {t('hero.techLabel', 'مدعوم بأحدث تقنيات الذكاء الاصطناعي')}</div>
              <div className="hero-tech__badges">
                {techBadges.map((badge, index) => (
                  <span key={`${badge.label}-${index}`} className="hero-badge">
                    <span className="hero-badge__icon" aria-hidden="true">
                      {badge.icon || '•'}
                    </span>
                    <span className="hero-badge__text">{badge.label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* كارت البوت / المحرك الحي */}
          <div className="hero-right">
            <div className="hero-liveCard">
              <div className="hero-liveCard__header">
                <span className="hero-liveCard__pill">LIVE</span>
                <div className="hero-liveCard__titles">
                  <div className="hero-liveCard__title">QUANTUM AI TRADER</div>
                  <div className="hero-liveCard__sub">Real-Time Execution Engine</div>
                </div>
              </div>

              <div className="hero-liveCard__status">
                <span className="hero-liveCard__dot" aria-hidden="true" />
                <span>{t('hero.engine.running', 'Running • 24/7')}</span>
              </div>

              <div className="hero-liveCard__bars" aria-hidden="true">
                {[52, 68, 40, 88, 75, 92, 60, 84, 70, 95].map((height, idx) => (
                  <span key={idx} className="hero-bar" style={{ height: `${height}%` }} />
                ))}
              </div>

              <div className="hero-liveCard__kpis">
                <div className="hero-kpi">
                  <div className="hero-kpi__label">RISK</div>
                  <div className="hero-kpi__value">Balanced</div>
                </div>
                <div className="hero-kpi">
                  <div className="hero-kpi__label">PNL (30D)</div>
                  <div className="hero-kpi__value hero-kpi__value--pos">+12.4%</div>
                </div>
                <div className="hero-kpi">
                  <div className="hero-kpi__label">BOT STATUS</div>
                  <div className="hero-kpi__value">{t('hero.botStatus', 'Running')}</div>
                </div>
                <div className="hero-kpi">
                  <div className="hero-kpi__label">Sessions</div>
                  <div className="hero-kpi__value">4 / 4</div>
                </div>
                <div className="hero-kpi">
                  <div className="hero-kpi__label">Signals / min</div>
                  <div className="hero-kpi__value">120+</div>
                </div>
                <div className="hero-kpi">
                  <div className="hero-kpi__label">Latency</div>
                  <div className="hero-kpi__value">&lt; 5 ms</div>
                </div>
              </div>
            </div>

            <div className="hero-metrics">
              <div className="hero-metrics__header">{t('hero.liveSystem', 'نظام حي يعمل الآن')}</div>

              <div className="hero-metrics__grid">
                {heroMetrics.map((m, idx) => (
                  <div key={`${m.label}-${idx}`} className="hero-metric">
                    <div className="hero-metric__label">{m.label}</div>
                    <div className="hero-metric__value">{m.value}</div>
                    <div className="hero-metric__hint">{m.hint}</div>
                  </div>
                ))}
              </div>

              <div className="hero-metrics__footer">2,847+ متداول نشط • $154M+ حجم تداول اليوم</div>
            </div>
          </div>
        </div>

        {/* مؤشر التمرير */}
        <button type="button" className="hero-scroll" onClick={scrollToFeatures}>
          <span className="hero-scroll__text">{t('hero.scroll', 'اكتشف المزيد')}</span>
          <span className="hero-scroll__chev" aria-hidden="true">
            ↓
          </span>
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
