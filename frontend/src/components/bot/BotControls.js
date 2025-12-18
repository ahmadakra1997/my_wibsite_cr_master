// frontend/src/components/bot/BotControls.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './BotControls.css';
import { activateTradingBot, deactivateTradingBot, getBotStatus, getPerformanceMetrics } from '../../services/api';

const unwrap = (res) => {
  if (res && typeof res === 'object' && 'success' in res) return res.success ? res.data : null;
  return res;
};
const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function MetricPill({ label, value, tone = 'info' }) {
  return (
    <div className={`bot-controls__pill is-${tone}`}>
      <div className="bot-controls__pillLabel">{label}</div>
      <div className="bot-controls__pillValue">{value}</div>
    </div>
  );
}

export default function BotControls() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState(null);
  const [perf, setPerf] = useState(null);

  const isActive = !!(status?.isActive || status?.active || status?.status === 'active');
  const statusLabel = isActive ? 'نشط' : 'متوقف/مؤقت';

  const load = useCallback(async () => {
    setError(null);
    try {
      const [sRes, pRes] = await Promise.allSettled([
        getBotStatus(),
        getPerformanceMetrics({ range: '24h' }),
      ]);

      const s = sRes.status === 'fulfilled' ? unwrap(sRes.value) : null;
      const p = pRes.status === 'fulfilled' ? unwrap(pRes.value) : null;

      setStatus(s);
      setPerf(p);
    } catch (e) {
      setError(e?.message || 'فشل تحميل بيانات البوت');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      if (isActive) {
        await deactivateTradingBot();
      } else {
        await activateTradingBot();
      }
      await load();
    } catch (e) {
      setError(e?.message || 'فشل تنفيذ الأمر');
    } finally {
      setBusy(false);
    }
  };

  const daily = toNum(perf?.pnl?.daily ?? perf?.dailyProfit ?? perf?.dailyPnl, 0);
  const winRate = toNum(perf?.winRate ?? perf?.winRatePct ?? perf?.successRate, 0);
  const trades = toNum(perf?.totalTrades ?? perf?.trades ?? perf?.count, 0);

  return (
    <div className="bot-controls">
      <div className="bot-controls__header">
        <div>
          <h3 className="bot-controls__title">تحكم البوت</h3>
          <div className="bot-controls__subtitle">تشغيل/إيقاف + مؤشرات سريعة — بدون تغيير منطق التداول.</div>
        </div>

        <div className={`bot-controls__status ${isActive ? 'is-active' : 'is-inactive'}`}>
          <span className="bot-controls__statusDot" />
          {statusLabel}
          {busy ? <span className="bot-controls__statusBusy"> • جاري التنفيذ…</span> : null}
        </div>
      </div>

      <div className="bot-controls__body">
        <button
          type="button"
          className={`bot-controls__primaryBtn ${isActive ? 'is-stop' : 'is-start'}`}
          onClick={toggle}
          disabled={busy}
        >
          <span className="bot-controls__primaryIcon">{isActive ? '⏹️' : '▶️'}</span>
          {isActive ? 'إيقاف البوت' : 'تشغيل البوت'}
        </button>

        <div className="bot-controls__metrics">
          <MetricPill
            label="ربحية اليوم"
            value={`${daily >= 0 ? '▲' : '▼'} ${daily.toFixed(2)}`}
            tone={daily >= 0 ? 'success' : 'danger'}
          />
          <MetricPill label="معدل النجاح" value={`${winRate.toFixed(1)}%`} tone="info" />
          <MetricPill label="إجمالي الصفقات" value={`${trades}`} tone="primary" />
        </div>

        {error ? (
          <div className="bot-controls__error">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
