import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './HeroSection.css';

const HeroSection = () => {
  const { t } = useTranslation();
  const [currentStat, setCurrentStat] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef(null);

  const stats = [
    { number: '99.7%', label: t('stats.accuracyRate'), icon: '🎯', suffix: 'دقة' },
    { number: '0.002s', label: t('stats.executionSpeed'), icon: '⚡', suffix: 'سرعة' },
    { number: '24/7', label: t('stats.marketCoverage'), icon: '🌐', suffix: 'تشغيل' },
    { number: 'QA+', label: t('stats.aiTechnology'), icon: '🤖', suffix: 'ذكاء' }
  ];

  const techBadges = [
    { label: t('techBadges.quantumAI'), icon: '🌀' },
    { label: t('techBadges.machineLearning'), icon: '🧠' },
    { label: t('techBadges.realTimeAnalytics'), icon: '📊' },
    { label: t('techBadges.multiPlatform'), icon: '🔄' },
    { label: t('techBadges.encryptedSecurity'), icon: '🛡️' },
    { label: t('techBadges.autoTrading'), icon: '🤖' }
  ];

  // شريط الأرقام السريع أسفل الهيرو
  const heroMetrics = [
    { label: 'Uptime', value: '99.9%', hint: 'Core Engine' },
    { label: 'Automation', value: '24 / 24', hint: 'Active Modules' },
    { label: 'Latency', value: '< 5 ms', hint: 'Order Routing' },
    { label: 'Regions', value: '12+', hint: 'Global Coverage' }
  ];

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
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

  return (
    <section
      ref={sectionRef}
      className="hero-section"
      onMouseMove={handleMouseMove}
    >
      {/* الخلفية الديناميكية */}
      <div className="hero-background">
        <div
          className="hero-gradient-overlay"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(0, 163, 255, 0.18) 0%, transparent 55%)`
          }}
        ></div>

        <div className="quantum-particles-hero">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="quantum-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${15 + Math.random() * 20}s`
              }}
            ></div>
          ))}
        </div>

        <div className="neon-grid-hero"></div>

        {/* الأشكال العائمة */}
        <div className="floating-elements">
          <div className="floating-element element-1">⚛️</div>
          <div className="floating-element element-2">🔷</div>
          <div className="floating-element element-3">⚡</div>
          <div className="floating-element element-4">🌀</div>
          <div className="floating-element element-5">💎</div>
          <div className="floating-element element-6">🌌</div>
        </div>

        {/* تأثيرات النيون */}
        <div className="neon-effects">
          <div className="neon-ring ring-1"></div>
          <div className="neon-ring ring-2"></div>
          <div className="neon-ring ring-3"></div>
        </div>
      </div>

      <div className="hero-container">
        {/* تخطيط رئيسي: محتوى + كارد مرئي */}
        <div className="hero-main-layout">
          {/* المحتوى النصي */}
          <div className={`hero-content ${isVisible ? 'hero-visible' : ''}`}>
            {/* الشعار والعنوان */}
            <div className="hero-header">
              <div className="logo-section">
                <div className="main-logo">
                  <div className="logo-glow"></div>
                  <h1 className="logo-text">
                    <span className="logo-primary">QA</span>
                    <span className="logo-secondary">TRADER</span>
                    <span className="logo-accent">QUANTUM AI</span>
                  </h1>
                  <div className="logo-subtitle">
                    ADVANCED AI TRADING PLATFORM
                  </div>
                </div>

                <div className="title-divider">
                  <div className="divider-line"></div>
                  <div className="divider-dot"></div>
                  <div className="divider-line"></div>
                </div>
              </div>

              {/* العنوان الرئيسي */}
              <div className="main-title-section">
                <h2 className="main-title">
                  <span className="title-line title-line-1">
                    QUANTUM AI TRADING
                  </span>
                  <span className="title-line title-line-2">
                    <span className="title-highlight">PLATFORM</span>
                  </span>
                  <span className="title-line title-line-3">
                    REVOLUTIONARY TECHNOLOGY
                  </span>
                </h2>

                <p className="hero-description">
                  Experience the power of <strong>QA TRADER</strong> Quantum AI
                  technology for unprecedented profits in global trading markets
                </p>
              </div>
            </div>

            {/* الإحصائيات الدوارة */}
            <div className="hero-stats">
              <div className="stats-display">
                <div className="stat-main">
                  <div className="stat-icon">{stats[currentStat].icon}</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats[currentStat].number}</div>
                    <div className="stat-suffix">{stats[currentStat].suffix}</div>
                  </div>
                </div>
                <div className="stat-label">{stats[currentStat].label}</div>
              </div>

              <div className="stats-grid">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`stat-mini ${
                      index === currentStat ? 'stat-active' : ''
                    }`}
                    onClick={() => setCurrentStat(index)}
                  >
                    <span className="mini-icon">{stat.icon}</span>
                    <span className="mini-number">{stat.number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* أزرار الإجراء الرئيسية */}
            <div className="hero-actions">
              <button className="cta-button primary">
                <span className="btn-glow"></span>
                <span className="btn-content">
                  <span className="btn-icon">🚀</span>
                  ابدأ التداول الآلي الآن
                </span>
                <span className="btn-badge">جديد</span>
              </button>

              <button className="cta-button secondary" onClick={scrollToFeatures}>
                <span className="btn-content">
                  <span className="btn-icon">📊</span>
                  استعرض الميزات
                </span>
              </button>

              <button className="cta-button tertiary">
                <span className="btn-content">
                  <span className="btn-icon">🎥</span>
                  شاهد العرض الحي
                </span>
              </button>
            </div>

            {/* شارات التكنولوجيا */}
            <div className="tech-badges">
              <div className="badges-header">
                <span className="badges-title">⚡ مدعوم بتقنيات متقدمة</span>
              </div>
              <div className="badges-grid">
                {techBadges.map((badge, index) => (
                  <div
                    key={index}
                    className="tech-badge"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <span className="badge-icon">{badge.icon}</span>
                    <span className="badge-label">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* مؤشر التمرير */}
            <div className="scroll-indicator">
              <div className="scroll-text">اكتشف المزيد</div>
              <div className="scroll-arrow">
                <div className="arrow-line"></div>
              </div>
            </div>
          </div>

          {/* الكارد المرئي للبوت – يعطي إحساس منصة حقيقية */}
          <aside
            className={`hero-visual-panel ${isVisible ? 'hero-visible' : ''}`}
          >
            <div className="hero-card">
              <div className="hero-card-header">
                <span className="badge-live-pill">LIVE</span>
                <div className="hero-card-title-block">
                  <span className="hero-card-title">QUANTUM AI TRADER</span>
                  <span className="hero-card-subtitle">
                    Real-Time Execution Engine
                  </span>
                </div>
                <span className="hero-card-status">Running ●</span>
              </div>

              <div className="hero-card-chart">
                {[52, 68, 40, 88, 75, 92, 60, 84, 70, 95].map((h, idx) => (
                  <div
                    key={idx}
                    className="hero-card-bar"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <div className="hero-card-footer">
                <div className="hero-card-metric">
                  <span className="label">RISK</span>
                  <span className="value">Balanced</span>
                </div>
                <div className="hero-card-metric">
                  <span className="label">PNL (30D)</span>
                  <span className="value accent">+12.4%</span>
                </div>
                <div className="hero-card-metric">
                  <span className="label">BOT STATUS</span>
                  <span className="value">Running</span>
                </div>
              </div>

              <div className="hero-card-meta">
                <div className="meta-item">
                  <span className="meta-label">Sessions</span>
                  <span className="meta-value">4 / 4</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Signals / min</span>
                  <span className="meta-value">120+</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Latency</span>
                  <span className="meta-value">&lt; 5 ms</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* الشريط السفلي – أرقام ثقة سريعة */}
        <div className="hero-footer">
          <div className="hero-footer-inner">
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span className="live-text">نظام حي يعمل الآن</span>
            </div>

            <div className="hero-metrics-strip">
              {heroMetrics.map((m, idx) => (
                <div key={idx} className="hero-metric-pill">
                  <span className="metric-label">{m.label}</span>
                  <span className="metric-value">{m.value}</span>
                  <span className="metric-hint">{m.hint}</span>
                </div>
              ))}
            </div>

            <div className="user-stats">
              <span className="user-stat">
                <strong>2,847+</strong> متداول نشط
              </span>
              <span className="stat-separator">•</span>
              <span className="user-stat">
                <strong>$154M+</strong> حجم تداول اليوم
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
