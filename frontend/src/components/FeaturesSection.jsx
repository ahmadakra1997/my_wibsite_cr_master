import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './FeaturesSection.css';

const FeaturesSection = () => {
  const { t } = useTranslation();
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const features = [
    {
      icon: '🚀',
      title: t('features.speed.title'),
      description: t('features.speed.description'),
      specs: ['0.002s تنفيذ', '99.7% دقة', '24/7 تشغيل'],
      details: [
        'تنفيذ الأوامر في أقل من 2 مللي ثانية',
        'أسرع من المنافسين بـ 10x',
        'خوادم عالمية موزعة',
        'اتصال مباشر بمنصات التداول'
      ],
      color: '#00a3ff',
      gradient: 'from-neon-blue to-energy-blue'
    },
    {
      icon: '🎯',
      title: t('features.accuracy.title'),
      description: t('features.accuracy.description'),
      specs: ['Deep Learning', 'Neural Networks', 'Real-time Analysis'],
      details: [
        'شبكات عصبية متعددة الطبقات',
        'تحليل 100+ مؤشر فني',
        'مراقبة الأخبار في الوقت الحقيقي',
        'تحديث النماذج كل 15 دقيقة'
      ],
      color: '#00ff88',
      gradient: 'from-neon-green to-energy-green'
    },
    {
      icon: '🛡️',
      title: t('features.security.title'),
      description: t('features.security.description'),
      specs: ['AES-256 تشفير', 'SSL Secure', 'Protected'],
      details: [
        'تشفير AES-256 لمفاتيح API',
        'اتصالات SSL مشفرة',
        'نسخ احتياطية يومية',
        'مراقبة أمنية مستمرة'
      ],
      color: '#a855f7',
      gradient: 'from-energy-purple to-neon-purple'
    },
    {
      icon: '🤖',
      title: t('features.automation.title'),
      description: t('features.automation.description'),
      specs: ['تداول آلي', 'تشغيل 24/7', 'لا حاجة للتدخل'],
      details: [
        'تشغيل مستمر بدون توقف',
        'إدارة تلقائية للمخاطر',
        'تكيف مع ظروف السوق',
        'تنفيذ أوامر متعددة'
      ],
      color: '#ff6b35',
      gradient: 'from-energy-orange to-neon-orange'
    },
    {
      icon: '📊',
      title: t('features.analytics.title'),
      description: t('features.analytics.description'),
      specs: ['بيانات حية', 'رسوم بيانية متقدمة', 'رؤى السوق'],
      details: [
        'تحليلات في الوقت الفعلي',
        'رسوم بيانية تفاعلية',
        'تقارير أداء مفصلة',
        'تنبؤات ذكية'
      ],
      color: '#00d4ff',
      gradient: 'from-cyan-400 to-blue-500'
    },
    {
      icon: '🌐',
      title: t('features.global.title'),
      description: t('features.global.description'),
      specs: ['منصات متعددة', 'عبر الأجهزة', 'عالمي'],
      details: [
        'دعم 10+ منصات تداول',
        'متوافق مع جميع الأجهزة',
        'تغطية عالمية',
        'دعم لغات متعددة'
      ],
      color: '#ffd700',
      gradient: 'from-yellow-400 to-orange-400'
    }
  ];

  const stats = [
    { value: '50K+', label: 'مستخدم نشط', icon: '👥' },
    { value: '$2B+', label: 'حجم تداول', icon: '💰' },
    { value: '99.7%', label: 'دقة التنبؤ', icon: '🎯' },
    { value: '24/7', label: 'تشغيل مستمر', icon: '⚡' },
    { value: '0.002s', label: 'سرعة تنفيذ', icon: '🚀' },
    { value: '10+', label: 'منصات مدعومة', icon: '🌐' }
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
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <section 
      id="features" 
      ref={sectionRef}
      className={`features-section ${isVisible ? 'features-visible' : ''}`}
    >
      {/* خلفية متحركة */}
      <div className="features-background">
        <div className="quantum-particles-features"></div>
        <div className="neon-grid-features"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>

      <div className="features-container">
        {/* العنوان الرئيسي */}
        <div className="features-header">
          <div className="features-badge">
            <span className="badge-icon">✨</span>
            نظام QUANTUM AI TRADER
          </div>
          <h2 className="features-title">
            الميزات <span className="title-highlight">المتقدمة</span>
          </h2>
          <p className="features-subtitle">
            اكتشف قوة نظام التداول الآلي الأكثر تطوراً في العالم، 
            مصمم خصيصاً لتحقيق أقصى استفادة من تقنية QUANTUM AI TRADER
          </p>
        </div>

        {/* الشبكة الرئيسية للميزات */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card ${index === activeFeature ? 'feature-active' : ''}`}
              onMouseEnter={() => setActiveFeature(index)}
              style={{
                '--feature-color': feature.color
              }}
            >
              {/* رأس البطاقة */}
              <div className="feature-header">
                <div className="feature-icon-wrapper">
                  <div 
                    className="feature-icon"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <span className="icon-emoji">{feature.icon}</span>
                    <div 
                      className="icon-glow"
                      style={{ backgroundColor: feature.color }}
                    ></div>
                  </div>
                  {index === activeFeature && (
                    <div className="active-pulse"></div>
                  )}
                </div>
                
                <div className="feature-title-section">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </div>

              {/* المواصفات السريعة */}
              <div className="feature-specs">
                {feature.specs.map((spec, specIndex) => (
                  <span
                    key={specIndex}
                    className="feature-spec"
                    style={{
                      backgroundColor: `${feature.color}15`,
                      borderColor: `${feature.color}30`,
                      color: feature.color
                    }}
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* التفاصيل المخفية */}
              <div className="feature-details">
                <div className="details-list">
                  {feature.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="detail-item">
                      <span 
                        className="detail-bullet"
                        style={{ backgroundColor: feature.color }}
                      ></span>
                      <span className="detail-text">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* تأثيرات البطاقة */}
              <div 
                className="feature-glow"
                style={{ 
                  background: `radial-gradient(circle at center, ${feature.color}20, transparent 70%)` 
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* لوحة التحكم التفاعلية */}
        <div className="features-controls">
          <div className="controls-header">
            <h3 className="controls-title">🎛️ التحكم التفاعلي في الميزات</h3>
            <p className="controls-subtitle">
              اختر الميزة لمشاهدة التفاصيل الكاملة والإحصائيات الحية
            </p>
          </div>
          
          <div className="controls-grid">
            {features.map((feature, index) => (
              <button
                key={index}
                className={`control-item ${index === activeFeature ? 'control-active' : ''}`}
                onClick={() => setActiveFeature(index)}
                style={{
                  '--feature-color': feature.color
                }}
              >
                <span className="control-icon">{feature.icon}</span>
                <span className="control-label">{feature.title}</span>
                <div className="control-indicator"></div>
              </button>
            ))}
          </div>
        </div>

        {/* قسم الإحصائيات */}
        <div className="stats-section">
          <div className="stats-background">
            <div className="stats-glow"></div>
          </div>
          
          <div className="stats-container">
            <div className="stats-header">
              <h3 className="stats-title"> أرقام لا تكذب</h3>
              <p className="stats-subtitle">
                إحصائيات حية تثبت تفوق نظام QUANTUM AI TRADING PLATFORM
              </p>
            </div>

            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="stat-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-content">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                  <div className="stat-glow"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* قسم التوضيح التقني */}
        <div className="tech-demo">
          <div className="tech-header">
            <h3 className="tech-title"> كيف يعمل النظام؟</h3>
            <p className="tech-subtitle">
              تقنية QUANTUM AI TRADING PLATFORM المدعومة بالذكاء الاصطناعي المتقدم
            </p>
          </div>

          <div className="tech-steps">
            <div className="tech-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>جمع البيانات</h4>
                <p>جمع وتحليل البيانات من 10+ منصات تداول</p>
              </div>
              <div className="step-icon">📡</div>
            </div>

            <div className="tech-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>التحليل الفني</h4>
                <p>تحليل 100+ مؤشر باستخدام الذكاء الاصطناعي</p>
              </div>
              <div className="step-icon">🧠</div>
            </div>

            <div className="tech-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>اتخاذ القرار</h4>
                <p>تحديد فرص التداول بدقة 99.7%</p>
              </div>
              <div className="step-icon">⚡</div>
            </div>

            <div className="tech-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>التنفيذ الآلي</h4>
                <p>تنفيذ الصفقات في أقل من 0.002 ثانية</p>
              </div>
              <div className="step-icon">🤖</div>
            </div>
          </div>
        </div>

        {/* دعوة للعمل */}
        <div className="features-cta">
          <div className="cta-content">
            <h3 className="cta-title">🚀 جاهز للانطلاق؟</h3>
            <p className="cta-description">
              انضم إلى آلاف المتداولين الناجحين وابدأ رحلتك مع أقوى نظام تداول آلي
            </p>
            <div className="cta-buttons">
              <button className="cta-btn primary">
                🎯 ابدأ التداول الآن
              </button>
              <button className="cta-btn secondary">
                📊 شاهد الأداء الحي
              </button>
            </div>
          </div>
          <div className="cta-glow"></div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;