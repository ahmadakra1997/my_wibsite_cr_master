// frontend/src/components/bot/BotPerformance.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getPerformanceMetrics, getTradingAnalytics } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import './BotPerformance.css';

const safeParse = (x) => {
  try {
    if (!x) return null;
    if (typeof x === 'object') return x;
    return JSON.parse(x);
  } catch {
    return null;
  }
};

const unwrap = (res) => {
  if (res && typeof res === 'object' && 'success' in res) return res.success ? res.data : null;
  return res;
};

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
    volatility: 0,
  });

  const [analyticsData, setAnalyticsData] = useState({
    hourlyPerformance: [],
    dailyPerformance: [],
    tradeDistribution: [],
    riskMetrics: {},
  });

  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('profit');

  const { lastMessage } = useWebSocket('performance-updates');

  // ✅ WS Updates
  useEffect(() => {
    if (!lastMessage) return;
    const data = safeParse(lastMessage?.data ?? lastMessage);
    if (!data) return;

    if (data.type === 'performance_update' && data.metrics) {
      setPerformanceData((prev) => ({ ...prev, ...data.metrics }));
    }
  }, [lastMessage]);

  const fetchPerformanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      // يدعم الشكلين: getPerformanceMetrics("24h") أو getPerformanceMetrics({range:"24h"})
      const perfPromise = Promise.resolve(getPerformanceMetrics({ range: timeRange })).catch(() =>
        Promise.resolve(getPerformanceMetrics(timeRange)),
      );

      const [perfRes, analyticsRes] = await Promise.all([perfPromise, getTradingAnalytics(timeRange)]);

      const perf = unwrap(perfRes);
      const analytics = unwrap(analyticsRes);

      if (perf) setPerformanceData((prev) => ({ ...prev, ...perf }));
      if (analytics) setAnalyticsData((prev) => ({ ...prev, ...analytics }));
    } catch (error) {
      console.error('[BotPerformance] Error fetching performance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 60000);
    return () => clearInterval(interval);
  }, [fetchPerformanceData]);

  const derivedStats = useMemo(() => {
    const netProfit = Number(performanceData.totalProfit || 0);
    const successRate = Number(performanceData.winRate || 0) * 100;
    const totalTrades = Number(performanceData.totalTrades || 0);
    const avgProfitPerTrade = totalTrades > 0 ? netProfit / totalTrades : 0;
    const maxDD = Number(performanceData.maxDrawdown || 0);

    const profitFactor =
      performanceData.failedTrades > 0
        ? (performanceData.successfulTrades * Math.max(avgProfitPerTrade, 0.0001)) /
          (performanceData.failedTrades * Math.max(Math.abs(avgProfitPerTrade), 0.0001))
        : 0;

    const efficiencyScore = Math.min(100, Math.max(0, (successRate + (netProfit > 0 ? 20 : 0)) - maxDD));

    return { netProfit, successRate, avgProfitPerTrade, profitFactor, efficiencyScore };
  }, [performanceData]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(
      Number(value || 0),
    );

  const formatPercentage = (value) => `${Number(value || 0).toFixed(2)}%`;

  const getPerformanceColor = (value) => (Number(value) >= 0 ? 'success' : 'danger');

  const getEfficiencyLevel = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  };

  const bars = useMemo(() => {
    const arr = Array.isArray(analyticsData.hourlyPerformance) ? analyticsData.hourlyPerformance : [];
    const values = arr
      .map((x) => Number(x?.value ?? x?.profit ?? x))
      .filter((n) => Number.isFinite(n))
      .slice(-7);

    if (values.length) {
      const max = Math.max(...values.map((v) => Math.abs(v))) || 1;
      return values.map((v) => Math.round((Math.abs(v) / max) * 95) + 5);
    }
    return [65, 80, 45, 90, 75, 85, 60];
  }, [analyticsData]);

  return (
    <div className="bot-performance-container" dir="rtl">
      <div className="performance-header">
        <h2>📈 أداء البوت المتقدم</h2>

        <div className="header-controls">
          <select className="time-range-select" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="1h">آخر ساعة</option>
            <option value="24h">آخر 24 ساعة</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 90 يوم</option>
          </select>

          <button className="refresh-btn" type="button" onClick={fetchPerformanceData} disabled={isLoading}>
            {isLoading ? 'جاري التحديث...' : 'تحديث'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner-large" />
          <p>جاري تحميل بيانات الأداء...</p>
        </div>
      ) : (
        <>
          <div className="metrics-overview">
            <div className="metric-card primary">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <h3>صافي الربح</h3>
                <div className="metric-value">{formatCurrency(derivedStats.netProfit)}</div>
                <div className="metric-trend">
                  <span className="trend-indicator">{derivedStats.netProfit >= 0 ? '▲' : '▼'}</span>
                  <span>إجمالي الأرباح</span>
                </div>
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-icon">✅</div>
              <div className="metric-content">
                <h3>معدل النجاح</h3>
                <div className="metric-value">{derivedStats.successRate.toFixed(1)}%</div>
                <div className="metric-trend">
                  <span>صفقات ناجحة: {performanceData.successfulTrades}</span>
                </div>
              </div>
            </div>

            <div className="metric-card info">
              <div className="metric-icon">🔁</div>
              <div className="metric-content">
                <h3>إجمالي الصفقات</h3>
                <div className="metric-value">{performanceData.totalTrades}</div>
                <div className="metric-trend">
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
                  <span>المستوى: {getEfficiencyLevel(derivedStats.efficiencyScore)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="advanced-analytics">
            <div className="analytics-tabs">
              <button className={`tab-btn ${activeChart === 'profit' ? 'active' : ''}`} onClick={() => setActiveChart('profit')} type="button">
                أداء الربحية
              </button>
              <button className={`tab-btn ${activeChart === 'risk' ? 'active' : ''}`} onClick={() => setActiveChart('risk')} type="button">
                مقاييس المخاطر
              </button>
              <button className={`tab-btn ${activeChart === 'trades' ? 'active' : ''}`} onClick={() => setActiveChart('trades')} type="button">
                تحليل الصفقات
              </button>
            </div>

            <div className="analytics-content">
              {activeChart === 'profit' && (
                <>
                  <h4>تحليل الربحية</h4>
                  <div className="profit-stats">
                    <div className="profit-stat">
                      <span className="label">ربحية اليوم</span>
                      <span className={`value ${getPerformanceColor(performanceData.dailyProfit)}`}>
                        {formatCurrency(performanceData.dailyProfit)}
                      </span>
                    </div>
                    <div className="profit-stat">
                      <span className="label">ربحية الأسبوع</span>
                      <span className={`value ${getPerformanceColor(performanceData.weeklyProfit)}`}>
                        {formatCurrency(performanceData.weeklyProfit)}
                      </span>
                    </div>
                    <div className="profit-stat">
                      <span className="label">ربحية الشهر</span>
                      <span className={`value ${getPerformanceColor(performanceData.monthlyProfit)}`}>
                        {formatCurrency(performanceData.monthlyProfit)}
                      </span>
                    </div>
                    <div className="profit-stat">
                      <span className="label">عامل الربحية</span>
                      <span className="value">{derivedStats.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="chart-placeholder">
                    <div className="chart-header">
                      <h5>اتجاه الربحية ({timeRange})</h5>
                    </div>
                    <div className="chart-content">
                      <div className="chart-bars">
                        {bars.map((h, idx) => (
                          <div key={idx} className="chart-bar" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeChart === 'risk' && (
                <>
                  <h4>تحليل المخاطر</h4>
                  <div className="risk-metrics">
                    <div className="risk-metric">
                      <span className="label">أقصى خسارة</span>
                      <span className="value danger">{formatPercentage(performanceData.maxDrawdown)}</span>
                    </div>
                    <div className="risk-metric">
                      <span className="label">معدل شارب</span>
                      <span className="value">{Number(performanceData.sharpeRatio || 0).toFixed(2)}</span>
                    </div>
                    <div className="risk-metric">
                      <span className="label">التقلب</span>
                      <span className="value">{formatPercentage(performanceData.volatility)}</span>
                    </div>
                    <div className="risk-metric">
                      <span className="label">مخاطرة/عائد</span>
                      <span className="value">
                        {performanceData.maxDrawdown > 0 ? `1:${(100 / performanceData.maxDrawdown).toFixed(1)}` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="risk-assessment">
                    <h5>تقييم مستوى المخاطرة</h5>
                    <div className="risk-level">
                      <div className="risk-bar">
                        <div
                          className="risk-fill"
                          style={{ width: `${Math.min(100, Math.max(0, performanceData.maxDrawdown * 10))}%` }}
                        />
                      </div>
                      <div className="risk-labels">
                        <span>منخفض</span>
                        <span>متوسط</span>
                        <span>مرتفع</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeChart === 'trades' && (
                <>
                  <h4>تحليل الصفقات</h4>
                  <div className="trades-stats">
                    <div className="trades-metric">
                      <span className="label">الصفقات الناجحة</span>
                      <span className="value success">{performanceData.successfulTrades}</span>
                    </div>
                    <div className="trades-metric">
                      <span className="label">الصفقات الفاشلة</span>
                      <span className="value danger">{performanceData.failedTrades}</span>
                    </div>
                    <div className="trades-metric">
                      <span className="label">متوسط مدة الصفقة</span>
                      <span className="value">{performanceData.avgTradeDuration} دقيقة</span>
                    </div>
                    <div className="trades-metric">
                      <span className="label">متوسط الربح/صفقة</span>
                      <span className="value">{formatCurrency(derivedStats.avgProfitPerTrade)}</span>
                    </div>
                  </div>

                  <div className="distribution-chart">
                    <h5>توزيع الصفقات</h5>
                    <div className="distribution-bars">
                      <div className="dist-bar success" style={{ width: '70%' }}>
                        ناجحة 70%
                      </div>
                      <div className="dist-bar danger" style={{ width: '30%' }}>
                        فاشلة 30%
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="performance-recommendations">
            <h4>🧠 توصيات تحسين الأداء</h4>
            <div className="recommendations-list">
              {derivedStats.efficiencyScore < 60 ? (
                <div className="recommendation warning">
                  <strong>تحسين معدل النجاح</strong>
                  حاول تعديل الاستراتيجية أو تقليل الأزواج لتحسين نسبة الصفقات الناجحة.
                </div>
              ) : null}

              {Number(performanceData.maxDrawdown || 0) > 5 ? (
                <div className="recommendation danger">
                  <strong>إدارة المخاطرة</strong>
                  ارتفاع الخسارة القصوى، فكر في تقليل حجم الصفقة أو تشديد وقف الخسارة.
                </div>
              ) : null}

              {derivedStats.avgProfitPerTrade < 0.5 ? (
                <div className="recommendation info">
                  <strong>تحسين الربحية</strong>
                  متوسط الربح منخفض، قد تحتاج تعديل takeProfit أو فلترة الدخول.
                </div>
              ) : null}

              {derivedStats.efficiencyScore >= 80 ? (
                <div className="recommendation success">
                  <strong>أداء ممتاز</strong>
                  البوت يعمل بشكل قوي—حافظ على الإعدادات الحالية مع مراقبة دورية.
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BotPerformance;
