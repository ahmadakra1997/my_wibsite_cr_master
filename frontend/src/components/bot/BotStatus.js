// frontend/src/components/bot/BotStatus.js
import React, { useMemo, useState } from 'react';
import useBotData from '../../hooks/useBotData';
import { useWebSocket } from '../../hooks/useWebSocket';
import './BotStatus.css';

const safeArray = (v) => (Array.isArray(v) ? v : []);
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

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
    refreshAll, // لو ما كانت موجودة عندك بالهوك، احذفها من هنا (لن نكسر شيء).
  } = useBotData();

  // اتصال WS للعرض فقط
  const { isConnected } = useWebSocket('bot-status');

  const [activeTab, setActiveTab] = useState('overview');

  const engine = metrics?.engineStatus || {};
  const trades = safeArray(metrics?.recentTrades).slice(0, 10);

  const pnl = metrics?.pnl || { daily: 0, weekly: 0, monthly: 0 };

  const derived = useMemo(() => {
    const sum = trades.reduce((acc, tr) => acc + toNum(tr?.profit ?? tr?.pnl ?? tr?.realizedPnl), 0);
    const wins = trades.filter((tr) => toNum(tr?.profit ?? tr?.pnl ?? tr?.realizedPnl) > 0).length;
    const total = trades.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    const status = (engine?.status || 'unknown').toString();
    const isActive = status === 'active';

    return { sum, wins, total, winRate, isActive };
  }, [trades, engine?.status]);

  const formatMoney = (v) => `${v >= 0 ? '+' : '-'}${Math.abs(toNum(v)).toFixed(2)} USDT`;

  return (
    <section className="botStatus">
      <header className="botStatus__header">
        <div>
          <h3 className="botStatus__title">مركز حالة البوت</h3>
          <p className="botStatus__subtitle">
            عرض حالة المحرك + آخر التحديثات + أزرار التحكم — بدون تغيير منطق التداول.
          </p>
        </div>

        <div className="botStatus__headerRight">
          <span className={`botStatus__conn ${isConnected ? 'is-on' : 'is-off'}`}>
            <span className="botStatus__dot" />
            {isConnected ? 'متصل' : 'غير متصل'}
          </span>

          <button
            className="botStatus__btn ghost"
            type="button"
            onClick={() => (typeof refreshAll === 'function' ? refreshAll() : window.location.reload())}
            disabled={Boolean(loadingMetrics)}
            title="تحديث"
          >
            تحديث
          </button>
        </div>
      </header>

      <div className="botStatus__actions">
        <button
          className="botStatus__btn primary"
          type="button"
          onClick={startBot}
          disabled={Boolean(pendingAction)}
        >
          تشغيل
        </button>

        <button
          className="botStatus__btn"
          type="button"
          onClick={pauseBot}
          disabled={Boolean(pendingAction)}
        >
          إيقاف مؤقت
        </button>

        <button
          className="botStatus__btn"
          type="button"
          onClick={stopBot}
          disabled={Boolean(pendingAction)}
        >
          إيقاف
        </button>

        <button
          className="botStatus__btn danger"
          type="button"
          onClick={emergencyStop}
          disabled={Boolean(pendingAction)}
        >
          إيقاف طوارئ
        </button>

        <span className={`botStatus__badge ${derived.isActive ? 'is-active' : 'is-paused'}`}>
          <span className="botStatus__badgeDot" />
          {derived.isActive ? 'نشط' : 'متوقف/مؤقت'}
        </span>

        {engine?.lastUpdate && (
          <span className="botStatus__meta">
            آخر تحديث: {new Date(engine.lastUpdate).toLocaleString('ar-SA')}
          </span>
        )}
      </div>

      {(loadingMetrics && !error) && (
        <div className="botStatus__state">
          <span className="botStatus__spinner" />
          جاري التحميل...
        </div>
      )}

      {error && (
        <div className="botStatus__error">
          <span>⚠️</span>
          <div>{String(error)}</div>
        </div>
      )}

      <nav className="botStatus__tabs">
        <button
          className={`botStatus__tab ${activeTab === 'overview' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('overview')}
          type="button"
        >
          نظرة عامة
        </button>
        <button
          className={`botStatus__tab ${activeTab === 'history' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('history')}
          type="button"
        >
          آخر الصفقات
        </button>
        <button
          className={`botStatus__tab ${activeTab === 'system' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('system')}
          type="button"
        >
          النظام
        </button>
      </nav>

      {activeTab === 'overview' && (
        <div className="botStatus__grid">
          <div className="botStatus__card">
            <div className="botStatus__cardLabel">الرصيد</div>
            <div className="botStatus__cardValue mono">{toNum(engine?.balance ?? 0).toFixed(2)} USDT</div>
            <div className="botStatus__cardHint">Balance من الباكيند/WS</div>
          </div>

          <div className="botStatus__card">
            <div className="botStatus__cardLabel">ربحية اليوم</div>
            <div className={`botStatus__cardValue ${toNum(pnl.daily) >= 0 ? 'profit' : 'loss'}`}>
              {formatMoney(pnl.daily)}
            </div>
            <div className="botStatus__cardHint">Daily PnL</div>
          </div>

          <div className="botStatus__card">
            <div className="botStatus__cardLabel">ربحية الأسبوع</div>
            <div className={`botStatus__cardValue ${toNum(pnl.weekly) >= 0 ? 'profit' : 'loss'}`}>
              {formatMoney(pnl.weekly)}
            </div>
            <div className="botStatus__cardHint">Weekly PnL</div>
          </div>

          <div className="botStatus__card">
            <div className="botStatus__cardLabel">معدل الفوز (آخر 10)</div>
            <div className="botStatus__cardValue">{derived.winRate.toFixed(1)}%</div>
            <div className="botStatus__cardHint">من آخر صفقات فقط</div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="botStatus__tableWrap">
          <table className="botStatus__table">
            <thead>
              <tr>
                <th>الأصل</th>
                <th>النوع</th>
                <th>السعر</th>
                <th>الكمية</th>
                <th>الربح</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan="6" className="botStatus__emptyCell">
                    لا توجد صفقات حالياً
                  </td>
                </tr>
              ) : (
                trades.map((tr, idx) => {
                  const pair = tr?.pair ?? tr?.symbol ?? '—';
                  const sideRaw = (tr?.type ?? tr?.side ?? '').toString().toLowerCase();
                  const side = sideRaw.includes('buy') ? 'شراء' : sideRaw.includes('sell') ? 'بيع' : '—';
                  const price = tr?.price ?? tr?.entryPrice ?? '—';
                  const qty = tr?.volume ?? tr?.qty ?? '—';
                  const profit = toNum(tr?.profit ?? tr?.pnl ?? tr?.realizedPnl);
                  const time = tr?.timestamp ?? tr?.createdAt ?? null;

                  return (
                    <tr key={tr?.id ?? tr?._id ?? `${pair}-${idx}`}>
                      <td>{pair}</td>
                      <td>{side}</td>
                      <td className="mono">{String(price)}</td>
                      <td className="mono">{String(qty)}</td>
                      <td className={`mono ${profit >= 0 ? 'profit' : 'loss'}`}>
                        {(profit >= 0 ? '+' : '-') + Math.abs(profit).toFixed(2)}
                      </td>
                      <td className="mono">{time ? new Date(time).toLocaleString('ar-SA') : '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="botStatus__system">
          <div className="botStatus__sysRow">
            <span>حالة المحرك</span>
            <strong>{String(engine?.status ?? 'unknown')}</strong>
          </div>
          <div className="botStatus__sysRow">
            <span>أزواج مفعّلة</span>
            <strong>{safeArray(engine?.activePairs).length || 0}</strong>
          </div>
          <div className="botStatus__sysRow">
            <span>اتصال WS</span>
            <strong>{isConnected ? 'متصل' : 'غير متصل'}</strong>
          </div>
        </div>
      )}
    </section>
  );
}
