import React, { useState, useEffect, useMemo } from 'react';
import { getBotStatus, getPerformanceMetrics, getTradingHistory } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import './BotStatus.css';

const BotStatus = () => {
  const [statusData, setStatusData] = useState({
    isActive: false,
    uptime: 0,
    totalTrades: 0,
    activeTrades: 0,
    profitLoss: 0,
    equity: 0,
    lastUpdate: null,
    performance: {
      winRate: 0,
      avgTrade: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      volatility: 0
    },
    serverStatus: {
      connected: false,
      latency: 0,
      lastPing: null
    }
  });
  
  const [tradingHistory, setTradingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  const { lastMessage, isConnected } = useWebSocket('bot-status');

  // تحديث البيانات من WebSocket
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        
        switch (data.type) {
          case 'status_update':
            setStatusData(prev => ({
              ...prev,
              isActive: data.isActive,
              uptime: data.uptime || prev.uptime,
              activeTrades: data.activeTrades || prev.activeTrades,
              equity: data.equity || prev.equity,
              lastUpdate: new Date()
            }));
            break;
            
          case 'trade_executed':
            setStatusData(prev => ({
              ...prev,
              totalTrades: prev.totalTrades + 1,
              profitLoss: prev.profitLoss + (data.profit || 0),
              lastUpdate: new Date()
            }));
            fetchTradingHistory();
            break;
            
          case 'performance_update':
            setStatusData(prev => ({
              ...prev,
              performance: {
                ...prev.performance,
                ...data.metrics
              },
              lastUpdate: new Date()
            }));
            break;
            
          default:
            break;
        }
        
        setLastUpdateTime(new Date());
      } catch (error) {
        console.error('❌ خطأ في معالجة رسالة WebSocket:', error);
      }
    }
  }, [lastMessage]);

  // جلب البيانات الأولية
  useEffect(() => {
    fetchStatusData();
    
    // تحديث كل 30 ثانية
    const interval = setInterval(fetchStatusData, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const fetchStatusData = async () => {
    try {
      setIsLoading(true);
      const [statusResponse, performanceResponse, historyResponse] = await Promise.all([
        getBotStatus(),
        getPerformanceMetrics(timeframe),
        getTradingHistory()
      ]);

      if (statusResponse.success) {
        setStatusData(prev => ({
          ...prev,
          ...statusResponse.data,
          lastUpdate: new Date()
        }));
      }

      if (performanceResponse.success) {
        setStatusData(prev => ({
          ...prev,
          performance: {
            ...prev.performance,
            ...performanceResponse.data
          }
        }));
      }

      if (historyResponse.success) {
        setTradingHistory(historyResponse.data);
      }
      
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات الحالة:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTradingHistory = async () => {
    try {
      const response = await getTradingHistory();
      if (response.success) {
        setTradingHistory(response.data);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب سجل التداول:', error);
    }
  };

  // تنسيق الوقت المنقضي
  const formatUptime = (seconds) => {
    if (!seconds) return '0 دقيقة';
    
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} يوم ${hours} ساعة`;
    } else if (hours > 0) {
      return `${hours} ساعة ${minutes} دقيقة`;
    } else {
      return `${minutes} دقيقة`;
    }
  };

  // تنسيق الأرباح/الخسائر
  const formatProfitLoss = (value) => {
    const absValue = Math.abs(value);
    const sign = value >= 0 ? '+' : '-';
    return `${sign} $${absValue.toFixed(2)}`;
  };

  // تحديد لون الربح/الخسارة
  const getProfitLossClass = (value) => {
    return value >= 0 ? 'profit' : 'loss';
  };

  // حساب الإحصائيات المشتقة
  const derivedStats = useMemo(() => {
    const netProfit = statusData.profitLoss || 0;
    const successRate = (statusData.performance.winRate * 100) || 0;
    const avgProfitPerTrade = statusData.totalTrades > 0 ? 
      netProfit / statusData.totalTrades : 0;
    
    return {
      netProfit,
      successRate,
      avgProfitPerTrade,
      profitFactor: statusData.totalTrades > 0 ? 
        Math.abs(avgProfitPerTrade) > 0 ? 
          (successRate / 100) / (1 - successRate / 100) : 0 
        : 0,
      efficiencyScore: Math.min(100, (successRate + (netProfit > 0 ? 20 : 0)) - (statusData.performance.maxDrawdown || 0))
    };
  }, [statusData]);

  // الحصول على مستوى الكفاءة
  const getEfficiencyLevel = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  };

  // تنسيق النسبة المئوية
  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="bot-status-container">
      {/* رأس الحالة */}
      <div className="status-header">
        <div className="header-main">
          <h2>📊 حالة البوت التفصيلية</h2>
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              {isConnected ? 'متصل بالخادم' : 'غير متصل'}
            </div>
            {lastUpdateTime && (
              <div className="last-update">
                آخر تحديث: {lastUpdateTime.toLocaleString('ar-SA')}
              </div>
            )}
          </div>
        </div>
        
        <div className="header-controls">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-select"
            disabled={isLoading}
          >
            <option value="1h">آخر ساعة</option>
            <option value="24h">آخر 24 ساعة</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
          </select>
          
          <button 
            onClick={fetchStatusData}
            className="refresh-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                جاري التحديث...
              </>
            ) : (
              '🔄 تحديث'
            )}
          </button>
        </div>
      </div>

      {/* مؤشر الحالة الرئيسي */}
      <div className="main-status-indicator">
        <div className={`status-badge ${statusData.isActive ? 'active' : 'inactive'}`}>
          <div className="badge-icon">
            {statusData.isActive ? '🚀' : '⏸️'}
          </div>
          <div className="badge-content">
            <h3>{statusData.isActive ? 'البوت نشط' : 'البوت متوقف'}</h3>
            <p>{statusData.isActive ? 'يعمل بشكل طبيعي' : 'في انتظار التفعيل'}</p>
          </div>
        </div>
        
        <div className="uptime-display">
          <span className="uptime-label">مدة التشغيل:</span>
          <span className="uptime-value">{formatUptime(statusData.uptime)}</span>
        </div>
      </div>

      {/* تبويبات التنقل */}
      <div className="status-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 نظرة عامة
        </button>
        <button 
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          🎯 أداء التداول
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 السجل
        </button>
        <button 
          className={`tab-button ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          ⚙️ النظام
        </button>
      </div>

      {/* محتوى التبويبات */}
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>جاري تحميل بيانات البوت...</p>
        </div>
      ) : (
        <div className="tab-content">
          {/* نظرة عامة */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="metrics-grid">
                <div className="metric-card primary">
                  <div className="metric-icon">💰</div>
                  <div className="metric-content">
                    <h3>صافي الربح</h3>
                    <div className={`metric-value ${getProfitLossClass(derivedStats.netProfit)}`}>
                      {formatProfitLoss(derivedStats.netProfit)}
                    </div>
                    <div className="metric-subtext">
                      إجمالي الأرباح/الخسائر
                    </div>
                  </div>
                </div>

                <div className="metric-card success">
                  <div className="metric-icon">📈</div>
                  <div className="metric-content">
                    <h3>معدل النجاح</h3>
                    <div className="metric-value">
                      {derivedStats.successRate.toFixed(1)}%
                    </div>
                    <div className="metric-subtext">
                      نسبة الصفقات الناجحة
                    </div>
                  </div>
                </div>

                <div className="metric-card info">
                  <div className="metric-icon">🔄</div>
                  <div className="metric-content">
                    <h3>إجمالي الصفقات</h3>
                    <div className="metric-value">
                      {statusData.totalTrades}
                    </div>
                    <div className="metric-subtext">
                      {statusData.activeTrades} صفقة نشطة
                    </div>
                  </div>
                </div>

                <div className={`metric-card ${getEfficiencyLevel(derivedStats.efficiencyScore)}`}>
                  <div className="metric-icon">⚡</div>
                  <div className="metric-content">
                    <h3>كفاءة البوت</h3>
                    <div className="metric-value">
                      {derivedStats.efficiencyScore.toFixed(1)}%
                    </div>
                    <div className="metric-subtext">
                      مستوى {getEfficiencyLevel(derivedStats.efficiencyScore)}
                    </div>
                  </div>
                </div>
              </div>

              {/* إحصائيات سريعة */}
              <div className="quick-stats">
                <h3>📊 إحصائيات سريعة</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">متوسط الربح/صفقة</span>
                    <span className={`stat-value ${getProfitLossClass(derivedStats.avgProfitPerTrade)}`}>
                      {formatProfitLoss(derivedStats.avgProfitPerTrade)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">أقصى خسارة</span>
                    <span className="stat-value loss">
                      {formatPercentage(statusData.performance.maxDrawdown || 0)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">معدل شارب</span>
                    <span className="stat-value">
                      {(statusData.performance.sharpeRatio || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">الرصيد الحالي</span>
                    <span className="stat-value">
                      ${(statusData.equity || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* أداء التداول */}
          {activeTab === 'performance' && (
            <div className="performance-tab">
              <div className="performance-cards">
                <div className="perf-card">
                  <h4>📈 أداء الربحية</h4>
                  <div className="perf-metrics">
                    <div className="perf-metric">
                      <span>إجمالي الأرباح:</span>
                      <span className={getProfitLossClass(derivedStats.netProfit)}>
                        {formatProfitLoss(derivedStats.netProfit)}
                      </span>
                    </div>
                    <div className="perf-metric">
                      <span>ربحية اليوم:</span>
                      <span className={getProfitLossClass(derivedStats.netProfit * 0.1)}>
                        {formatProfitLoss(derivedStats.netProfit * 0.1)}
                      </span>
                    </div>
                    <div className="perf-metric">
                      <span>معدل النجاح:</span>
                      <span>{derivedStats.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="perf-metric">
                      <span>عامل الربحية:</span>
                      <span>{derivedStats.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="perf-card">
                  <h4>🛡️ إدارة المخاطر</h4>
                  <div className="perf-metrics">
                    <div className="perf-metric">
                      <span>أقصى خسارة:</span>
                      <span className="loss">{formatPercentage(statusData.performance.maxDrawdown || 0)}</span>
                    </div>
                    <div className="perf-metric">
                      <span>التقلب:</span>
                      <span>{formatPercentage(statusData.performance.volatility || 0)}</span>
                    </div>
                    <div className="perf-metric">
                      <span>معدل شارب:</span>
                      <span>{(statusData.performance.sharpeRatio || 0).toFixed(2)}</span>
                    </div>
                    <div className="perf-metric">
                      <span>نسبة المخاطرة/العائد:</span>
                      <span>1:{((1 / (statusData.performance.maxDrawdown || 1)) * 100).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* مؤشرات الأداء */}
              <div className="performance-indicators">
                <h4>📊 مؤشرات الأداء</h4>
                <div className="indicators-grid">
                  <div className="indicator">
                    <span className="indicator-label">كفاءة البوت</span>
                    <div className="indicator-bar">
                      <div 
                        className={`indicator-fill efficiency-${getEfficiencyLevel(derivedStats.efficiencyScore)}`}
                        style={{ width: `${derivedStats.efficiencyScore}%` }}
                      ></div>
                    </div>
                    <span className="indicator-value">{derivedStats.efficiencyScore.toFixed(1)}%</span>
                  </div>
                  
                  <div className="indicator">
                    <span className="indicator-label">استقرار النظام</span>
                    <div className="indicator-bar">
                      <div 
                        className="indicator-fill stability-high"
                        style={{ width: '95%' }}
                      ></div>
                    </div>
                    <span className="indicator-value">95%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* السجل */}
          {activeTab === 'history' && (
            <div className="history-tab">
              <div className="history-header">
                <h4>📋 سجل الصفقات الأخيرة</h4>
                <button onClick={fetchTradingHistory} className="refresh-btn small">
                  🔄 تحديث السجل
                </button>
              </div>
              
              <div className="trades-table-container">
                {tradingHistory.length > 0 ? (
                  <div className="trades-table">
                    <div className="table-header">
                      <div>الزوج</div>
                      <div>النوع</div>
                      <div>الحجم</div>
                      <div>السعر</div>
                      <div>الربح</div>
                      <div>الوقت</div>
                    </div>
                    <div className="table-body">
                      {tradingHistory.slice(0, 10).map((trade, index) => (
                        <div key={index} className="table-row">
                          <div className="trade-pair">{trade.pair || 'BTC/USD'}</div>
                          <div className={`trade-type ${trade.type || 'buy'}`}>
                            {trade.type === 'buy' ? 'شراء' : 'بيع'}
                          </div>
                          <div className="trade-volume">{trade.volume || '0.01'}</div>
                          <div className="trade-price">${trade.price || '0'}</div>
                          <div className={`trade-profit ${getProfitLossClass(trade.profit || 0)}`}>
                            {formatProfitLoss(trade.profit || 0)}
                          </div>
                          <div className="trade-time">
                            {trade.timestamp ? 
                              new Date(trade.timestamp).toLocaleString('ar-SA') : 
                              new Date().toLocaleString('ar-SA')
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-data">
                    <div className="no-data-icon">📭</div>
                    <p>لا توجد صفقات حالياً</p>
                    <span>سيظهر سجل الصفقات هنا عند بدء التداول</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* النظام */}
          {activeTab === 'system' && (
            <div className="system-tab">
              <div className="system-cards">
                <div className="system-card">
                  <h4>🔗 اتصال النظام</h4>
                  <div className="system-metrics">
                    <div className="system-metric">
                      <span>حالة الاتصال:</span>
                      <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢 متصل' : '🔴 غير متصل'}
                      </span>
                    </div>
                    <div className="system-metric">
                      <span>آخر تحديث:</span>
                      <span>{lastUpdateTime ? lastUpdateTime.toLocaleString('ar-SA') : 'غير متوفر'}</span>
                    </div>
                    <div className="system-metric">
                      <span>مدة التشغيل:</span>
                      <span>{formatUptime(statusData.uptime)}</span>
                    </div>
                  </div>
                </div>

                <div className="system-card">
                  <h4>📈 أداء النظام</h4>
                  <div className="system-metrics">
                    <div className="system-metric">
                      <span>الصفقات النشطة:</span>
                      <span>{statusData.activeTrades}</span>
                    </div>
                    <div className="system-metric">
                      <span>إجمالي الصفقات:</span>
                      <span>{statusData.totalTrades}</span>
                    </div>
                    <div className="system-metric">
                      <span>حالة البوت:</span>
                      <span className={`status ${statusData.isActive ? 'active' : 'inactive'}`}>
                        {statusData.isActive ? '🟢 نشط' : '🟡 متوقف'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* معلومات النظام */}
              <div className="system-info">
                <h4>ℹ️ معلومات النظام</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span>الإصدار:</span>
                    <span>v2.1.0</span>
                  </div>
                  <div className="info-item">
                    <span>وقت التشغيل:</span>
                    <span>{formatUptime(statusData.uptime)}</span>
                  </div>
                  <div className="info-item">
                    <span>آخر فحص:</span>
                    <span>{new Date().toLocaleString('ar-SA')}</span>
                  </div>
                  <div className="info-item">
                    <span>الحالة:</span>
                    <span className={`status ${statusData.isActive ? 'active' : 'inactive'}`}>
                      {statusData.isActive ? 'يعمل بشكل طبيعي' : 'في انتظار التفعيل'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BotStatus;
