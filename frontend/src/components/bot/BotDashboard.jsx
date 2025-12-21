// frontend/src/components/bot/BotDashboard.jsx
import React, { useMemo, useState } from 'react';
import './BotDashboard.css';
import useBotData from '../../hooks/useBotData';
import { useToast } from '../common/ToastProvider';

const safeArr = (v) => (Array.isArray(v) ? v : []);

const fmtMoney = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
};

const fmtPct = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)}%`;
};

const fmtTime = (v) => {
  if (!v) return '—';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
};

function getStatusMeta(status) {
  const s = String(status || 'unknown').toLowerCase();
  if (s === 'active' || s === 'running' || s === 'started') {
    return { label: 'RUNNING', cls: 'is-running', hint: 'البوت يعمل حالياً' };
  }
  if (s === 'paused' || s === 'idle') {
    return { label: 'PAUSED', cls: 'is-paused', hint: 'البوت في وضع إيقاف مؤقت' };
  }
  if (s === 'stopped' || s === 'inactive') {
    return { label: 'STOPPED', cls: 'is-stopped', hint: 'البوت متوقف' };
  }
  if (s === 'emergency') {
    return { label: 'EMERGENCY', cls: 'is-emergency', hint: 'إيقاف طوارئ' };
  }
  return { label: 'UNKNOWN', cls: 'is-unknown', hint: 'الحالة غير معروفة' };
}

export default function BotDashboard() {
  const {
    bots,
    selectedBotId,
    setSelectedBotId,
    metrics,
    loadingBots,
    loadingMetrics,
    pendingAction,
    error,
    startBot,
    pauseBot,
    stopBot,
    emergencyStop,
    updateSettings,
  } = useBotData();

  // Toast (بدون كسر لو ToastProvider غير ملفوف)
  let toastApi = null;
  try {
    toastApi = useToast();
  } catch {
    toastApi = null;
  }

  // نُبقي نفس الاستدعاءات notify(type, message) لكن نحولها لتوقيع addToast({..})
  const notify = (type, message) => {
    if (!toastApi?.addToast) return;

    const titleByType = {
      success: 'نجاح',
      info: 'معلومة',
      warning: 'تنبيه',
      error: 'خطأ',
    };

    toastApi.addToast({
      type: type || 'info',
      title: titleByType[type] || 'تنبيه',
      description: String(message || ''),
      duration: 4000,
    });
  };

  const [localRiskMode, setLocalRiskMode] = useState('medium');

  const engineStatus = metrics?.engineStatus || {};
  const pnl = metrics?.pnl || { daily: 0, weekly: 0, monthly: 0 };
  const trades = safeArr(metrics?.recentTrades);

  const statusMeta = useMemo(() => getStatusMeta(engineStatus?.status), [engineStatus?.status]);

  const activePairsCount = safeArr(engineStatus?.activePairs).length;

  const totalPnlToday = Number(pnl?.daily || 0);
  const pnlTrendCls = totalPnlToday >= 0 ? 'metric--up' : 'metric--down';

  const canAct = !pendingAction && !loadingBots && !loadingMetrics;

  const onSetRisk = async (mode) => {
    setLocalRiskMode(mode);

    // نحاول نحفظها بالباك-إند بأمان (إذا schema عندك مختلف، سنعدّلها عندما نراجع BotSettings.js)
    try {
      if (typeof updateSettings === 'function') {
        await updateSettings({ riskMode: mode });
        notify('success', `تم ضبط مستوى المخاطر: ${mode}`);
      }
    } catch {
      // لا نكسر الواجهة لو endpoint رفض
    }
  };

  const onStart = async () => {
    try {
      await startBot();
      notify('success', 'تم تشغيل البوت');
    } catch (e) {
      notify('error', e?.message || 'فشل تشغيل البوت');
    }
  };

  const onPause = async () => {
    try {
      await pauseBot();
      notify('info', 'تم إيقاف البوت مؤقتاً');
    } catch (e) {
      notify('error', e?.message || 'فشل الإيقاف المؤقت');
    }
  };

  const onStop = async () => {
    try {
      await stopBot();
      notify('info', 'تم إيقاف البوت');
    } catch (e) {
      notify('error', e?.message || 'فشل الإيقاف');
    }
  };

  const onEmergency = async () => {
    try {
      await emergencyStop();
      notify('error', 'تم تنفيذ إيقاف طوارئ');
    } catch (e) {
      notify('error', e?.message || 'فشل إيقاف الطوارئ');
    }
  };

  const selectedId = selectedBotId ?? (safeArr(bots)[0]?.id ?? '');

  const pendingLabel = (action, fallback) => {
    return pendingAction === action ? fallback : action.toUpperCase();
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 14 }}>
      {/* Header */}
      <header
        style={{
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(56,189,248,0.18)',
          background: 'linear-gradient(135deg, rgba(2,6,23,0.95), rgba(8,47,73,0.70))',
          boxShadow: '0 20px 60px rgba(2,6,23,0.72)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ color: 'rgba(226,232,240,0.98)', fontWeight: 950, fontSize: 20 }}>Quantum AI Trading Bot</div>
          <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)', lineHeight: 1.7 }}>
            لوحة تحكم احترافية لإدارة البوت ومراقبة الأداء — بنفس هوية التركوازي/الأزرق/الأخضر.
          </div>
          <div style={{ marginTop: 8, color: 'rgba(148,163,184,0.95)' }}>
            {statusMeta.hint} • آخر تحديث: <strong style={{ color: 'rgba(226,232,240,0.95)' }}>{fmtTime(engineStatus?.lastUpdate)}</strong>
          </div>
        </div>

        <div
          className={statusMeta.cls}
          style={{
            borderRadius: 999,
            padding: '6px 10px',
            border: '1px solid rgba(0,255,136,0.25)',
            background: 'rgba(0,255,136,0.08)',
            color: 'rgba(226,232,240,0.95)',
            fontWeight: 950,
            letterSpacing: '0.08em',
            fontSize: 12,
          }}
          title={String(engineStatus?.status || 'unknown')}
        >
          {statusMeta.label}
        </div>
      </header>

      {/* Toolbar */}
      <section
        style={{
          marginTop: 12,
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(148,163,184,0.14)',
          background: 'rgba(15,23,42,0.55)',
          boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>Bot Selection</div>
          <select
            value={selectedId}
            onChange={(e) => setSelectedBotId?.(e.target.value)}
            disabled={!!loadingBots}
            style={{
              borderRadius: 14,
              padding: '10px 12px',
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(2,6,23,0.25)',
              color: 'rgba(226,232,240,0.95)',
              outline: 'none',
              maxWidth: 420,
            }}
          >
            {safeArr(bots).map((b) => (
              <option key={b?.id ?? b?.name} value={b?.id ?? ''}>
                {b?.name || b?.id || 'Bot'}
              </option>
            ))}
          </select>
          <div style={{ color: 'rgba(148,163,184,0.95)' }}>اختر البوت الذي تريد التحكم به (حالياً عادة بوت واحد).</div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>Bot Actions</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onStart}
              disabled={!canAct}
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                border: '1px solid rgba(0,255,136,0.35)',
                background: 'rgba(0,255,136,0.10)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 950,
                cursor: !canAct ? 'not-allowed' : 'pointer',
              }}
            >
              {pendingAction === 'start' ? 'Starting…' : 'Start'}
            </button>

            <button
              type="button"
              onClick={onPause}
              disabled={!canAct}
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                border: '1px solid rgba(56,189,248,0.30)',
                background: 'rgba(56,189,248,0.10)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 950,
                cursor: !canAct ? 'not-allowed' : 'pointer',
              }}
            >
              {pendingAction === 'pause' ? 'Pausing…' : 'Pause'}
            </button>

            <button
              type="button"
              onClick={onStop}
              disabled={!canAct}
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                border: '1px solid rgba(148,163,184,0.22)',
                background: 'rgba(2,6,23,0.25)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 950,
                cursor: !canAct ? 'not-allowed' : 'pointer',
              }}
            >
              {pendingAction === 'stop' ? 'Stopping…' : 'Stop'}
            </button>

            <button
              type="button"
              onClick={onEmergency}
              disabled={!canAct}
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                border: '1px solid rgba(255,59,92,0.35)',
                background: 'rgba(255,59,92,0.10)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 950,
                cursor: !canAct ? 'not-allowed' : 'pointer',
              }}
            >
              {pendingAction === 'emergency' ? 'Emergency…' : 'Emergency Stop'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>Risk Mode</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['low', 'medium', 'high'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onSetRisk(m)}
                disabled={!canAct}
                style={{
                  borderRadius: 999,
                  padding: '8px 10px',
                  border:
                    localRiskMode === m ? '1px solid rgba(0,255,136,0.35)' : '1px solid rgba(148,163,184,0.18)',
                  background: localRiskMode === m ? 'rgba(0,255,136,0.10)' : 'rgba(2,6,23,0.25)',
                  color: 'rgba(226,232,240,0.95)',
                  fontWeight: 950,
                  cursor: !canAct ? 'not-allowed' : 'pointer',
                }}
              >
                {m === 'low' ? 'Low' : m === 'medium' ? 'Medium' : 'High'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error */}
      {!!error ? (
        <div
          style={{
            marginTop: 12,
            borderRadius: 18,
            padding: 14,
            border: '1px solid rgba(255,59,92,0.30)',
            background: 'rgba(255,59,92,0.08)',
            color: 'rgba(226,232,240,0.95)',
          }}
        >
          <div style={{ fontWeight: 950, marginBottom: 6 }}>تنبيه</div>
          <div style={{ color: 'rgba(226,232,240,0.92)' }}>{String(error)}</div>
        </div>
      ) : null}

      {/* Metrics */}
      <section
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {[
          { title: 'Balance', value: fmtMoney(engineStatus?.balance), desc: 'الرصيد الحالي' },
          { title: 'Daily PnL', value: fmtMoney(pnl?.daily), desc: 'أداء آخر 24 ساعة', cls: pnlTrendCls },
          { title: 'Weekly PnL', value: fmtMoney(pnl?.weekly), desc: 'أداء أسبوعي' },
          { title: 'Monthly PnL', value: fmtMoney(pnl?.monthly), desc: 'أداء شهري' },
          { title: 'Active Pairs', value: String(activePairsCount), desc: 'عدد الأزواج الفعّالة' },
        ].map((m) => (
          <div
            key={m.title}
            className={m.cls || ''}
            style={{
              borderRadius: 22,
              padding: 16,
              border: '1px solid rgba(148,163,184,0.14)',
              background: 'rgba(15,23,42,0.55)',
              boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
            }}
          >
            <div style={{ color: 'rgba(148,163,184,0.95)', fontWeight: 900 }}>{m.title}</div>
            <div style={{ marginTop: 8, color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 20 }}>
              {m.value}
            </div>
            <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)' }}>{m.desc}</div>
          </div>
        ))}
      </section>

      {/* Trades Panel */}
      <section
        style={{
          marginTop: 12,
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(56,189,248,0.14)',
          background: 'rgba(15,23,42,0.55)',
          boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 16 }}>Recent Trades</div>
            <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)' }}>آخر عمليات التداول الواردة من الباك-إند</div>
          </div>
          <div style={{ color: 'rgba(148,163,184,0.95)', fontWeight: 900 }}>
            {loadingMetrics ? 'Loading…' : `${trades.length} trades`}
          </div>
        </div>

        {trades.length === 0 ? (
          <div style={{ marginTop: 12, color: 'rgba(148,163,184,0.95)' }}>لا توجد صفقات حالياً.</div>
        ) : (
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {['Pair', 'Side', 'Price', 'Volume', 'PnL', 'Time'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 8px',
                        borderBottom: '1px solid rgba(148,163,184,0.14)',
                        color: 'rgba(148,163,184,0.95)',
                        fontWeight: 900,
                        fontSize: 12,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t, idx) => {
                  const side = String(t?.side || t?.type || '').toLowerCase();
                  const isBuy = side === 'buy' || side === 'long';
                  const pnlVal = Number(t?.pnl ?? t?.profit ?? t?.pl ?? 0);

                  return (
                    <tr key={t?.id ?? `${idx}`}>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(148,163,184,0.10)' }}>
                        <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>
                          {t?.pair || t?.symbol || t?.market || '—'}
                        </div>
                        <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12 }}>
                          {t?.strategy ? `Strategy: ${t.strategy}` : ''}
                        </div>
                      </td>

                      <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(148,163,184,0.10)' }}>
                        <span
                          style={{
                            borderRadius: 999,
                            padding: '4px 8px',
                            border: `1px solid ${isBuy ? 'rgba(0,255,136,0.35)' : 'rgba(255,59,92,0.35)'}`,
                            background: isBuy ? 'rgba(0,255,136,0.10)' : 'rgba(255,59,92,0.10)',
                            color: 'rgba(226,232,240,0.95)',
                            fontWeight: 950,
                            fontSize: 12,
                          }}
                        >
                          {isBuy ? 'BUY' : 'SELL'}
                        </span>
                      </td>

                      <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(148,163,184,0.10)', color: 'rgba(226,232,240,0.95)', fontWeight: 900 }}>
                        {fmtMoney(t?.price)}
                      </td>

                      <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(148,163,184,0.10)', color: 'rgba(226,232,240,0.95)', fontWeight: 900 }}>
                        {fmtMoney(t?.volume ?? t?.qty ?? t?.amount)}
                      </td>

                      <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(148,163,184,0.10)' }}>
                        <span
                          className={`pnl ${pnlVal >= 0 ? 'is-up' : 'is-down'}`}
                          style={{ color: pnlVal >= 0 ? 'rgba(0,255,136,0.95)' : 'rgba(255,59,92,0.95)', fontWeight: 950 }}
                        >
                          {fmtMoney(pnlVal)}
                        </span>
                      </td>

                      <td style={{ padding: '10px 8px', borderBottom: '1px solid rgba(148,163,184,0.10)', color: 'rgba(148,163,184,0.95)' }}>
                        {fmtTime(t?.time || t?.timestamp || t?.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
