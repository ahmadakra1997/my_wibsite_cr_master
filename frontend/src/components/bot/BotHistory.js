// frontend/src/components/bot/BotHistory.js
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useBotData from '../../hooks/useBotData';
import './BotHistory.css';

const safeArray = (v) => (Array.isArray(v) ? v : []);
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function BotHistory() {
  const { t } = useTranslation();
  const { metrics, loadingMetrics, error } = useBotData();

  const trades = useMemo(() => safeArray(metrics?.recentTrades).slice(0, 50), [metrics?.recentTrades]);

  const summary = useMemo(() => {
    const totalTrades = trades.length;
    const totalProfit = trades.reduce((acc, tr) => acc + toNum(tr?.profit ?? tr?.pnl ?? tr?.realizedPnl), 0);
    const wins = trades.filter((tr) => toNum(tr?.profit ?? tr?.pnl ?? tr?.realizedPnl) > 0).length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    return { totalTrades, totalProfit, winRate };
  }, [trades]);

  const isLoading = Boolean(loadingMetrics) && trades.length === 0;

  return (
    <section className="bot-history">
      <div className="bot-history__header">
        <div>
          <h3 className="bot-history__title">
            {t('bot.history.title', 'سجل الصفقات الأخيرة')}
          </h3>
          <p className="bot-history__subtitle">
            {t(
              'bot.history.subtitle',
              'مراجعة آخر عمليات التنفيذ تساعدك على تقييم الاستراتيجية وتحسين إدارة المخاطر بدون تغيير منطق التداول.'
            )}
          </p>
        </div>

        <div className="bot-history__stats">
          <div className="bot-history__chip is-info">
            <div className="bot-history__chipLabel">{t('bot.history.chip.trades', 'عدد الصفقات')}</div>
            <div className="bot-history__chipValue">{summary.totalTrades}</div>
          </div>

          <div className="bot-history__chip is-success">
            <div className="bot-history__chipLabel">{t('bot.history.chip.winRate', 'معدل الفوز')}</div>
            <div className="bot-history__chipValue">{summary.winRate.toFixed(1)}%</div>
          </div>

          <div className="bot-history__chip">
            <div className="bot-history__chipLabel">{t('bot.history.chip.pnl', 'صافي الربح')}</div>
            <div
              className={
                'bot-history__chipValue ' +
                (summary.totalProfit >= 0 ? 'profit' : 'loss')
              }
            >
              {summary.totalProfit >= 0 ? '+' : '-'}
              {Math.abs(summary.totalProfit).toFixed(2)} USDT
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="bot-history__state">
          <span className="bot-history__spinner" />
          {t('bot.history.loading', 'جاري تحميل السجل...')}
        </div>
      )}

      {!isLoading && error && (
        <div className="bot-history__error">
          <span>⚠️</span>
          <div>
            {t('bot.history.errorTitle', 'تعذر تحميل السجل:')} {String(error)}
          </div>
        </div>
      )}

      {!isLoading && !error && trades.length === 0 && (
        <div className="bot-history__empty">
          <div className="bot-history__emptyIcon">🗒️</div>
          <div className="bot-history__emptyTitle">
            {t('bot.history.emptyTitle', 'لا توجد بيانات بعد')}
          </div>
          <div className="bot-history__emptyText">
            {t('bot.history.emptyText', 'ستظهر الصفقات هنا بعد بدء تشغيل البوت وتنفيذ أوامر.')}
          </div>
        </div>
      )}

      {!isLoading && !error && trades.length > 0 && (
        <div className="bot-history__tableWrap">
          <table className="bot-history__table">
            <thead>
              <tr>
                <th>{t('bot.history.th.asset', 'الأصل')}</th>
                <th>{t('bot.history.th.side', 'النوع')}</th>
                <th>{t('bot.history.th.qty', 'الكمية')}</th>
                <th>{t('bot.history.th.price', 'السعر')}</th>
                <th>{t('bot.history.th.pnl', 'الربح')}</th>
                <th>{t('bot.history.th.time', 'الوقت')}</th>
                <th>{t('bot.history.th.status', 'الحالة')}</th>
                <th>{t('bot.history.th.reason', 'ملاحظة')}</th>
              </tr>
            </thead>

            <tbody>
              {trades.map((tr, idx) => {
                const pair = tr?.pair ?? tr?.symbol ?? tr?.market ?? '—';
                const sideRaw = (tr?.type ?? tr?.side ?? '').toString().toLowerCase();
                const side = sideRaw.includes('buy') ? 'buy' : sideRaw.includes('sell') ? 'sell' : '—';

                const qty = tr?.volume ?? tr?.qty ?? tr?.amount ?? '—';
                const price = tr?.price ?? tr?.entryPrice ?? tr?.fillPrice ?? '—';

                const pnl = toNum(tr?.profit ?? tr?.pnl ?? tr?.realizedPnl);
                const pnlCls = pnl > 0 ? 'is-profit' : pnl < 0 ? 'is-loss' : '';

                const status = (tr?.status ?? (pnl > 0 ? 'active' : pnl < 0 ? 'error' : 'stopped')).toString();
                const statusCfg = getStatusConfig(status);

                const timeValue = tr?.timestamp ?? tr?.time ?? tr?.createdAt ?? tr?.date;
                const timeLabel = formatDate(timeValue);

                const reason = tr?.reason ?? tr?.note ?? tr?.message ?? '—';
                const id = tr?.id ?? tr?._id ?? tr?.tradeId ?? null;

                return (
                  <tr className="bot-history__row" key={id ?? `${pair}-${idx}`}>
                    <td>
                      <div className="bot-history__nameMain">{pair}</div>
                      <div className="bot-history__nameSub">
                        {id ? `ID: ${id}` : '—'}
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          'bot-history__badge ' +
                          (side === 'buy' ? 'is-active' : side === 'sell' ? 'is-paused' : 'is-unknown')
                        }
                      >
                        <span className="bot-history__badgeDot" />
                        {side === 'buy' ? 'شراء' : side === 'sell' ? 'بيع' : '—'}
                      </span>
                    </td>

                    <td className="bot-history__mono">{String(qty)}</td>
                    <td className="bot-history__mono">{String(price)}</td>

                    <td className={`bot-history__mono ${pnlCls}`}>
                      {(pnl >= 0 ? '+' : '-') + Math.abs(pnl).toFixed(2)}
                    </td>

                    <td className="bot-history__mono">{timeLabel}</td>

                    <td>
                      <span className={`bot-history__badge ${statusCfg.className}`}>
                        <span className="bot-history__badgeDot" />
                        {statusCfg.label}
                      </span>
                    </td>

                    <td className="bot-history__reason">{String(reason)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function getStatusConfig(status) {
  const s = (status || '').toString().toLowerCase();
  if (s.includes('active') || s.includes('filled') || s.includes('done')) return { label: 'منفذ', className: 'is-active' };
  if (s.includes('paused') || s.includes('pending')) return { label: 'معلق', className: 'is-paused' };
  if (s.includes('stop') || s.includes('cancel')) return { label: 'ملغي', className: 'is-stopped' };
  if (s.includes('error') || s.includes('fail') || s.includes('reject')) return { label: 'خطأ', className: 'is-error' };
  return { label: 'غير معروف', className: 'is-unknown' };
}

function formatDate(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return `${d.toLocaleDateString('ar-SA')} · ${d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return String(value);
  }
}
