// frontend/src/components/bot/BotStatus.js
import React, { useMemo, useState } from 'react';
import './BotStatus.css';
import useBotData from '../../hooks/useBotData';

const safeArray = (v) => (Array.isArray(v) ? v : []);
const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function formatTime(ts) {
  if (!ts) return '-';
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return String(ts);
    return d.toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function BotStatus() {
  const {
    metrics,
    loadingMetrics,
    pendingAction,
    error,
    startBot,
    pauseBot,
    stopBot,
    emergencyStop,
  } = useBotData();

  const [tab, setTab] = useState('overview');

  const isActive = metrics?.engineStatus?.status === 'active';
  const balance = toNum(metrics?.engineStatus?.balance, 0);
  const activePairs = safeArray(metrics?.engineStatus?.activePairs);

  const daily = toNum(metrics?.pnl?.daily, 0);
  const weekly = toNum(metrics?.pnl?.weekly, 0);
  const monthly = toNum(metrics?.pnl?.monthly, 0);

  const trades = safeArray(metrics?.recentTrades);

  const badgeClass = isActive ? 'is-active' : 'is-paused';
  const badgeText = isActive ? 'Active' : 'Paused';

  const busy = !!pendingAction;

  const rows = useMemo(() => {
    return trades.slice(0, 20).map((t, idx) => {
      const pair = t?.symbol || t?.pair || t?.market || '-';
      const side = (t?.side || t?.type || '').toString().toUpperCase();
      const qty = t?.qty ?? t?.amount ?? t?.volume ?? '-';
      const price = t?.price ?? t?.entryPrice ?? '-';
      const pnl = t?.pnl ?? t?.profit ?? t?.net ?? 0;
      const time = t?.time || t?.timestamp || t?.createdAt || t?.executedAt || null;

      return {
        id: t?.id || `${idx}`,
        pair,
        side: side || '-',
        qty,
        price,
        pnl: toNum(pnl, 0),
        time,
      };
    });
  }, [trades]);

  return (
    <div className="botStatus">
      <div className="botStatus__header">
        <div>
          <h3 className="botStatus__title">حالة البوت</h3>
          <div className="botStatus__subtitle">
            مراقبة فورية + إجراءات سريعة — بنفس الهوية البصرية (تركوازي/أزرق/أخضر).
          </div>
        </div>

        <div className={`botStatus__badge ${badgeClass}`}>
          <span className="botStatus__dot" />
          {badgeText}
          <span className="botStatus__meta">
            آخر تحديث: {formatTime(metrics?.engineStatus?.lastUpdate)}
          </span>
        </div>
      </div>

      <div className="botStatus__actions">
        <button className="botStatus__btn botStatus__btn--primary" onClick={startBot} disabled={busy}>
          ▶️ تشغيل
        </button>
        <button className="botStatus__btn" onClick={pauseBot} disabled={busy}>
          ⏸️ إيقاف مؤقت
        </button>
        <button className="botStatus__btn botStatus__btn--danger" onClick={stopBot} disabled={busy}>
          ⏹️ إيقاف
        </button>
        <button className="botStatus__btn botStatus__btn--dangerOutline" onClick={emergencyStop} disabled={busy}>
          🚨 طوارئ
        </button>

        {busy ? <span className="botStatus__busy">جاري التنفيذ…</span> : null}
      </div>

      <div className="botStatus__tabs">
        <button className={`botStatus__tab ${tab === 'overview' ? 'is-active' : ''}`} onClick={() => setTab('overview')}>
          📊 نظرة عامة
        </button>
        <button className={`botStatus__tab ${tab === 'history' ? 'is-active' : ''}`} onClick={() => setTab('history')}>
          🧾 آخر الصفقات
        </button>
        <button className={`botStatus__tab ${tab === 'system' ? 'is-active' : ''}`} onClick={() => setTab('system')}>
          🛡️ النظام
        </button>
      </div>

      {error ? (
        <div className="botStatus__error">
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      ) : null}

      {loadingMetrics ? (
        <div className="botStatus__loading">
          <span className="botStatus__spinner" />
          جاري تحميل بيانات البوت…
        </div>
      ) : null}

      {tab === 'overview' ? (
        <div className="botStatus__grid">
          <div className="botStatus__card">
            <div className="botStatus__label">الرصيد</div>
            <div className="botStatus__value mono">{balance.toFixed(2)}</div>
            <div className="botStatus__hint">Balance (حسب الخادم)</div>
          </div>

          <div className="botStatus__card">
            <div className="botStatus__label">ربحية اليوم</div>
            <div className={`botStatus__value mono ${daily >= 0 ? 'profit' : 'loss'}`}>
              {daily >= 0 ? '▲' : '▼'} {daily.toFixed(2)}
            </div>
            <div className="botStatus__hint">Daily PnL</div>
          </div>

          <div className="botStatus__card">
            <div className="botStatus__label">ربحية الأسبوع</div>
            <div className={`botStatus__value mono ${weekly >= 0 ? 'profit' : 'loss'}`}>
              {weekly >= 0 ? '▲' : '▼'} {weekly.toFixed(2)}
            </div>
            <div className="botStatus__hint">Weekly PnL</div>
          </div>

          <div className="botStatus__card">
            <div className="botStatus__label">ربحية الشهر</div>
            <div className={`botStatus__value mono ${monthly >= 0 ? 'profit' : 'loss'}`}>
              {monthly >= 0 ? '▲' : '▼'} {monthly.toFixed(2)}
            </div>
            <div className="botStatus__hint">Monthly PnL</div>
          </div>

          <div className="botStatus__card botStatus__card--wide">
            <div className="botStatus__label">الأزواج النشطة</div>
            <div className="botStatus__pairs">
              {activePairs.length ? (
                activePairs.map((p) => (
                  <span key={p} className="botStatus__pill">
                    {p}
                  </span>
                ))
              ) : (
                <span className="botStatus__muted">لا يوجد</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'history' ? (
        <div className="botStatus__tableWrap">
          <table className="botStatus__table">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Side</th>
                <th>Qty</th>
                <th>Price</th>
                <th>PnL</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.pair}</td>
                    <td>{r.side}</td>
                    <td className="mono">{r.qty}</td>
                    <td className="mono">{r.price}</td>
                    <td className={`mono ${r.pnl >= 0 ? 'profit' : 'loss'}`}>{r.pnl.toFixed(2)}</td>
                    <td>{formatTime(r.time)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="botStatus__empty">
                    لا توجد صفقات لعرضها.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'system' ? (
        <div className="botStatus__system">
          <div className="botStatus__sysRow">
            <span>الحالة</span>
            <b className={isActive ? 'profit' : 'loss'}>{isActive ? 'Active' : 'Paused'}</b>
          </div>
          <div className="botStatus__sysRow">
            <span>آخر تحديث</span>
            <b>{formatTime(metrics?.engineStatus?.lastUpdate)}</b>
          </div>
          <div className="botStatus__sysRow">
            <span>عدد الأزواج</span>
            <b className="mono">{activePairs.length}</b>
          </div>
        </div>
      ) : null}
    </div>
  );
}
