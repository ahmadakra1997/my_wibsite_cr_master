// frontend/src/components/bot/BotPerformance.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getPerformanceMetrics, getTradingAnalytics } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import useBotData from '../../hooks/useBotData';
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
const unwrap = (res) =>
  res && typeof res === 'object' && 'success' in res ? (res.success ? res.data : null) : res;

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const toPct = (v) => {
  const n = toNum(v);
  // لو الباكيند يرسل 0.62 أو 62، نطبّعها
  return n <= 1 ? n * 100 : n;
};

export default function BotPerformance() {
  const { metrics } = useBotData();
  const { lastMessage } = useWebSocket('performance-updates');

  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);

  const [perf, setPerf] = useState({
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

  const [analytics, setAnalytics] = useState({
    hourlyPerformance: [],
    dailyPerformance: [],
    tradeDistribution: [],
    riskMetrics: {},
  });

  // دمج PnL القادم من useBotData (بدون تغيير منطقك)
  useEffect(() => {
    const pnl = metrics?.pnl || {};
    setPerf((prev) => ({
      ...prev,
      dailyProfit: toNum(pnl.daily ?? prev.dailyProfit),
      weeklyProfit: toNum(pnl.weekly ?? prev.weeklyProfit),
      monthlyProfit: toNum(pnl.monthly ?? prev.monthlyProfit),
    }));
  }, [metrics?.pnl]);

  // WS updates (عرض فقط)
  useEffect(() => {
    if (!lastMessage) return;
    const data = safeParse(lastMessage?.data ?? lastMessage);
    if (!data) return;

    if ((data.type === 'performance_update' || data.type === 'performance') && data.metrics) {
      setPerf((prev) => ({ ...prev, ...data.metrics }));
    }
  }, [lastMessage]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const perfPromise = Promise.resolve(getPerformanceMetrics({ range: timeRange }))
        .catch(() => Promise.resolve(getPerformanceMetrics(timeRange)));

      const [perfRes, analyticsRes] = await Promise.all([
        perfPromise,
        Promise.resolve(getTradingAnalytics(timeRange)).catch(() => null),
      ]);

      const p = unwrap(perfRes);
      const a = unwrap(analyticsRes);

      if (p) setPerf((prev) => ({ ...prev, ...p }));
      if (a) setAnalytics((prev) => ({ ...prev, ...a }));
    } catch (e) {
      console.error('[BotPerformance] fetchAll error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 60000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const derived = useMemo(() => {
    const net = toNum(perf.totalProfit);
    const totalTrades = toNum(perf.totalTrades);
    const winRatePct = toPct(perf.winRate);

    const avg = totalTrades > 0 ? net / totalTrades : 0;
    const maxDD = toPct(perf.maxDrawdown);

    const efficiency = Math.min(100, Math.max(0, winRatePct + (net > 0 ? 20 : 0) - maxDD));
    const profitFactor =
      toNum(perf.failedTrades) > 0
        ? (toNum(perf.successfulTrades) + 1) / (toNum(perf.failedTrades) + 1)
        : toNum(perf.successfulTrades) > 0
          ? 3.5
          : 0;

    return { net, totalTrades, winRatePct, avg, efficiency, profitFactor, maxDD };
  }, [perf]);

  const bars = useMemo(() => {
    const arr = Array.isArray(analytics.hourlyPerformance)
      ? analytics.hourlyPerformance
      : Array.isArray(analytics.dailyPerformance)
        ? analytics.dailyPerformance
        : [];

    const values = arr
      .map((x) => toNum(x?.value ?? x?.profit ?? x))
      .filter((n) => Number.isFinite(n))
      .slice(-10);

    if (values.length) {
      const max = Math.max(...values.map((v) => Math.abs(v))) || 1;
      return values.map((v) => Math.round((Math.abs(v) / max) * 92) + 8);
    }
    return [55, 80, 40, 90, 75, 86, 60, 72, 66, 84];
  }, [analytics]);

  const formatMoney = (v) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(toNum(v)) + ' USDT';

  const tone =
    derived.efficiency >= 80 ? 'excellent' : derived.efficiency >= 60 ? 'good' : derived.efficiency >= 40 ? 'average' : 'poor';

  return (
    <section className="botPerf">
      <div className="botPerf__header">
        <div>
          <h3 className="botPerf__title">أداء البوت</h3>
          <p className="botPerf__subtitle">لوحة أداء احترافية (عرض فقط) — بدون المساس بمنطق التداول.</p>
        </div>

        <div className="botPerf__tools">
          <select className="botPerf__select" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="1h">آخر ساعة</option>
            <option value="24h">آخر 24 ساعة</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 90 يوم</option>
          </select>

          <button className="botPerf__btn" type="button" onClick={fetchAll} disabled={isLoading}>
            {isLoading ? 'جاري التحديث...' : 'تحديث'}
          </button>
        </div>
      </div>

      <div className="botPerf__cards">
        <div className="botPerf__card">
          <div className="botPerf__label">صافي الربح</div>
          <div className={`botPerf__value mono ${derived.net >= 0 ? 'profit' : 'loss'}`}>
            {derived.net >= 0 ? '▲ ' : '▼ '} {formatMoney(derived.net)}
          </div>
          <div className="botPerf__hint">{timeRange}</div>
        </div>

        <div className="botPerf__card">
          <div className="botPerf__label">معدل النجاح</div>
          <div className="botPerf__value">{derived.winRatePct.toFixed(1)}%</div>
          <div className="botPerf__hint">
            ناجحة: {toNum(perf.successfulTrades)} | فاشلة: {toNum(perf.failedTrades)}
          </div>
        </div>

        <div className="botPerf__card">
          <div className="botPerf__label">إجمالي الصفقات</div>
          <div className="botPerf__value">{toNum(perf.totalTrades)}</div>
          <div className="botPerf__hint">متوسط مدة الصفقة: {toNum(perf.avgTradeDuration)} دقيقة</div>
        </div>

        <div className={`botPerf__card tone-${tone}`}>
          <div className="botPerf__label">كفاءة البوت</div>
          <div className="botPerf__value">{derived.efficiency.toFixed(1)}%</div>
          <div className="botPerf__hint">مؤشر مركّب (نجاح + ربح - خسارة قصوى)</div>
        </div>
      </div>

      <div className="botPerf__panel">
        <div className="botPerf__panelHead">
          <h4>اتجاه الربحية</h4>
          <div className="botPerf__meta">عرض بصري مبسط</div>
        </div>

        <div className="botPerf__bars">
          {bars.map((h, idx) => (
            <div className="botPerf__bar" key={idx}>
              <div className="botPerf__barFill" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>

        <div className="botPerf__grid2">
          <div className="botPerf__mini">
            <div className="botPerf__miniLabel">ربحية اليوم</div>
            <div className={`botPerf__miniVal mono ${toNum(perf.dailyProfit) >= 0 ? 'profit' : 'loss'}`}>
              {formatMoney(perf.dailyProfit)}
            </div>
          </div>

          <div className="botPerf__mini">
            <div className="botPerf__miniLabel">ربحية الأسبوع</div>
            <div className={`botPerf__miniVal mono ${toNum(perf.weeklyProfit) >= 0 ? 'profit' : 'loss'}`}>
              {formatMoney(perf.weeklyProfit)}
            </div>
          </div>

          <div className="botPerf__mini">
            <div className="botPerf__miniLabel">ربحية الشهر</div>
            <div className={`botPerf__miniVal mono ${toNum(perf.monthlyProfit) >= 0 ? 'profit' : 'loss'}`}>
              {formatMoney(perf.monthlyProfit)}
            </div>
          </div>

          <div className="botPerf__mini">
            <div className="botPerf__miniLabel">عامل الربحية</div>
            <div className="botPerf__miniVal mono">{derived.profitFactor.toFixed(2)}</div>
          </div>
        </div>

        <div className="botPerf__risk">
          <div className="botPerf__riskRow">
            <span>أقصى خسارة (Drawdown)</span>
            <span className="mono">{derived.maxDD.toFixed(2)}%</span>
          </div>
          <div className="botPerf__riskRow">
            <span>معدل شارب</span>
            <span className="mono">{toNum(perf.sharpeRatio).toFixed(2)}</span>
          </div>
          <div className="botPerf__riskRow">
            <span>التقلب</span>
            <span className="mono">{toPct(perf.volatility).toFixed(2)}%</span>
          </div>
        </div>

        <div className="botPerf__tips">
          <h4>توصيات تحسين الأداء</h4>
          <ul>
            {derived.efficiency < 60 && <li>تحسين معدل النجاح: قلّل الأزواج أو شدّد شروط الدخول.</li>}
            {derived.maxDD > 5 && <li>إدارة المخاطرة: الخسارة القصوى مرتفعة — راجع حجم الصفقة ووقف الخسارة.</li>}
            {Math.abs(derived.avg) < 0.5 && <li>تحسين الربحية: متوسط الربح/صفقة منخفض — راجع takeProfit وفلترة الإشارات.</li>}
            {derived.efficiency >= 80 && <li>أداء ممتاز: استمر مع مراقبة دورية للـ drawdown والاتصال.</li>}
            {derived.efficiency >= 60 && derived.efficiency < 80 && <li>أداء جيد: ركّز على تخفيف التقلب ورفع نسبة الصفقات الرابحة.</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
