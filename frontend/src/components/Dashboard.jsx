import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const { t } = useTranslation();
  const [botStatus, setBotStatus] = useState('inactive');
  const [performance, setPerformance] = useState({});
  const [liveSignals, setLiveSignals] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTabs, setActiveTabs] = useState({
    signals: true,
    performance: true,
    analytics: false
  });

  // محاكاة بيانات أداء حية
  const simulateLiveData = useCallback(() => {
    const performanceData = {
      profit: `+${(Math.random() * 5).toFixed(2)}%`,
      activeTrades: Math.floor(Math.random() * 20) + 5,
      successRate: `${(95 + Math.random() * 4).toFixed(1)}%`,
      dailyGain: `+$${(Math.random() * 2000 + 500).toLocaleString()}`,
      totalBalance: `$${(Math.random() * 50000 + 20000).toLocaleString()}`,
      monthlyReturn: `+${(Math.random() * 15 + 5).toFixed(1)}%`,
      riskScore: Math.floor(Math.random() * 30 + 70),
      winRate: `${(85 + Math.random() * 12).toFixed(1)}%`,
      sharpeRatio: (Math.random() * 3 + 1.5).toFixed(2),
      maxDrawdown: `-${(Math.random() * 2).toFixed(1)}%`
    };

    const signals = [
      { 
        id: 1, 
        symbol: 'BTC/USDT', 
        action: 'buy', 
        confidence: '92%', 
        time: new Date().toLocaleTimeString(),
        price: '$45,230',
        change: '+2.4%',
        exchange: 'Binance'
      },
      { 
        id: 2, 
        symbol: 'ETH/USDT', 
        action: 'sell', 
        confidence: '87%', 
        time: new Date().toLocaleTimeString(),
        price: '$2,450',
        change: '-1.2%',
        exchange: 'MEXC'
      },
      { 
        id: 3, 
        symbol: 'XRP/USDT', 
        action: 'buy', 
        confidence: '95%', 
        time: new Date().toLocaleTimeString(),
        price: '$0.75',
        change: '+5.7%',
        exchange: 'Both'
      },
      { 
        id: 4, 
        symbol: 'ADA/USDT', 
        action: 'buy', 
        confidence: '88%', 
        time: new Date().toLocaleTimeString(),
        price: '$0.52',
        change: '+3.1%',
        exchange: 'Binance'
      }
    ];

    setPerformance(performanceData);
    setLiveSignals(prev => {
      const newSignals = signals.slice(0, Math.floor(Math.random() * 2) + 2);
      return [...newSignals, ...prev.slice(0, 3)];
    });
  }, []);

  useEffect(() => {
    simulateLiveData();
    const interval = setInterval(simulateLiveData, 8000);
    return () => clearInterval(interval);
  }, [simulateLiveData]);

  const startBot = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setBotStatus('active');
    } catch (error) {
      console.error('Failed to start bot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopBot = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setBotStatus('inactive');
    } catch (error) {
      console.error('Failed to stop bot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTab = (tab) => {
    setActiveTabs(prev => ({
      ...prev,
      [tab]: !prev[tab]
    }));
  };

  const getStatusColor = () => {
    return botStatus === 'active' ? '#00ff88' : '#ff3b5c';
  };

  const getStatusGlow = () => {
    return botStatus === 'active' ? '0 0 20px rgba(0, 255, 136, 0.5)' : '0 0 20px rgba(255, 59, 92, 0.3)';
  };

  return (
    <section id="dashboard" className="dashboard-section">
      <div className="dashboard-background">
        <div className="quantum-particles"></div>
        <div className="neon-grid-dashboard"></div>
      </div>

      <div className="dashboard-container">
        {/* رأس اللوحة */}
        <div className="dashboard-header">
          <div className="dashboard-title-section">
            <h1 className="dashboard-title">
              📊 {t('dashboard.title')}
            </h1>
            <p className="dashboard-subtitle">
              {t('dashboard.subtitle')} - <strong>QUANTUM AI TRADER</strong>
            </p>
          </div>
          <div className="dashboard-actions">
            <div className="user-welcome">
              <span className="welcome-text">مرحباً، {user?.email || 'المتداول'}! 👋</span>
              <div className="plan-badge">
                {user?.plan === 'pro' ? '⚡ Pro' : '🔰 Basic'}
              </div>
            </div>
          </div>
        </div>

        {/* شبكة لوحة التحكم الرئيسية */}
        <div className="dashboard-grid">
          {/* بطاقة حالة البوت */}
          <div className="dashboard-card bot-status-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">🤖</span>
                {t('dashboard.botStatus')}
              </h3>
              <div className="status-indicators">
                <div 
                  className="status-dot"
                  style={{
                    backgroundColor: getStatusColor(),
                    boxShadow: getStatusGlow()
                  }}
                ></div>
                <span className="status-text">
                  {botStatus === 'active' ? t('dashboard.statusActive') : t('dashboard.statusInactive')}
                </span>
              </div>
            </div>

            <div className="card-content">
              <div className="bot-controls">
                <button 
                  onClick={startBot}
                  disabled={botStatus === 'active' || isLoading}
                  className={`control-btn start-btn ${isLoading ? 'loading' : ''}`}
                >
                  {isLoading ? (
                    <div className="btn-loading-spinner"></div>
                  ) : (
                    ' ابدأ التداول الآلي'
                  )}
                </button>
                <button 
                  onClick={stopBot}
                  disabled={botStatus === 'inactive' || isLoading}
                  className="control-btn stop-btn"
                >
                   إيقاف البوت
                </button>
              </div>

              <div className="bot-stats">
                <div className="bot-stat">
                  <span className="stat-label">وقت التشغيل</span>
                  <span className="stat-value">24/7</span>
                </div>
                <div className="bot-stat">
                  <span className="stat-label">السيرفر</span>
                  <span className="stat-value online">🟢 نشط</span>
                </div>
                <div className="bot-stat">
                  <span className="stat-label">الإصدار</span>
                  <span className="stat-value">v2.4.1</span>
                </div>
              </div>
            </div>
          </div>

          {/* بطاقة الأداء الرئيسية */}
          <div className="dashboard-card performance-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">📈</span>
                أداء التداول
              </h3>
              <div className="timeframe-selector">
                {['1h', '24h', '7d', '30d'].map(timeframe => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`timeframe-btn ${selectedTimeframe === timeframe ? 'active' : ''}`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
            </div>

            <div className="performance-grid">
              <div className="performance-metric main-metric">
                <div className="metric-icon">💰</div>
                <div className="metric-content">
                  <div className="metric-label">إجمالي الأرباح</div>
                  <div className="metric-value profit">{performance.dailyGain || '+$0'}</div>
                  <div className="metric-change positive">{performance.profit || '+0.0%'}</div>
                </div>
              </div>

              <div className="performance-metric">
                <div className="metric-icon">🎯</div>
                <div className="metric-content">
                  <div className="metric-label">معدل النجاح</div>
                  <div className="metric-value">{performance.successRate || '0%'}</div>
                  <div className="metric-subtext">دقة عالية</div>
                </div>
              </div>

              <div className="performance-metric">
                <div className="metric-icon">⚡</div>
                <div className="metric-content">
                  <div className="metric-label">الصفقات النشطة</div>
                  <div className="metric-value">{performance.activeTrades || '0'}</div>
                  <div className="metric-subtext">في الوقت الحقيقي</div>
                </div>
              </div>

              <div className="performance-metric">
                <div className="metric-icon">🏦</div>
                <div className="metric-content">
                  <div className="metric-label">رصيد المحفظة</div>
                  <div className="metric-value">{performance.totalBalance || '$0'}</div>
                  <div className="metric-subtext">إجمالي الأصول</div>
                </div>
              </div>
            </div>
          </div>

          {/* بطاقة الإشعارات الحية */}
          <div className="dashboard-card alerts-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon"></span>
                الإشعارات الحية
                <span className="alerts-badge">{liveSignals.length}</span>
              </h3>
              <button 
                className="tab-toggle"
                onClick={() => toggleTab('signals')}
              >
                {activeTabs.signals ? '−' : '+'}
              </button>
            </div>

            {activeTabs.signals && (
              <div className="alerts-container">
                {liveSignals.length > 0 ? (
                  liveSignals.map((signal) => (
                    <div key={signal.id} className="alert-item">
                      <div className="alert-main">
                        <div className="alert-symbol">{signal.symbol}</div>
                        <div className={`alert-action ${signal.action}`}>
                          {signal.action === 'buy' ? '🟢 شراء' : '🔴 بيع'}
                        </div>
                        <div className="alert-confidence">{signal.confidence}</div>
                      </div>
                      <div className="alert-details">
                        <span className="alert-price">{signal.price}</span>
                        <span className={`alert-change ${signal.change.includes('+') ? 'positive' : 'negative'}`}>
                          {signal.change}
                        </span>
                        <span className="alert-exchange">{signal.exchange}</span>
                        <span className="alert-time">{signal.time}</span>
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
            )}
          </div>

          {/* بطاقة التحليلات المتقدمة */}
          <div className="dashboard-card analytics-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">📊</span>
                التحليلات المتقدمة
              </h3>
              <button 
                className="tab-toggle"
                onClick={() => toggleTab('analytics')}
              >
                {activeTabs.analytics ? '−' : '+'}
              </button>
            </div>

            {activeTabs.analytics && (
              <div className="analytics-grid">
                <div className="analytics-metric">
                  <div className="analytics-label">معدل الربحية</div>
                  <div className="analytics-value">{performance.winRate || '0%'}</div>
                  <div className="analytics-progress">
                    <div 
                      className="progress-fill" 
                      style={{ width: performance.winRate || '0%' }}
                    ></div>
                  </div>
                </div>

                <div className="analytics-metric">
                  <div className="analytics-label">نسبة شارب</div>
                  <div className="analytics-value">{performance.sharpeRatio || '0.00'}</div>
                  <div className="analytics-trend positive">↑ ممتاز</div>
                </div>

                <div className="analytics-metric">
                  <div className="analytics-label">أقصى انخفاض</div>
                  <div className="analytics-value negative">{performance.maxDrawdown || '0%'}</div>
                  <div className="analytics-trend">منخفض</div>
                </div>

                <div className="analytics-metric">
                  <div className="analytics-label">مستوى المخاطرة</div>
                  <div className="analytics-value">{performance.riskScore || '0'}/100</div>
                  <div className="analytics-progress risk">
                    <div 
                      className="progress-fill risk-fill" 
                      style={{ width: `${performance.riskScore || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* بطاقة الأخبار السريعة */}
          <div className="dashboard-card news-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">📰</span>
                أخبار السوق
              </h3>
            </div>
            <div className="news-container">
              <div className="news-item">
                <div className="news-badge bitcoin">BTC</div>
                <div className="news-content">
                  <strong>Bitcoin</strong> يتخطى مستوى المقاومة عند $45,000
                </div>
                <div className="news-time">منذ 2 دقيقة</div>
              </div>
              <div className="news-item">
                <div className="news-badge ethereum">ETH</div>
                <div className="news-content">
                  <strong>Ethereum</strong> ترقية الشبكة المقررة الأسبوع القادم
                </div>
                <div className="news-time">منذ 15 دقيقة</div>
              </div>
              <div className="news-item">
                <div className="news-badge update">NEW</div>
                <div className="news-content">
                  أزواج تداول جديدة مضافة إلى المنصة
                </div>
                <div className="news-time">منذ ساعة</div>
              </div>
            </div>
          </div>

          {/* بطاقة الأداء الشهري */}
          <div className="dashboard-card monthly-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">📅</span>
                الأداء الشهري
              </h3>
            </div>
            <div className="monthly-performance">
              <div className="monthly-stats">
                <div className="monthly-stat">
                  <div className="monthly-value positive">+24.7%</div>
                  <div className="monthly-label">هذا الشهر</div>
                </div>
                <div className="monthly-stat">
                  <div className="monthly-value positive">+156.3%</div>
                  <div className="monthly-label">هذه السنة</div>
                </div>
              </div>
              <div className="performance-chart-placeholder">
                <div className="chart-bars">
                  {[65, 80, 45, 90, 75, 85, 70].map((height, index) => (
                    <div 
                      key={index}
                      className="chart-bar"
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
                <div className="chart-labels">
                  {['أ', 'ب', 'ج', 'د', 'ه', 'و', 'ي'].map((label, index) => (
                    <span key={index} className="chart-label">{label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* قسم الإجراءات السريعة */}
        <div className="quick-actions">
          <button className="quick-action-btn">
            <span className="action-icon">⏱️</span>
            التداول الآلي
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">📋</span>
            تقرير الأداء
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">⚙️</span>
            الإعدادات
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">🆘</span>
            الدعم الفني
          </button>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;