// frontend/src/components/HeroSection.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './HeroSection.css';

const HeroSection = () => {
  const { t } = useTranslation();

  const [currentStat, setCurrentStat] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const sectionRef = useRef(null);

  const stats = [
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
      icon: '🤖',
      suffix: t('stats.suffix.ai', 'ذكاء'),
    },
  ];

  const techBadges = [
    { label: t('techBadges.quantumAI', 'Quantum AI Engine'), icon: '⚛️' },
    { label: t('techBadges.machineLearning', 'Machine Learning'), icon: '📊' },
    { label: t('techBadges.realTimeAnalytics', 'Real-time Analytics'), icon: '📈' },
    { label: t('techBadges.multiPlatform', 'Multi-Platform'), icon: '💻' },
    { label: t('techBadges.encryptedSecurity', 'Encrypted Security'), icon: '🔐' },
    { label: t('techBadges.autoTrading', 'Auto Trading 24/7'), icon: '🤖' },
  ];

  const heroMetrics = [
    { label: 'Uptime', value: '99.9%', hint: 'Core Engine' },
    { label: 'Automation', value: '24 / 24', hint: 'Active Modules' },
    { label: 'Latency', value: '< 5 ms', hint: 'Order Routing' },
    { label: 'Regions', value: '12+', hint: 'Global Coverage' },
  ];

  // رصد ظهور القسم في الشاشة لتفعيل الأنيميشن
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // تدوير الإحصائيات كل 3 ثواني
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % stats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [stats.length]);

  const handleMouseMove = (e) => {
    if (!sectionRef.current) return;
    const { left, top, width, height } = sectionRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const heroStyle = {
    '--mouse-x': `${mousePosition.x}%`,
    '--mouse-y': `${mousePosition.y}%`,
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className={`hero-section ${isVisible ? 'hero-visible' : ''}`}
      onMouseMove={handleMouseMove}
      style={heroStyle}
    >
      {/* خلفية ديناميكية ودوائر متحركة */}
      <div className="hero-bg">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`hero-orb hero-orb--${(i % 3) + 1}`}
          />
        ))}
        <div className="hero-glow hero-glow--primary" />
        <div className="hero-glow hero-glow--secondary" />
      </div>

      <div className="hero-inner">
        {/* العمود النصي */}
        <div className="hero-content">
          {/* الشعار / الـ Tagline */}
          <div className="hero-eyebrow">
            <span className="hero-pill">
              <span className="hero-pill-dot" />
              {t('hero.overline', 'QA TRADER • QUANTUM AI')}
            </span>
            <span className="hero-subpill">
              {t(
                'hero.subTagline',
                'ADVANCED AI TRADING PLATFORM',
              )}
            </span>
          </div>

          {/* العنوان الرئيسي */}
          <h1 className="hero-title">
            <span className="hero-title-main">
              {t(
                'hero.title.main',
                'QUANTUM AI TRADING PLATFORM',
              )}
            </span>
            <span className="hero-title-gradient">
              {t(
                'hero.title.highlight',
                'ثورة في عالم التداول الآلي',
              )}
            </span>
          </h1>

          {/* وصف قصير */}
          <p className="hero-description">
            {t(
              'hero.description',
              'اختبر قوة تقنية QUANTUM AI لتحقيق أداء غير مسبوق في أسواق التداول العالمية، مع أتمتة كاملة، إدارة مخاطر ذكية، ومراقبة حية على مدار الساعة.',
            )}
          </p>

          {/* الإحصائية المتحركة */}
          <div className="hero-stats-rotator">
            <div className="hero-stat-main">
              {stats[currentStat].icon && (
                <span className="hero-stat-icon">
                  {stats[currentStat].icon}
                </span>
              )}

              <div className="hero-stat-numbers">
                <span className="hero-stat-number">
                  {stats[currentStat].number}
                </span>
                <span className="hero-stat-suffix">
                  {stats[currentStat].suffix}
                </span>
              </div>

              <p className="hero-stat-label">
                {stats[currentStat].label}
              </p>
            </div>

            <div className="hero-stat-dots">
              {stats.map((stat, index) => (
                <button
                  key={`${stat.number}-${index}`}
                  type="button"
                  onClick={() => setCurrentStat(index)}
                  className={
                    index === currentStat
                      ? 'hero-stat-dot hero-stat-dot--active'
                      : 'hero-stat-dot'
                  }
                  aria-label={stat.label}
                />
              ))}
            </div>
          </div>

          {/* أزرار الـ CTA */}
          <div className="hero-actions">
            <button
              type="button"
              className="hero-btn hero-btn-primary"
            >
              {t(
                'hero.cta.primary',
                'ابدأ التداول الآلي الآن',
              )}
            </button>

            <button
              type="button"
              className="hero-btn hero-btn-secondary"
              onClick={scrollToFeatures}
            >
              {t('hero.cta.features', 'استعرض الميزات')}
            </button>

            <button
              type="button"
              className="hero-btn hero-btn-ghost"
            >
              {t('hero.cta.liveDemo', 'شاهد العرض الحي')}
            </button>
          </div>

          {/* شارات التكنولوجيا */}
          <div className="hero-tech">
            <span className="hero-tech-label">
              ⚡ {t('hero.techLabel', 'مدعوم بأحدث تقنيات الذكاء الاصطناعي')}
            </span>
            <div className="hero-tech-badges">
              {techBadges.map((badge, index) => (
                <span
                  key={badge.label + index}
                  className="hero-tech-badge"
                >
                  {badge.icon && (
                    <span className="hero-tech-icon">
                      {badge.icon}
                    </span>
                  )}
                  <span className="hero-tech-text">
                    {badge.label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* مؤشر التمرير */}
          <div className="hero-scroll-hint">
            <span className="hero-scroll-dot" />
            <span className="hero-scroll-text">
              {t('hero.scroll', 'اكتشف المزيد')}
            </span>
          </div>
        </div>

        {/* كارت البوت / المحرك الحي */}
        <aside className="hero-panel">
          <div className="hero-panel-header">
            <span className="hero-panel-tag">
              LIVE
            </span>
            <span className="hero-panel-title">
              QUANTUM AI TRADER
            </span>
            <span className="hero-panel-subtitle">
              Real-Time Execution Engine
            </span>
          </div>

          <div className="hero-panel-status">
            <span className="hero-status-dot" />
            <span className="hero-status-text">
              {t('hero.engine.running', 'Running • 24/7')}
            </span>
          </div>

          <div className="hero-panel-chart">
            {[52, 68, 40, 88, 75, 92, 60, 84, 70, 95].map(
              (height, idx) => (
                <div
                  key={idx}
                  className="hero-chart-bar"
                  style={{ height: `${height}%` }}
                />
              ),
            )}
          </div>

          <div className="hero-panel-metrics">
            <div className="hero-panel-metric">
              <span className="hero-panel-label">
                RISK
              </span>
              <span className="hero-panel-value hero-panel-value-green">
                Balanced
              </span>
            </div>
            <div className="hero-panel-metric">
              <span className="hero-panel-label">
                PNL (30D)
              </span>
              <span className="hero-panel-value hero-panel-value-positive">
                +12.4%
              </span>
            </div>
            <div className="hero-panel-metric">
              <span className="hero-panel-label">
                BOT STATUS
              </span>
              <span className="hero-panel-value">
                {t('hero.botStatus', 'Running')}
              </span>
            </div>
          </div>

          <div className="hero-panel-grid">
            <div className="hero-panel-item">
              <span className="hero-panel-item-label">
                Sessions
              </span>
              <span className="hero-panel-item-value">
                4 / 4
              </span>
            </div>
            <div className="hero-panel-item">
              <span className="hero-panel-item-label">
                Signals / min
              </span>
              <span className="hero-panel-item-value">
                120+
              </span>
            </div>
            <div className="hero-panel-item">
              <span className="hero-panel-item-label">
                Latency
              </span>
              <span className="hero-panel-item-value">
                &lt; 5 ms
              </span>
            </div>
          </div>

          {/* الشريط السفلي للأرقام السريعة */}
          <div className="hero-bottom-strip">
            <span className="hero-bottom-label">
              {t('hero.liveSystem', 'نظام حي يعمل الآن')}
            </span>
            <div className="hero-bottom-metrics">
              {heroMetrics.map((m, idx) => (
                <div
                  key={m.label + idx}
                  className="hero-bottom-metric"
                >
                  <span className="hero-bottom-metric-label">
                    {m.label}
                  </span>
                  <span className="hero-bottom-metric-value">
                    {m.value}
                  </span>
                  <span className="hero-bottom-metric-hint">
                    {m.hint}
                  </span>
                </div>
              ))}
            </div>
            <div className="hero-bottom-summary">
              2,847+ متداول نشط • $154M+ حجم تداول اليوم
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default HeroSection;
