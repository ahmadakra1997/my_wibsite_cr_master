// frontend/src/components/bot/BotPerformance.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './BotPerformance.css';
import { getPerformanceMetrics, getTradingAnalytics } from '../../services/api';

const unwrap = (res) => {
  if (res && typeof res === 'object' && 'success' in res) return res.success ? res.data : null;
  return res;
};

const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toPct = (v, fallback = 0) => {
  const n = toNum(v, fallback);
  return n;
};

const formatMoney = (v) => {
  const n = toNum(v, 0);
  return `${n >= 0 ? '+' : '-'}${Math.abs(n).toFixed(2)}`;
};

function computeEfficiency({ winRatePct, net, maxDD }) {
  // مؤشر بسيط: نجاح + ربح - عقوبة drawdown
  const wr = toNum(winRatePct, 0);
  const profitScore = Math.min(Math.max(net, -50), 50) + 50; // normalize-ish
  const ddPenalty = Math.min(toNum(maxDD, 0) * 3, 30);
  const score = wr * 0.6 + (profitScore / 100) * 40 - ddPenalty;
  return Math.max(0, Math.min(100, score));
}

export default function BotPerformance() {
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [perf, setPerf] = useState({});
  const [analytics, setAnalytics] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [pRes, aRes] = await Promise.allSettled([
        getPerformanceMetrics({ range: timeRange }),
        getTradingAnalytics(timeRange),
      ]);

      const p = pRes.status === 'fulfilled' ? unwrap(pRes.value) : null;
      const a = aRes.status === 'fulfilled' ? unwrap(aRes.value) : null;

      setPerf(p || {});
      setAnalytics(a || null);
    } catch (e) {
      setError(e?.message || 'فشل تحميل أداء البوت');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    load();
  }, [load]);

  const derived = useMemo(() => {
    const total = toNum(perf?.totalProfit ?? perf?.profit ?? perf?.pnl?.total, 0);
    const losses = toNum(perf?.totalLoss ?? perf?.loss ?? perf?.pnl?.loss, 0);
    const net = toNum(perf?.netProfit ?? perf?.net ?? (total - Math.abs(losses)), total - Math.abs(losses));

    const successful = toNum(perf?.successfulTrades ?? perf?.wins ?? perf?.winTrades, 0);
    const failed = toNum(perf?.failedTrades ?? perf?.lossTrades ?? perf?.lossesCount, 0);
    const totalTrades = toNum(perf?.totalTrades ?? perf?.trades ?? (successful + failed), successful + failed);

    const winRatePct =
      totalTrades > 0 ? (successful / totalTrades) * 100 : toNum(perf?.winRatePct ?? perf?.winRate, 0);

    const maxDD = toPct(perf?.maxDrawdown ?? perf?.drawdown ?? 0, 0);
    const profitFactor =
      Math.abs(toNum(losses, 0)) > 0 ? Math.abs(toNum(total, 0)) / Math.abs(toNum(losses, 0)) : toNum(perf?.profitFactor, 0);

    const avg = totalTrades > 0 ? net / totalTrades : 0;
    const efficiency = computeEfficiency({ winRatePct, net, maxDD });

    // Bars (من analytics لو موجود، وإلا شكل مبسط)
    const series =
      analytics?.profitCurve ||
      analytics?.equityCurve ||
      analytics?.series ||
      analytics?.bars ||
      null;

    const values = Array.isArray(series)
      ? series.map((x) => toNum(x?.value ?? x?.pnl ?? x, 0))
      : [
          toNum(perf?.dailyProfit ?? perf?.pnl?.daily, 0),
          toNum(perf?.weeklyProfit ?? perf?.pnl?.weekly, 0),
          toNum(perf?.monthlyProfit ?? perf?.pnl?.monthly, 0),
        ];

    const bars = (values.length >= 10 ? values.slice(0, 10) : [...values, ...Array(10 - values.length).fill(0)]).slice(0, 10);
    const maxAbs = Math.max(1, ...bars.map((x) => Math.abs(x)));

    return {
      total,
      losses,
      net,
      successful,
      failed,
      totalTrades,
      winRatePct,
      maxDD,
      profitFactor: Number.isFinite(profitFactor) ? profitFactor : 0,
      avg,
      efficiency,
      bars,
      maxAbs,
      sharpe: toNum(perf?.sharpeRatio ?? perf?.sharpe ?? 0, 0),
      volatility: toPct(perf?.volatility ?? 0, 0),
    };
  }, [perf, analytics]);

  const tone =
    derived.efficiency >= 80 ? 'excellent' : derived.efficiency >= 60 ? 'good' : derived.efficiency >= 40 ? 'average' : 'poor';

  return (
    <div className="botPerf">
      <div className="botPerf__header">
        <div>
          <h3 className="botPerf__title">أداء البوت</h3>
          <div className="botPerf__subtitle">لوحة تحليلات احترافية (عرض فقط) — دون المساس بمنطق التداول.</div>
        </div>

        <div className="botPerf__tools">
          <select className="botPerf__select" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="1h">آخر ساعة</option>
            <option value="24h">آخر 24 ساعة</option>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 90 يوم</option>
          </select>

          <button className="botPerf__btn" onClick={load} disabled={isLoading}>
            {isLoading ? 'جاري التحديث...' : 'تحديث'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="botPerf__panel" style={{ borderColor: 'rgba(251, 113, 133, 0.55)' }}>
          <b>⚠️</b> <span style={{ marginInlineStart: 8 }}>{error}</span>
        </div>
      ) : null}

      <div className="botPerf__cards">
        <div className={`botPerf__card tone-${tone}`}>
          <div className="botPerf__label">صافي الربح</div>
          <div className={`botPerf__value mono ${derived.net >= 0 ? 'profit' : 'loss'}`}>
            {derived.net >= 0 ? '▲ ' : '▼ '} {formatMoney(derived.net)}
          </div>
          <div className="botPerf__hint">{timeRange}</div>
        </div>

        <div className="botPerf__card">
          <div className="botPerf__label">معدل النجاح</div>
          <div className="botPerf__value mono">{derived.winRatePct.toFixed(1)}%</div>
          <div className="botPerf__hint">
            ناجحة: {derived.successful} | فاشلة: {derived.failed}
          </div>
        </div>

        <div className="botPerf__card">
          <div className="botPerf__label">إجمالي الصفقات</div>
          <div className="botPerf__value mono">{derived.totalTrades}</div>
          <div className="botPerf__hint">متوسط الربح/صفقة: {derived.avg.toFixed(2)}</div>
        </div>

        <div className={`botPerf__card tone-${tone}`}>
          <div className="botPerf__label">كفاءة البوت</div>
          <div className="botPerf__value mono">{derived.efficiency.toFixed(1)}%</div>
          <div className="botPerf__hint">مؤشر مركّب (نجاح + ربح - خسارة قصوى)</div>
        </div>
      </div>

      <div className="botPerf__panel">
        <div className="botPerf__panelHead">
          <h4>اتجاه الربحية</h4>
          <div className="botPerf__meta">عرض بصري مبسط</div>
        </div>

        <div className="botPerf__bars">
          {derived.bars.map((v, idx) => {
            const h = Math.max(6, Math.round((Math.abs(v) / derived.maxAbs) * 100));
            return (
              <div key={idx} className="botPerf__bar" title={String(v)}>
                <div className="botPerf__barFill" style={{ height: `${h}%` }} />
              </div>
            );
          })}
        </div>

        <div className="botPerf__grid2">
          <div className="botPerf__mini">
            <div className="botPerf__miniLabel">ربحية اليوم</div>
            <div className={`botPerf__miniVal mono ${toNum(perf?.dailyProfit ?? perf?.pnl?.daily, 0) >= 0 ? 'profit' : 'loss'}`}>
              {formatMoney(perf?.dailyProfit ?? perf?.pnl?.daily)}
            </div>
          </div>

          <div className="botPerf__mini">
            <div className="botPerf__miniLabel">ربحية الأسبوع</div>
            <div className={`botPerf__miniVal mono ${toNum(perf?.weeklyProfit ?? perf?.pnl?.weekly, 0) >= 0 ? 'profit' : 'loss'}`}>
              {formatMoney(perf?.weeklyProfit ?? perf?.pnl?.weekly)}
            </div>
          </div>

          <div className="botPerf__mini">
            <div className="botPerf__miniLabel">ربحية الشهر</div>
            <div className={`botPerf__miniVal mono ${toNum(perf?.monthlyProfit ?? perf?.pnl?.monthly, 0) >= 0 ? 'profit' : 'loss'}`}>
              {formatMoney(perf?.monthlyProfit ?? perf?.pnl?.monthly)}
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
            <span className="mono">{derived.sharpe.toFixed(2)}</span>
          </div>
          <div className="botPerf__riskRow">
            <span>التقلب</span>
            <span className="mono">{derived.volatility.toFixed(2)}%</span>
          </div>
        </div>

        <div className="botPerf__tips">
          <h4>توصيات تحسين الأداء</h4>
          <ul>
            {derived.efficiency < 60 ? (
              <li>تحسين معدل النجاح: قلّل الأزواج أو شدّد شروط الدخول.</li>
            ) : null}
            {derived.maxDD > 5 ? (
              <li>إدارة المخاطرة: الخسارة القصوى مرتفعة — راجع حجم الصفقة ووقف الخسارة.</li>
            ) : null}
            {Math.abs(derived.avg) < 0.5 ? (
              <li>تحسين الربحية: متوسط الربح/صفقة منخفض — راجع takeProfit وفلترة الإشارات.</li>
            ) : null}
            {derived.efficiency >= 80 ? <li>أداء ممتاز: استمر مع مراقبة دورية للـ drawdown والاتصال.</li> : null}
            {derived.efficiency >= 60 && derived.efficiency < 80 ? (
              <li>أداء جيد: ركّز على تخفيف التقلب ورفع نسبة الصفقات الرابحة.</li>
            ) : null}
            {derived.efficiency >= 40 && derived.efficiency < 60 ? (
              <li>أداء متوسط: راقب الأزواج الضعيفة وفعّل تنبيهات المخاطرة.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
