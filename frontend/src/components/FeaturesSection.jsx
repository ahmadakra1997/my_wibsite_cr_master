// frontend/src/components/FeaturesSection.jsx

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
      icon: '⚡',
      title: t('features.speed.title', 'سرعة تنفيذ استثنائية'),
      description: t(
        'features.speed.description',
        'تنفيذ الأوامر في أقل من 2 مللي ثانية مع بنية تحتية عالمية.',
      ),
      specs: ['0.002s تنفيذ', '99.7% دقة', '24/7 تشغيل'],
      details: [
        'تنفيذ الأوامر في أقل من 2 مللي ثانية',
        'أسرع من المنافسين بـ 10x',
        'خوادم عالمية موزعة',
        'اتصال مباشر بمنصات التداول',
      ],
      color: '#00a3ff',
    },
    {
      icon: '🎯',
      title: t('features.accuracy.title', 'دقة تنبؤ عالية'),
      description: t(
        'features.accuracy.description',
        'شبكات عصبية متعددة الطبقات تحلل عشرات المؤشرات الفنية.',
      ),
      specs: ['Deep Learning', 'Neural Networks', 'Real-time Analysis'],
      details: [
        'شبكات عصبية متعددة الطبقات',
        'تحليل 100+ مؤشر فني',
        'مراقبة الأخبار في الوقت الحقيقي',
        'تحديث النماذج كل 15 دقيقة',
      ],
      color: '#00ff88',
    },
    {
      icon: '🔐',
      title: t('features.security.title', 'أمان من مستوى المؤسسات'),
      description: t(
        'features.security.description',
        'تشفير قوي للبروتوكولات ومفاتيح الـ API مع مراقبة مستمرة.',
      ),
      specs: ['AES-256 تشفير', 'SSL Secure', 'Protected'],
      details: [
        'تشفير AES-256 لمفاتيح API',
        'اتصالات SSL مشفرة',
        'نسخ احتياطية يومية',
        'مراقبة أمنية مستمرة',
      ],
      color: '#a855f7',
    },
    {
      icon: '🤖',
      title: t('features.automation.title', 'أتمتة كاملة بدون توقف'),
      description: t(
        'features.automation.description',
        'تشغيل مستمر على مدار الساعة مع إدارة ذكية للمخاطر.',
      ),
      specs: ['تداول آلي', 'تشغيل 24/7', 'لا حاجة للتدخل'],
      details: [
        'تشغيل مستمر بدون توقف',
        'إدارة تلقائية للمخاطر',
        'تكيف مع ظروف السوق',
        'تنفيذ أوامر متعددة',
      ],
      color: '#ff6b35',
    },
    {
      icon: '📈',
      title: t('features.analytics.title', 'تحليلات متقدمة للأداء'),
      description: t(
        'features.analytics.description',
        'لوحات تحكم ورسوم بيانية تفاعلية مع بيانات في الوقت الفعلي.',
      ),
      specs: ['بيانات حية', 'رسوم بيانية متقدمة', 'رؤى السوق'],
      details: [
        'تحليلات في الوقت الفعلي',
        'رسوم بيانية تفاعلية',
        'تقارير أداء مفصلة',
        'تنبؤات ذكية',
      ],
      color: '#00d4ff',
    },
    {
      icon: '🌍',
      title: t('features.global.title', 'جاهزية عالمية متعددة المنصات'),
      description: t(
        'features.global.description',
        'دعم منصات متعددة وأجهزة مختلفة مع تغطية عالمية.',
      ),
      specs: ['منصات متعددة', 'عبر الأجهزة', 'عالمي'],
      details: [
        'دعم 10+ منصات تداول',
        'متوافق مع جميع الأجهزة',
        'تغطية عالمية',
        'دعم لغات متعددة',
      ],
      color: '#ffd700',
    },
  ];

  const stats = [
    { value: '50K+', label: 'مستخدم نشط', icon: '👤' },
    { value: '$2B+', label: 'حجم تداول', icon: '💰' },
    { value: '99.7%', label: 'دقة التنبؤ', icon: '🎯' },
    { value: '24/7', label: 'تشغيل مستمر', icon: '⚡' },
    { value: '0.002s', label: 'سرعة تنفيذ', icon: '⚙️' },
    { value: '10+', label: 'منصات مدعومة', icon: '🌐' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () =>
        setActiveFeature(prev => (prev + 1) % features.length),
      4000,
    );
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <section
      id="features"
      ref={sectionRef}
      className={`features-section ${
        isVisible ? 'features-visible' : ''
      }`}
    >
      {/* خلفية خفيفة */}
      <div className="features-bg" />

      {/* العنوان والوصف */}
      <header className="features-header">
        <span className="features-eyebrow">
          ✨ {t('features.overline', 'نظام QUANTUM AI TRADER')}
        </span>
        <h2 className="features-title">
          {t('features.title', 'الميزات المتقدمة')}
        </h2>
        <p className="features-description">
          {t(
            'features.description',
            'اكتشف قوة نظام التداول الآلي الأكثر تطوراً في العالم، المصمم خصيصاً لتحقيق أقصى استفادة من تقنية QUANTUM AI TRADING PLATFORM.',
          )}
        </p>
      </header>

      {/* الشبكة الرئيسية للميزات */}
      <div className="features-grid">
        {features.map((feature, index) => {
          const isActive = index === activeFeature;
          return (
            <article
              key={feature.title + index}
              className={
                isActive
                  ? 'feature-card feature-card-active'
                  : 'feature-card'
              }
              style={{ '--feature-color': feature.color }}
              onClick={() => setActiveFeature(index)}
            >
              {/* رأس البطاقة */}
              <div className="feature-card-header">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                {isActive && (
                  <span className="feature-active-badge">
                    {t(
                      'features.active',
                      'مفعّلة الآن',
                    )}
                  </span>
                )}
              </div>

              <h3 className="feature-title">
                {feature.title}
              </h3>
              <p className="feature-description">
                {feature.description}
              </p>

              {/* المواصفات السريعة */}
              <div className="feature-specs">
                {feature.specs.map((spec, specIndex) => (
                  <span
                    key={spec + specIndex}
                    className="feature-spec-pill"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* التفاصيل */}
              <ul className="feature-details">
                {feature.details.map(
                  (detail, detailIndex) => (
                    <li key={detail + detailIndex}>
                      {detail}
                    </li>
                  ),
                )}
              </ul>

              <div className="feature-glow" />
            </article>
          );
        })}
      </div>

      {/* لوحة التحكم التفاعلية للفلاتر */}
      <section className="features-control-panel">
        <h3 className="features-control-title">
          ️{t(
            'features.controlTitle',
            'التحكم التفاعلي في الميزات',
          )}
        </h3>
        <p className="features-control-description">
          {t(
            'features.controlDescription',
            'اختر الميزة لمشاهدة التفاصيل الكاملة والإحصائيات الحية.',
          )}
        </p>

        <div className="features-toggle-row">
          {features.map((feature, index) => {
            const isActive = index === activeFeature;
            return (
              <button
                key={feature.title + index}
                type="button"
                onClick={() => setActiveFeature(index)}
                className={
                  isActive
                    ? 'feature-toggle feature-toggle-active'
                    : 'feature-toggle'
                }
                style={{ '--feature-color': feature.color }}
              >
                <span className="feature-toggle-icon">
                  {feature.icon}
                </span>
                <span className="feature-toggle-text">
                  {feature.title}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* قسم الإحصائيات */}
      <section className="features-stats">
        <h3 className="features-stats-title">
          {t('features.statsTitle', 'أرقام لا تكذب')}
        </h3>
        <p className="features-stats-description">
          {t(
            'features.statsDescription',
            'إحصائيات حية تثبت تفوق نظام QUANTUM AI TRADING PLATFORM.',
          )}
        </p>

        <div className="features-stats-grid">
          {stats.map((stat, index) => (
            <div
              key={stat.label + index}
              className="features-stat-card"
            >
              <span className="features-stat-icon">
                {stat.icon}
              </span>
              <span className="features-stat-value">
                {stat.value}
              </span>
              <span className="features-stat-label">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* كيف يعمل النظام؟ */}
      <section className="features-how">
        <h3 className="features-how-title">
          {t('features.howTitle', 'كيف يعمل النظام؟')}
        </h3>
        <p className="features-how-description">
          {t(
            'features.howDescription',
            'تقنية QUANTUM AI TRADING PLATFORM المدعومة بالذكاء الاصطناعي المتقدم تعمل عبر أربع مراحل رئيسية:',
          )}
        </p>

        <ol className="features-how-steps">
          <li>
            <h4>1. {t('features.how.collect', 'جمع البيانات')}</h4>
            <p>
              {t(
                'features.how.collectDesc',
                'جمع وتحليل البيانات من 10+ منصات تداول في الوقت الفعلي.',
              )}
            </p>
          </li>
          <li>
            <h4>2. {t('features.how.analyze', 'التحليل الفني')}</h4>
            <p>
              {t(
                'features.how.analyzeDesc',
                'تحليل 100+ مؤشر باستخدام نماذج ذكاء اصطناعي متعددة الطبقات.',
              )}
            </p>
          </li>
          <li>
            <h4>3. {t('features.how.decide', 'اتخاذ القرار')}</h4>
            <p>
              {t(
                'features.how.decideDesc',
                'تحديد فرص التداول بدقة تصل إلى 99.7% مع مراعاة المخاطر.',
              )}
            </p>
          </li>
          <li>
            <h4>4. {t('features.how.execute', 'التنفيذ الآلي')}</h4>
            <p>
              {t(
                'features.how.executeDesc',
                'تنفيذ الصفقات في أقل من 0.002 ثانية مع مراقبة مستمرة.',
              )}
            </p>
          </li>
        </ol>
      </section>

      {/* دعوة للعمل */}
      <section className="features-cta">
        <h3 className="features-cta-title">
          {t('features.ctaTitle', 'جاهز للانطلاق؟')}
        </h3>
        <p className="features-cta-description">
          {t(
            'features.ctaDescription',
            'انضم إلى آلاف المتداولين الناجحين وابدأ رحلتك مع أقوى نظام تداول آلي.',
          )}
        </p>
        <div className="features-cta-actions">
          <button
            type="button"
            className="features-cta-btn features-cta-primary"
          >
            {t('features.cta.primary', 'ابدأ التداول الآن')}
          </button>
          <button
            type="button"
            className="features-cta-btn features-cta-secondary"
          >
            {t(
              'features.cta.secondary',
              'شاهد الأداء الحي',
            )}
          </button>
        </div>
      </section>
    </section>
  );
};

export default FeaturesSection;
