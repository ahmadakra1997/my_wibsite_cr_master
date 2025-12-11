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
    { value: '30d', label: '30 يوم' }
  ];

  // محاكاة بيانات الأداء الحية
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

  useEffect(() => {
    const simulateLiveData = () => {
      // بيانات الأداء
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
        marketExposure: `${(Math.random() * 100).toFixed(1)}%`
      };

      // إشعارات حية
      const alerts = [
        {
          id: Date.now(),
          type: 'success',
          message: `صفقة ناجحة: BTC/USD +${(Math.random() * 3).toFixed(2)}%`,
          time: new Date().toLocaleTimeString(),
          pair: 'BTC/USD',
          profit: `+${(Math.random() * 500).toFixed(2)}`
        },
        {
          id: Date.now() + 1,
          type: 'info',
          message: 'إشارة جديدة: ETH/USD شراء',
          time: new Date().toLocaleTimeString(),
          pair: 'ETH/USD',
          profit: 'قيد التنفيذ'
        },
        {
          id: Date.now() + 2,
          type: 'success',
          message: `صفقة ناجحة: XRP/USD +${(Math.random() * 4).toFixed(2)}%`,
          time: new Date().toLocaleTimeString(),
          pair: 'XRP/USD',
          profit: `+${(Math.random() * 300).toFixed(2)}`
        }
      ];

      // أزواج التداول
      const pairs = [
        { symbol: 'BTC/USD', price: `$${(45000 + Math.random() * 5000).toLocaleString()}`, change: `+${(Math.random() * 3).toFixed(2)}%`, volume: '$2.4B' },
        { symbol: 'ETH/USD', price: `$${(2500 + Math.random() * 500).toLocaleString()}`, change: `+${(Math.random() * 2).toFixed(2)}%`, volume: '$1.2B' },
        { symbol: 'XRP/USD', price: `$${(0.5 + Math.random() * 0.3).toFixed(3)}`, change: `+${(Math.random() * 5).toFixed(2)}%`, volume: '$800M' },
        { symbol: 'ADA/USD', price: `$${(0.4 + Math.random() * 0.2).toFixed(3)}`, change: `+${(Math.random() * 4).toFixed(2)}%`, volume: '$600M' }
      ];

      setPerformanceData(performance);
      setLiveAlerts(prev => [alerts[0], ...prev.slice(0, 4)]);
      setTradingPairs(pairs);
    };

    simulateLiveData();
    const interval = setInterval(simulateLiveData, 5000);

    return () => clearInterval(interval);
  }, []);

  const generateChartData = () => {
    return Array.from({ length: 20 }, (_, i) => ({
      x: i,
      y: Math.sin(i * 0.5) * 50 + 50 + Math.random() * 20
    }));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '🔔';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'success': return 'alert-success';
      case 'info': return 'alert-info';
      case 'warning': return 'alert-warning';
      case 'error': return 'alert-error';
      default: return 'alert-default';
    }
  };

  return (
    <section 
      id="performance" 
      ref={sectionRef}
      className="performance-section"
    >
      {/* خلفية متحركة */}
      <div className="performance-background">
        <div className="quantum-particles-performance"></div>
        <div className="neon-grid-performance"></div>
        <div className="performance-glow"></div>
      </div>

      <div className="performance-container">
        {/* العنوان الرئيسي */}
        <div className="performance-header">
          <div className="header-badge">
            <span className="badge-icon">📊</span>
            أداء حي مباشر
          </div>
          <h2 className="performance-title">
            أداء <span className="title-highlight">QUANTUM AI TRADING PLATFORM</span> في الوقت الحقيقي
          </h2>
          <p className="performance-subtitle">
            تتبع أداء نظام التداول الآلي مع تحديثات فورية وإحصائيات حية مباشرة من الأسواق العالمية
          </p>
        </div>

        {/* عناصر التحكم بالوقت */}
        <div className="timeframe-controls">
          <div className="controls-header">
            <h3 className="controls-title">⏰ الفترة الزمنية</h3>
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span>مباشر</span>
            </div>
          </div>
          <div className="timeframe-buttons">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.value}
                onClick={() => setActiveTimeframe(timeframe.value)}
                className={`timeframe-btn ${activeTimeframe === timeframe.value ? 'timeframe-active' : ''}`}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </div>

        {/* الشبكة الرئيسية */}
        <div className="performance-grid">
          {/* مخطط الأداء الرئيسي */}
          <div className="performance-card chart-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">📈</span>
                مخطط الأداء المباشر
              </h3>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color profit-color"></div>
                  <span>الأرباح</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color volume-color"></div>
                  <span>الحجم</span>
                </div>
              </div>
            </div>
            
            <div className="chart-container">
              {isChartVisible && (
                <div className="live-chart">
                  <div className="chart-area">
                    {generateChartData().map((point, index) => (
                      <div
                        key={index}
                        className="chart-point"
                        style={{
                          left: `${(index / 19) * 100}%`,
                          bottom: `${point.y}%`
                        }}
                      >
                        <div className="point-tooltip">
                          +{point.y.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                    <div className="chart-line"></div>
                  </div>
                  
                  <div className="chart-labels">
                    <span>بداية</span>
                    <span>نهاية</span>
                  </div>
                  
                  <div className="chart-stats">
                    <div className="chart-stat">
                      <span className="stat-label">أعلى ربح</span>
                      <span className="stat-value">+{(Math.random() * 8).toFixed(2)}%</span>
                    </div>
                    <div className="chart-stat">
                      <span className="stat-label">متوسط الربح</span>
                      <span className="stat-value">+{(Math.random() * 4).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* الإحصائيات الفورية */}
          <div className="performance-card stats-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">⚡</span>
                إحصائيات فورية
              </h3>
              <div className="stats-update">
                <span className="update-time">آخر تحديث: الآن</span>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item primary">
                <div className="stat-icon">💹</div>
                <div className="stat-content">
                  <div className="stat-value">{performanceData.dailyProfit || '+0.00%'}</div>
                  <div className="stat-label">ربح اليوم</div>
                </div>
                <div className="stat-trend positive">↑</div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">{performanceData.successRate || '0%'}</div>
                  <div className="stat-label">معدل النجاح</div>
                </div>
                <div className="stat-badge excellent">ممتاز</div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <div className="stat-value">{performanceData.activeTrades || '0'}</div>
                  <div className="stat-label">صفقات نشطة</div>
                </div>
                <div className="stat-trend stable">→</div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-value">{performanceData.volume || '$0M'}</div>
                  <div className="stat-label">حجم التداول</div>
                </div>
                <div className="stat-trend positive">↑</div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">{performanceData.winRate || '0%'}</div>
                  <div className="stat-label">معدل الربحية</div>
                </div>
                <div className="stat-badge good">جيد</div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">⚖️</div>
                <div className="stat-content">
                  <div className="stat-value">{performanceData.sharpeRatio || '0.00'}</div>
                  <div className="stat-label">نسبة شارب</div>
                </div>
                <div className="stat-trend positive">↑</div>
              </div>
            </div>
          </div>

          {/* أزواج التداول النشطة */}
          <div className="performance-card pairs-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">🎪</span>
                أزواج التداول النشطة
              </h3>
              <div className="pairs-count">
                <span className="count-badge">{tradingPairs.length}</span>
              </div>
            </div>

            <div className="pairs-list">
              {tradingPairs.map((pair, index) => (
                <div key={index} className="pair-item">
                  <div className="pair-symbol">{pair.symbol}</div>
                  <div className="pair-price">{pair.price}</div>
                  <div className={`pair-change ${pair.change.includes('+') ? 'positive' : 'negative'}`}>
                    {pair.change}
                  </div>
                  <div className="pair-volume">{pair.volume}</div>
                </div>
              ))}
            </div>
          </div>

          {/* الإشعارات الحية */}
          <div className="performance-card alerts-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon"></span>
                الإشعارات الحية
                <span className="alerts-badge">{liveAlerts.length}</span>
              </h3>
              <button className="alerts-clear">
                مسح الكل
              </button>
            </div>

            <div className="alerts-container">
              {liveAlerts.length > 0 ? (
                liveAlerts.map((alert) => (
                  <div key={alert.id} className={`alert-item ${getAlertColor(alert.type)}`}>
                    <div className="alert-icon">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="alert-content">
                      <div className="alert-message">{alert.message}</div>
                      <div className="alert-details">
                        <span className="alert-pair">{alert.pair}</span>
                        <span className="alert-profit">{alert.profit}</span>
                        <span className="alert-time">{alert.time}</span>
                      </div>
                    </div>
                    <div className="alert-actions">
                      <button className="action-btn">👁️</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-alerts">
                  <div className="no-alerts-icon">📊</div>
                  <p>لا توجد إشعارات حالياً</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* التحليلات المتقدمة */}
        <div className="advanced-analytics">
          <div className="analytics-header">
            <h3 className="analytics-title">📈 تحليلات أداء متقدمة</h3>
            <p className="analytics-subtitle">
              تحليلات شاملة لأداء نظام QUANTUM AI TRADING PLATFORM عبر مختلف المؤشرات
            </p>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-icon">🎯</div>
              <div className="analytics-content">
                <h4>دقة التنبؤ</h4>
                <div className="analytics-value">94.7%</div>
                <div className="analytics-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '94.7%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon">⚡</div>
              <div className="analytics-content">
                <h4>سرعة التنفيذ</h4>
                <div className="analytics-value">0.002s</div>
                <div className="analytics-trend positive">+15% عن الشهر الماضي</div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon">🛡️</div>
              <div className="analytics-content">
                <h4>كفاءة المخاطرة</h4>
                <div className="analytics-value">1:3.2</div>
                <div className="analytics-description">نسبة المخاطرة إلى العائد</div>
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-icon">📅</div>
              <div className="analytics-content">
                <h4>استقرار النظام</h4>
                <div className="analytics-value">99.9%</div>
                <div className="analytics-uptime">وقت تشغيل بدون انقطاع</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LivePerformance;