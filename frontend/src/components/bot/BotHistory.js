// frontend/src/components/bot/BotHistory.js
import React, { useMemo, useState } from 'react';
import './BotHistory.css';

import useBotData from '../../hooks/useBotData';
import { useTranslation } from 'react-i18next';

const safeArr = (v) => (Array.isArray(v) ? v : []);

const fmtMoney = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
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

export default function BotHistory() {
  const { t } = useTranslation();

  const { metrics, loadingMetrics, error } = useBotData();
  const trades = safeArr(metrics?.recentTrades);

  const [query, setQuery] = useState('');
  const [sideFilter, setSideFilter] = useState('all');

  const computed = useMemo(() => {
    const normalized = trades.map((x) => {
      const side = String(x?.side || x?.type || '').toLowerCase();
      const pnl = Number(x?.pnl ?? x?.profit ?? x?.pl ?? 0);
      return { ...x, __side: side, __pnl: Number.isNaN(pnl) ? 0 : pnl };
    });

    const filtered = normalized.filter((x) => {
      const pair = String(x?.pair || x?.symbol || x?.market || '').toLowerCase();
      const matchesQuery = !query || pair.includes(query.toLowerCase());

      const isBuy = x.__side === 'buy' || x.__side === 'long';
      const isSell = x.__side === 'sell' || x.__side === 'short';
      const matchesSide =
        sideFilter === 'all' ||
        (sideFilter === 'buy' && isBuy) ||
        (sideFilter === 'sell' && isSell);

      return matchesQuery && matchesSide;
    });

    const total = filtered.length;
    const pnlSum = filtered.reduce((acc, x) => acc + (x.__pnl || 0), 0);
    const wins = filtered.filter((x) => x.__pnl > 0).length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    return { filtered, total, pnlSum, winRate };
  }, [trades, query, sideFilter]);

  return (
    <div className="bot-history">
      <div className="bot-history__header">
        <div>
          <h3 className="bot-history__title">{t?.('bot.history.title') || 'Bot Trade History'}</h3>
          <p className="bot-history__subtitle">
            {t?.('bot.history.subtitle') ||
              'سجل الصفقات — عرض احترافي مع بحث/فلترة بدون كسر أي منطق.'}
          </p>
        </div>

        <div className="bot-history__stats">
          <div className="bot-history__chip is-info">
            <div className="bot-history__chipLabel">TRADES</div>
            <div className="bot-history__chipValue">{computed.total}</div>
          </div>

          <div className="bot-history__chip is-success">
            <div className="bot-history__chipLabel">WIN RATE</div>
            <div className="bot-history__chipValue">{fmtMoney(computed.winRate)}%</div>
          </div>

          <div className="bot-history__chip">
            <div className="bot-history__chipLabel">PNL</div>
            <div className={`bot-history__chipValue ${computed.pnlSum >= 0 ? 'profit' : 'loss'}`}>
              {fmtMoney(computed.pnlSum)}
            </div>
          </div>
        </div>
      </div>

      {/* أدوات بحث/فلترة (بدون CSS إضافي — نعتمد على الستايل العام) */}
      <div className="bot-history__state" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pair (e.g. BTC/USDT)…"
            style={{
              borderRadius: 12,
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(2, 6, 23, 0.35)',
              color: '#e5e7eb',
              padding: '10px 12px',
              minWidth: 240,
              fontWeight: 800,
              outline: 'none',
            }}
          />

          <select
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value)}
            style={{
              borderRadius: 12,
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(2, 6, 23, 0.35)',
              color: '#e5e7eb',
              padding: '10px 12px',
              fontWeight: 900,
              outline: 'none',
            }}
          >
            <option value="all">All</option>
            <option value="buy">Buy/Long</option>
            <option value="sell">Sell/Short</option>
          </select>
        </div>

        <div style={{ fontWeight: 900, color: '#9ca3af' }}>
          {loadingMetrics ? 'Loading…' : `Showing ${computed.filtered.length}`}
        </div>
      </div>

      {loadingMetrics && (
        <div className="bot-history__state">
          <div className="bot-history__spinner" />
          Loading history…
        </div>
      )}

      {!!error && !loadingMetrics && (
        <div className="bot-history__error">
          <div>⚠</div>
          <div>{String(error)}</div>
        </div>
      )}

      {!loadingMetrics && !error && computed.filtered.length === 0 && (
        <div className="bot-history__empty">
          <div className="bot-history__emptyIcon">🗂</div>
          <div className="bot-history__emptyTitle">No trades</div>
          <div className="bot-history__emptyText">لا يوجد سجل مطابق للبحث/الفلترة.</div>
        </div>
      )}

      {!loadingMetrics && !error && computed.filtered.length > 0 && (
        <div className="bot-history__tableWrap">
          <table className="bot-history__table">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Side</th>
                <th>Price</th>
                <th>Volume</th>
                <th>PnL</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {computed.filtered.map((x, idx) => {
                const side = x.__side;
                const isBuy = side === 'buy' || side === 'long';
                const pnl = x.__pnl;

                const status = String(x?.status || (isBuy ? 'active' : 'active')).toLowerCase();
                const badgeClass =
                  status === 'active'
                    ? 'is-active'
                    : status === 'paused'
                    ? 'is-paused'
                    : status === 'error'
                    ? 'is-error'
                    : status === 'stopped'
                    ? 'is-stopped'
                    : 'is-unknown';

                return (
                  <tr className="bot-history__row" key={x?.id || x?._id || idx}>
                    <td>
                      <div className="bot-history__nameMain">
                        {x?.pair || x?.symbol || x?.market || '—'}
                      </div>
                      <div className="bot-history__nameSub">
                        {x?.strategy ? `strategy: ${x.strategy}` : ''}
                      </div>
                    </td>

                    <td>
                      <span className={`bot-history__badge ${isBuy ? 'is-active' : 'is-paused'}`}>
                        <span className="bot-history__badgeDot" />
                        {isBuy ? 'BUY' : 'SELL'}
                      </span>
                    </td>

                    <td className="bot-history__mono">{fmtMoney(x?.price)}</td>
                    <td className="bot-history__mono">{fmtMoney(x?.volume ?? x?.qty ?? x?.amount)}</td>

                    <td className={`bot-history__mono ${pnl >= 0 ? 'is-profit' : 'is-loss'}`}>
                      {fmtMoney(pnl)}
                    </td>

                    <td>{fmtTime(x?.time || x?.timestamp || x?.createdAt)}</td>

                    <td>
                      <span className={`bot-history__badge ${badgeClass}`}>
                        <span className="bot-history__badgeDot" />
                        {status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
