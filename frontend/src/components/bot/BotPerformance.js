// frontend/src/components/bot/BotPerformance.js

import React, { useState, useEffect, useMemo } from 'react';
import { getPerformanceMetrics, getTradingAnalytics } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import './BotPerformance.css';

const BotPerformance = () => {
  const [performanceData, setPerformanceData] = useState({
    totalProfit: 0,
    dailyProfit: 0,
    weeklyProfit: 0,
    monthlyProfit: 0,
    winRate: 0,
    totalTrades: 0,
    successfulTrades: 0,
    failedTrades: 0,
    avgTradeDuration: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    volatility: 0
  });
  
  const [analyticsData, setAnalyticsData] = useState({
    hourlyPerformance: [],
    dailyPerformance: [],
    tradeDistribution: [],
    riskMetrics: {}
  });
  
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('profit');

  const { lastMessage } = useWebSocket('performance-updates');

  // تحديث البيانات من WebSocket
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'performance_update') {
        setPerformanceData(prev => ({
          ...prev,
          ...data.metrics
        }));
      }
    }
  }, [lastMessage]);

  // جلب البيانات الأولية
  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 60000); // تحديث كل دقيقة
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true);
      const [performanceResponse, analyticsResponse] = await Promise.all([
        getPerformanceMetrics(timeRange),
        getTradingAnalytics(timeRange)
      ]);

      if (performanceResponse.success) {
        setPerformanceData(prev => ({
          ...prev,
          ...performanceResponse.data
        }));
      }

      if (analyticsResponse.success) {
        setAnalyticsData(analyticsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // حساب الإحصائيات المشتقة
  const derivedStats = useMemo(() => {
    const netProfit = performanceData.totalProfit;
    const successRate = performanceData.winRate * 100;
    const avgProfitPerTrade = performanceData.totalTrades > 0 
      ? netProfit / performanceData.totalTrades 
      : 0;
    
    return {
      netProfit,
      successRate,
      avgProfitPerTrade,
      profitFactor: performanceData.successfulTrades > 0 
        ? (performanceData.successfulTrades * avgProfitPerTrade) / 
          (performanceData.failedTrades * Math.abs(avgProfitPerTrade) || 1)
        : 0,
      efficiencyScore: Math.min(
        100, 
        (successRate + (netProfit > 0 ? 20 : 0)) - performanceData.maxDrawdown
      )
    };
  }, [performanceData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (value) => {
    return value >= 0 ? 'success' : 'danger';
  };

  const getEfficiencyLevel = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  };

  return (
    <div className="bot-performance-container">
      <div className="performance-header">
        <h2>📈 أداء البوت المتقدم</h2>
        <div className="header-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="1h">آخر ساعة</option>
            <option value="24h">آخر 24 ساعة</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 90 يوم</option>
          </select>
          <button 
            onClick={fetchPerformanceData}
            className="refresh-btn"
            disabled={isLoading}
          >
            {isLoading ? '🔄 جاري التحديث...' : '🔄 تحديث'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>جاري تحميل بيانات الأداء...</p>
        </div>
      ) : (
        <>
          {/* بطاقات المقاييس الرئيسية */}
          <div className="metrics-overview">
            <div className="metric-card primary">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <h3>صافي الربح</h3>
                <div className={`metric-value ${getPerformanceColor(derivedStats.netProfit)}`}>
                  {formatCurrency(derivedStats.netProfit)}
                </div>
                <div className="metric-trend">
                  <span className="trend-indicator">
                    {derivedStats.netProfit >= 0 ? '📈' : '📉'}
                  </span>
                  <span>إجمالي الأرباح</span>
                </div>
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-icon">🎯</div>
              <div className="metric-content">
                <h3>معدل النجاح</h3>
                <div className="metric-value">
                  {derivedStats.successRate.toFixed(1)}%
                </div>
                <div className="metric-trend">
                  <span className="trend-indicator">✅</span>
                  <span>{performanceData.successfulTrades} صفقة ناجحة</span>
                </div>
              </div>
            </div>

            <div className="metric-card info">
              <div className="metric-icon">📊</div>
              <div className="metric-content">
                <h3>إجمالي الصفقات</h3>
                <div className="metric-value">
                  {performanceData.totalTrades}
                </div>
                <div className="metric-trend">
                  <span className="trend-indicator">🔄</span>
                  <span>{performanceData.avgTradeDuration} دقيقة/صفقة</span>
                </div>
              </div>
            </div>

            <div className="metric-card warning">
              <div className="metric-icon">⚡</div>
              <div className="metric-content">
                <h3>كفاءة البوت</h3>
                <div className={`metric-value efficiency-${getEfficiencyLevel(derivedStats.efficiencyScore)}`}>
                  {derivedStats.efficiencyScore.toFixed(1)}%
                </div>
                <div className="metric-trend">
                  <span className="trend-indicator">
                    {getEfficiencyLevel(derivedStats.efficiencyScore) === 'excellent' ? '🚀' : 
                     getEfficiencyLevel(derivedStats.efficiencyScore) === 'good' ? '✅' : 
                     getEfficiencyLevel(derivedStats.efficiencyScore) === 'average' ? '⚠️' : '🔴'}
                  </span>
                  <span>مستوى {getEfficiencyLevel(derivedStats.efficiencyScore)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* التحليلات المتقدمة */}
          <div className="advanced-analytics">
            <div className="analytics-tabs">
              <button 
                className={`tab-btn ${activeChart === 'profit' ? 'active' : ''}`}
                onClick={() => setActiveChart('profit')}
              >
                📈 أداء الربحية
              </button>
              <button 
                className={`tab-btn ${activeChart === 'risk' ? 'active' : ''}`}
                onClick={() => setActiveChart('risk')}
              >
                🛡️ مقاييس المخاطر
              </button>
              <button 
                className={`tab-btn ${activeChart === 'trades' ? 'active' : ''}`}
                onClick={() => setActiveChart('trades')}
              >
                📊 تحليل الصفقات
              </button>
            </div>

            <div className="analytics-content">
              {activeChart === 'profit' && (
                <div className="profit-analysis">
                  <h4>تحليل الربحية</h4>
                  <div className="profit-stats">
                    <div className="profit-stat">
                      <span className="label">ربحية اليوم:</span>
                      <span className={`value ${getPerformanceColor(performanceData.dailyProfit)}`}>
                        {formatCurrency(performanceData.dailyProfit)}
                      </span>
                    </div>
                    <div className="profit-stat">
                      <span className="label">ربحية الأسبوع:</span>
                      <span className={`value ${getPerformanceColor(performanceData.weeklyProfit)}`}>
                        {formatCurrency(performanceData.weeklyProfit)}
                      </span>
                    </div>
                    <div className="profit-stat">
                      <span className="label">ربحية الشهر:</span>
                      <span className={`value ${getPerformanceColor(performanceData.monthlyProfit)}`}>
                        {formatCurrency(performanceData.monthlyProfit)}
                      </span>
                    </div>
                    <div className="profit-stat">
                      <span className="label">عامل الربحية:</span>
                      <span className="value">
                        {derivedStats.profitFactor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* رسم بياني مبسط للربحية */}
                  <div className="chart-placeholder">
                    <div className="chart-header">
                      <h5>اتجاه الربحية ({timeRange})</h5>
                    </div>
                    <div className="chart-content">
                      <p>📊 الرسم البياني سيعرض هنا بيانات الربحية التاريخية</p>
                      <div className="chart-bars">
                        {[65, 80, 45, 90, 75, 85, 95].map((height, index) => (
                          <div 
                            key={index} 
                            className="chart-bar"
                            style={{ height: `${height}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeChart === 'risk' && (
                <div className="risk-analysis">
                  <h4>تحليل المخاطر</h4>
                  <div className="risk-metrics">
                    <div className="risk-metric">
                      <span className="label">أقصى خسارة:</span>
                      <span className="value danger">
                        {formatPercentage(performanceData.maxDrawdown)}
                      </span>
                    </div>
                    <div className="risk-metric">
                      <span className="label">معدل شارب:</span>
                      <span className="value">
                        {performanceData.sharpeRatio.toFixed(2)}
                      </span>
                    </div>
                    <div className="risk-metric">
                      <span className="label">التقلب:</span>
                      <span className="value">
                        {formatPercentage(performanceData.volatility)}
                      </span>
                    </div>
                    <div className="risk-metric">
                      <span className="label">نسبة المخاطرة/العائد:</span>
                      <span className="value">
                        1:{((1 / performanceData.maxDrawdown) * 100).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="risk-assessment">
                    <h5>تقييم مستوى المخاطرة</h5>
                    <div className="risk-level">
                      <div className="risk-bar">
                        <div 
                          className="risk-fill"
                          style={{ width: `${Math.min(100, performanceData.maxDrawdown * 10)}%` }}
                        ></div>
                      </div>
                      <div className="risk-labels">
                        <span>منخفض</span>
                        <span>متوسط</span>
                        <span>مرتفع</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeChart === 'trades' && (
                <div className="trades-analysis">
                  <h4>تحليل الصفقات</h4>
                  <div className="trades-stats">
                    <div className="trades-metric">
                      <span className="label">الصفقات الناجحة:</span>
                      <span className="value success">
                        {performanceData.successfulTrades}
                      </span>
                    </div>
                    <div className="trades-metric">
                      <span className="label">الصفقات الفاشلة:</span>
                      <span className="value danger">
                        {performanceData.failedTrades}
                      </span>
                    </div>
                    <div className="trades-metric">
                      <span className="label">متوسط مدة الصفقة:</span>
                      <span className="value">
                        {performanceData.avgTradeDuration} دقيقة
                      </span>
                    </div>
                    <div className="trades-metric">
                      <span className="label">متوسط الربح/صفقة:</span>
                      <span className="value">
                        {formatCurrency(derivedStats.avgProfitPerTrade)}
                      </span>
                    </div>
                  </div>

                  <div className="distribution-chart">
                    <h5>توزيع الصفقات</h5>
                    <div className="distribution-bars">
                      <div className="dist-bar success" style={{ width: '70%' }}>
                        <span>ناجحة: 70%</span>
                      </div>
                      <div className="dist-bar danger" style={{ width: '30%' }}>
                        <span>فاشلة: 30%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* توصيات الأداء */}
          <div className="performance-recommendations">
            <h4>💡 توصيات تحسين الأداء</h4>
            <div className="recommendations-list">
              {derivedStats.efficiencyScore < 60 && (
                <div className="recommendation warning">
                  <strong>تحسين معدل النجاح:</strong> حاول تعديل استراتيجية التداول لتحسين نسبة الصفقات الناجحة
                </div>
              )}
              {performanceData.maxDrawdown > 5 && (
                <div className="recommendation danger">
                  <strong>إدارة المخاطرة:</strong> ارتفاع نسبة الخسارة القصوى، فكر في تقليل حجم الصفقات
                </div>
              )}
              {derivedStats.avgProfitPerTrade < 0.5 && (
                <div className="recommendation info">
                  <strong>تحسين الربحية:</strong> متوسط الربح منخفض، قد تحتاج لتعديل أهداف الربح
                </div>
              )}
              {derivedStats.efficiencyScore >= 80 && (
                <div className="recommendation success">
                  <strong>أداء ممتاز:</strong> البوت يعمل بشكل مثالي، حافظ على الإعدادات الحالية
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BotPerformance;
