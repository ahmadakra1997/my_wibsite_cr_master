import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './LivePerformance.css';

const LivePerformance = () => {
  const { t } = useTranslation();

  const [performanceData, setPerformanceData] = useState({});
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [activeTimeframe, setActiveTimeframe] = useState('24h');
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [tradingPairs, setTradingPairs] = useState([]);

  const sectionRef = useRef(null);

  const timeframes = [
    { value: '1h', label: '1 ساعة' },
    { value: '24h', label: '24 ساعة' },
    { value: '7d', label: '7 أيام' },
    { value: '30d', label: '30 يوم' },
  ];

  // إظهار المخطط عند دخول القسم في الشاشة
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsChartVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // محاكاة بيانات الأداء الحية (نفس المنطق الموجود في الكود الأصلي تقريبًا) :contentReference[oaicite:4]{index=4}
  useEffect(() => {
    const simulateLiveData = () => {
      const performance = {
        activeTrades: Math.floor(Math.random() * 50) + 20,
        dailyProfit: `+${(Math.random() * 5).toFixed(2)}%`,
        successRate: `${(95 + Math.random() * 4).toFixed(1)}%`,
        volume: `$${(Math.random() * 5 + 1).toFixed(1)}M`,
        winRate: `${(85 + Math.random() * 12).toFixed(1)}%`,
        sharpeRatio: (Math.random() * 3 + 1.5).toFixed(2),
        maxDrawdown: `-${(Math.random() * 2).toFixed(1)}%`,
        totalTrades: Math.floor(Math.random() * 1000) + 500,
        avgTradeSize: `$${(Math.random() * 5000 + 1000).toLocaleString()}`,
        marketExposure: `${(Math.random() * 100).toFixed(1)}%`,
      };

      const alerts = [
        {
          id: Date.now(),
          type: 'success',
          message: `صفقة ناجحة: BTC/USD +${(Math.random() * 3).toFixed(2)}%`,
          time: new Date().toLocaleTimeString(),
          pair: 'BTC/USD',
          profit: `+${(Math.random() * 500).toFixed(2)}`,
        },
        {
          id: Date.now() + 1,
          type: 'info',
          message: 'إشارة جديدة: ETH/USD شراء',
          time: new Date().toLocaleTimeString(),
          pair: 'ETH/USD',
          profit: 'قيد التنفيذ',
        },
        {
          id: Date.now() + 2,
          type: 'success',
          message: `صفقة ناجحة: XRP/USD +${(Math.random() * 4).toFixed(2)}%`,
          time: new Date().toLocaleTimeString(),
          pair: 'XRP/USD',
          profit: `+${(Math.random() * 300).toFixed(2)}`,
        },
      ];

      const pairs = [
        {
          symbol: 'BTC/USD',
          price: `$${(45000 + Math.random() * 5000).toLocaleString()}`,
          change: `+${(Math.random() * 3).toFixed(2)}%`,
          volume: '$2.4B',
        },
        {
          symbol: 'ETH/USD',
          price: `$${(2500 + Math.random() * 500).toLocaleString()}`,
          change: `+${(Math.random() * 2).toFixed(2)}%`,
          volume: '$1.2B',
        },
        {
          symbol: 'XRP/USD',
          price: `$${(0.5 + Math.random() * 0.3).toFixed(3)}`,
          change: `+${(Math.random() * 5).toFixed(2)}%`,
          volume: '$800M',
        },
        {
          symbol: 'ADA/USD',
          price: `$${(0.4 + Math.random() * 0.2).toFixed(3)}`,
          change: `+${(Math.random() * 4).toFixed(2)}%`,
          volume: '$600M',
        },
      ];

      setPerformanceData(performance);
      setLiveAlerts((prev) => [alerts[0], ...prev.slice(0, 9)]);
      setTradingPairs(pairs);
    };

    simulateLiveData();
    const interval = setInterval(simulateLiveData, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClearAlerts = () => setLiveAlerts([]);

  const generateChartData = () =>
    Array.from({ length: 20 }, (_, i) => ({
      x: i,
      y: Math.sin(i * 0.5) * 50 + 50 + Math.random() * 20,
    }));

  const chartData = generateChartData();

  const maxGain = chartData.length
    ? Math.max(...chartData.map((p) => p.y))
    : 0;

  const avgGain = chartData.length
    ? chartData.reduce((sum, p) => sum + p.y, 0) / chartData.length
    : 0;

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📡';
    }
  };

  const getAlertClassName = (type) => {
    switch (type) {
      case 'success':
        return 'alert-item alert-success';
      case 'info':
        return 'alert-item alert-info';
      case 'warning':
        return 'alert-item alert-warning';
      case 'error':
        return 'alert-item alert-error';
      default:
        return 'alert-item alert-default';
    }
  };

  return (
    <section ref={sectionRef} className="performance-section">
      {/* خلفية متحركة */}
      <div className="performance-background">
        <div className="quantum-particles-performance" />
        <div className="neon-grid-performance" />
        <div className="performance-glow" />
      </div>

      <div className="performance-container">
        {/* العنوان الرئيسي */}
        <header className="performance-header">
          <div className="header-badge">
            <span className="badge-icon">📡</span>
            <span>
              {t(
                'livePerformance.badge',
                'أداء حي لنظام QUANTUM AI TRADING PLATFORM'
              )}
            </span>
          </div>

          <h2 className="performance-title">
            {t('livePerformance.title.main', 'أداء حي مباشر')}{' '}
            <span className="title-highlight">
              {t('livePerformance.title.highlight', 'في الوقت الحقيقي')}
            </span>
          </h2>

          <p className="performance-subtitle">
            {t(
              'livePerformance.subtitle',
              'تتبع أداء نظام التداول الآلي مع تحديثات فورية وإحصائيات حية مباشرة من الأسواق العالمية.'
            )}
          </p>
        </header>

        {/* عناصر التحكم بالوقت */}
        <section className="timeframe-controls">
          <div className="controls-header">
            <h3 className="controls-title">
              ⏰{' '}
              {t('livePerformance.timeframe.title', 'الفترة الزمنية')}
            </h3>
            <div className="live-indicator">
              <span className="live-dot" />
              <span>
                {t('livePerformance.timeframe.live', 'مباشر')}
              </span>
            </div>
          </div>

          <div className="timeframe-buttons">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.value}
                type="button"
                onClick={() => setActiveTimeframe(timeframe.value)}
                className={`timeframe-btn ${
                  activeTimeframe === timeframe.value
                    ? 'timeframe-active'
                    : ''
                }`}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </section>

        {/* الشبكة الرئيسية */}
        <div className="performance-grid">
          {/* بطاقة المخطط */}
          <article className="performance-card chart-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">📈</span>
                {t(
                  'livePerformance.chart.title',
                  'مخطط الأداء المباشر'
                )}
              </h3>

              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color profit-color" />
                  <span>
                    {t(
                      'livePerformance.chart.legend.profit',
                      'الأرباح'
                    )}
                  </span>
                </div>
                <div className="legend-item">
                  <span className="legend-color volume-color" />
                  <span>
                    {t(
                      'livePerformance.chart.legend.volume',
                      'الحجم'
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="chart-container">
              {isChartVisible && (
                <div className="live-chart">
                  <div className="chart-area">
                    {chartData.map((point, index) => {
                      const left =
                        chartData.length > 1
                          ? (index / (chartData.length - 1)) * 100
                          : 50;
                      const normalized = Math.max(
                        5,
                        Math.min(95, point.y)
                      );

                      return (
                        <div
                          key={index}
                          className="chart-point"
                          style={{
                            left: `${left}%`,
                            bottom: `${normalized}%`,
                          }}
                        >
                          <div className="point-tooltip">
                            +{point.y.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                    <div className="chart-line" />
                  </div>

                  <div className="chart-labels">
                    <span>
                      {t(
                        'livePerformance.chart.start',
                        'بداية الفترة'
                      )}
                    </span>
                    <span>
                      {t('livePerformance.chart.end', 'نهاية الفترة')}
                    </span>
                  </div>

                  <div className="chart-stats">
                    <div className="chart-stat">
                      <span className="stat-label">
                        {t(
                          'livePerformance.chart.max',
                          'أعلى ربح'
                        )}
                      </span>
                      <span className="stat-value">
                        {maxGain
                          ? `+${maxGain.toFixed(2)}%`
                          : '+0.00%'}
                      </span>
                    </div>
                    <div className="chart-stat">
                      <span className="stat-label">
                        {t(
                          'livePerformance.chart.avg',
                          'متوسط الربح'
                        )}
                      </span>
                      <span className="stat-value">
                        {avgGain
                          ? `+${avgGain.toFixed(2)}%`
                          : '+0.00%'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* بطاقة الإحصائيات الفورية */}
          <article className="performance-card stats-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">⚡</span>
                {t(
                  'livePerformance.stats.title',
                  'إحصائيات فورية'
                )}
              </h3>
              <span className="stats-update">
                {t(
                  'livePerformance.stats.updated',
                  'آخر تحديث: الآن'
                )}
              </span>
            </div>

            <div className="stats-grid">
              <div className="stat-item primary">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {performanceData.dailyProfit || '+0.00%'}
                  </div>
                  <div className="stat-label">
                    {t(
                      'livePerformance.stats.dailyProfit',
                      'ربح اليوم'
                    )}
                  </div>
                </div>
                <div className="stat-trend positive">↑</div>
                <div className="stat-badge excellent">
                  {t(
                    'livePerformance.stats.mood',
                    'أداء ممتاز'
                  )}
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {performanceData.successRate || '0%'}
                  </div>
                  <div className="stat-label">
                    {t(
                      'livePerformance.stats.successRate',
                      'معدل النجاح'
                    )}
                  </div>
                </div>
                <div className="stat-trend stable">→</div>
                <div className="stat-badge good">
                  {t(
                    'livePerformance.stats.quality',
                    'جودة الإشارات'
                  )}
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {performanceData.activeTrades || 0}
                  </div>
                  <div className="stat-label">
                    {t(
                      'livePerformance.stats.activeTrades',
                      'صفقات نشطة الآن'
                    )}
                  </div>
                </div>
                <div className="stat-trend positive">↑</div>
                <div className="stat-badge good">
                  {performanceData.volume || '$0M'}
                </div>
              </div>
            </div>
          </article>

          {/* بطاقة أزواج التداول */}
          <article className="performance-card pairs-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">🧬</span>
                {t(
                  'livePerformance.pairs.title',
                  'أزواج التداول النشطة'
                )}
              </h3>
              <div className="pairs-count">
                <span className="count-badge">
                  {tradingPairs.length}
                </span>
              </div>
            </div>

            <div className="pairs-list">
              {tradingPairs.map((pair, index) => {
                const positive = !`${pair.change || ''}`
                  .trim()
                  .startsWith('-');

                return (
                  <div
                    key={`${pair.symbol}-${index}`}
                    className="pair-item"
                  >
                    <div className="pair-symbol">{pair.symbol}</div>
                    <div className="pair-price">{pair.price}</div>
                    <div
                      className={`pair-change ${
                        positive ? 'positive' : 'negative'
                      }`}
                    >
                      {pair.change}
                    </div>
                    <div className="pair-volume">{pair.volume}</div>
                  </div>
                );
              })}
            </div>
          </article>

          {/* بطاقة الإشعارات الحية */}
          <article className="performance-card alerts-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">🔔</span>
                {t(
                  'livePerformance.alerts.title',
                  'الإشعارات الحية'
                )}
                <span className="alerts-badge">
                  {liveAlerts.length}
                </span>
              </h3>

            <button
              type="button"
              className="alerts-clear"
              onClick={handleClearAlerts}
            >
              {t(
                'livePerformance.alerts.clear',
                'مسح الكل'
              )}
            </button>
            </div>

            <div className="alerts-container">
              {liveAlerts.length > 0 ? (
                liveAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={getAlertClassName(alert.type)}
                  >
                    <div className="alert-icon">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="alert-content">
                      <div className="alert-message">
                        {alert.message}
                      </div>
                      <div className="alert-details">
                        <span className="alert-pair">
                          {alert.pair}
                        </span>
                        <span className="alert-profit">
                          {alert.profit}
                        </span>
                        <span className="alert-time">
                          {alert.time}
                        </span>
                      </div>
                    </div>
                    <div className="alert-actions">
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() =>
                          setLiveAlerts((prev) =>
                            prev.filter((a) => a.id !== alert.id)
                          )
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-alerts">
                  <div className="no-alerts-icon">🔕</div>
                  <div>
                    {t(
                      'livePerformance.alerts.empty',
                      'لا توجد إشعارات حالياً'
                    )}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>

        {/* التحليلات المتقدمة */}
        <section className="advanced-analytics">
          <div className="analytics-header">
            <h3 className="analytics-title">
              {t(
                'livePerformance.analytics.title',
                'تحليلات أداء متقدمة'
              )}
            </h3>
            <p className="analytics-subtitle">
              {t(
                'livePerformance.analytics.subtitle',
                'تحليلات شاملة لأداء نظام QUANTUM AI TRADING PLATFORM عبر مختلف المؤشرات.'
              )}
            </p>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-icon">🎯</div>
              <div className="analytics-content">
                <h4>{t('livePerformance.analytics.accuracy', 'دقة التنبؤ')}</h4>
                <div className="analytics-value">94.7%</div>
                <div className="analytics-trend positive">
                  +1.3% {t('livePerformance.analytics.vsLastMonth', 'عن الشهر الماضي')}
                </div>
                <p className="analytics-description">
                  {t(
                    'livePerformance.analytics.accuracyDesc',
                    'دقة عالية في قراءة إشارات السوق المتقدمة.'
                  )}
                </p>
                <div className="analytics-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: '94.7%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon">⚡</div>
              <div className="analytics-content">
                <h4>{t('livePerformance.analytics.speed', 'سرعة التنفيذ')}</h4>
                <div className="analytics-value">0.002s</div>
                <div className="analytics-trend positive">
                  +15% {t('livePerformance.analytics.vsLastMonth', 'عن الشهر الماضي')}
                </div>
                <p className="analytics-description">
                  {t(
                    'livePerformance.analytics.speedDesc',
                    'تنفيذ شبه فوري للأوامر على منصات التداول المدعومة.'
                  )}
                </p>
                <div className="analytics-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: '88%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon">⚖️</div>
              <div className="analytics-content">
                <h4>
                  {t(
                    'livePerformance.analytics.risk',
                    'كفاءة إدارة المخاطر'
                  )}
                </h4>
                <div className="analytics-value">1 : 3.2</div>
                <p className="analytics-description">
                  {t(
                    'livePerformance.analytics.riskDesc',
                    'نسبة مخاطرة إلى عائد محسّنة وفق أفضل ممارسات إدارة رأس المال.'
                  )}
                </p>
                <p className="analytics-uptime">
                  {t(
                    'livePerformance.analytics.riskNote',
                    'تحكم دقيق في حجم الصفقة والتعرض الكلي للمحفظة.'
                  )}
                </p>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon">🛡️</div>
              <div className="analytics-content">
                <h4>
                  {t(
                    'livePerformance.analytics.uptime',
                    'استقرار النظام'
                  )}
                </h4>
                <div className="analytics-value">99.9%</div>
                <p className="analytics-description">
                  {t(
                    'livePerformance.analytics.uptimeDesc',
                    'وقت تشغيل شبه كامل مع مراقبة مستمرة للخدمات الحيوية.'
                  )}
                </p>
                <p className="analytics-uptime">
                  {t(
                    'livePerformance.analytics.uptimeSla',
                    'مهيّأ للوصول إلى مستوى شركات التداول الاحترافية.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};

export default LivePerformance;
