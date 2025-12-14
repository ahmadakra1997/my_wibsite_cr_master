// frontend/src/components/bot/BotHistory.js
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBot } from '../../context/BotContext';
import './BotHistory.css';

/**
 * BotHistory
 * جدول سجل البوتات:
 * - تاريخ إنشاء كل بوت
 * - مدة التشغيل
 * - الربح الكلي وعدد الصفقات
 * - الحالة وسبب الإيقاف
 *
 * يعتمد على BotContext:
 * - botHistory
 * - loadBotHistory()
 * - loading, error
 */
const BotHistory = () => {
  const { t } = useTranslation();

  const { botHistory = [], loadBotHistory, loading, error } = useBot() || {};

  useEffect(() => {
    if (typeof loadBotHistory === 'function') loadBotHistory();
  }, [loadBotHistory]);

  const entries = Array.isArray(botHistory) ? botHistory : [];

  const { totalBots, activeBots } = useMemo(() => {
    const total = entries.length;
    const active = entries.filter((item) => item?.status === 'active').length;
    return { totalBots: total, activeBots: active };
  }, [entries]);

  const isLoading = Boolean(loading) && entries.length === 0;

  return (
    <section className="bot-history">
      {/* Header */}
      <header className="bot-history__header">
        <div>
          <h2 className="bot-history__title">
            {t('bot.history.title', 'سجل البوتات السابقة')}
          </h2>
          <p className="bot-history__subtitle">
            {t(
              'bot.history.subtitle',
              'تابع أداء وأعمار البوتات السابقة، وراقب أسباب إيقافها لتحسين استراتيجيتك.',
            )}
          </p>
        </div>

        <div className="bot-history__stats">
          <StatChip
            label={t('bot.history.totalBots', 'إجمالي البوتات')}
            value={totalBots}
            tone="info"
          />
          <StatChip
            label={t('bot.history.activeBots', 'البوتات النشطة سابقاً')}
            value={activeBots}
            tone="success"
          />
        </div>
      </header>

      {/* Loading */}
      {isLoading && (
        <div className="bot-history__state">
          <span className="bot-history__spinner" />
          <span>{t('bot.history.loading', 'جاري تحميل سجل البوت...')}</span>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="bot-history__error">
          <strong>{t('bot.history.errorTitle', 'تعذر تحميل السجل:')}</strong>
          <span>{String(error)}</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && entries.length === 0 && (
        <div className="bot-history__empty">
          <div className="bot-history__emptyIcon">🗂️</div>
          <div className="bot-history__emptyTitle">
            {t('bot.history.emptyTitle', 'لا يوجد سجل بعد')}
          </div>
          <div className="bot-history__emptyText">
            {t(
              'bot.history.empty',
              'سيتم إنشاء سجل جديد عند تشغيل أول بوت تداول.',
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && entries.length > 0 && (
        <div className="bot-history__tableWrap">
          <table className="bot-history__table">
            <thead>
              <tr>
                <Th>{t('bot.history.botName', 'اسم البوت')}</Th>
                <Th>{t('bot.history.status', 'الحالة')}</Th>
                <Th align="right">{t('bot.history.totalProfit', 'الربح الكلي')}</Th>
                <Th align="right">{t('bot.history.totalTrades', 'عدد الصفقات')}</Th>
                <Th>{t('bot.history.runtime', 'مدة التشغيل')}</Th>
                <Th>{t('bot.history.createdAt', 'تاريخ الإنشاء')}</Th>
                <Th>{t('bot.history.reason', 'سبب الإيقاف')}</Th>
              </tr>
            </thead>

            <tbody>
              {entries.map((entry, idx) => (
                <HistoryRow key={entry?.botId || entry?._id || idx} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const StatChip = ({ label, value, tone }) => (
  <div className={`bot-history__chip ${tone ? `is-${tone}` : ''}`}>
    <div className="bot-history__chipLabel">{label}</div>
    <div className="bot-history__chipValue">{value}</div>
  </div>
);

const Th = ({ children, align }) => (
  <th style={{ textAlign: align || 'left' }}>{children}</th>
);

const HistoryRow = ({ entry }) => {
  const {
    botId,
    _id,
    id,
    botName,
    status,
    totalProfit,
    totalTrades,
    totalRuntime,
    created,
    createdAt,
    deactivated,
    reason,
  } = entry || {};

  const resolvedId = botId || _id || id || null;

  const statusConfig = getStatusConfig(status);
  const profitNumber = formatNumber(totalProfit, 2);
  const runtimeLabel = formatRuntime(totalRuntime);
  const createdLabel = formatDate(created || createdAt);
  const reasonText = reason || (deactivated ? 'تم الإيقاف' : '—');

  const profitTone =
    profitNumber > 0 ? 'is-profit' : profitNumber < 0 ? 'is-loss' : '';

  return (
    <tr className="bot-history__row">
      <td>
        <div className="bot-history__name">
          <div className="bot-history__nameMain">{botName || '—'}</div>
          {resolvedId && <div className="bot-history__nameSub">ID: {resolvedId}</div>}
        </div>
      </td>

      <td>
        <span className={`bot-history__badge ${statusConfig.className}`}>
          <span className="bot-history__badgeDot" />
          {statusConfig.label}
        </span>
      </td>

      <td className={`bot-history__mono ${profitTone}`} style={{ textAlign: 'right' }}>
        {profitNumber.toFixed(2)} USDT
      </td>

      <td className="bot-history__mono" style={{ textAlign: 'right' }}>
        {Number.isFinite(Number(totalTrades)) ? totalTrades : '—'}
      </td>

      <td>{runtimeLabel}</td>
      <td>{createdLabel}</td>
      <td className="bot-history__reason">{reasonText}</td>
    </tr>
  );
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'active':
      return { label: 'نشط', className: 'is-active' };
    case 'running':
      return { label: 'يعمل', className: 'is-active' };
    case 'paused':
      return { label: 'متوقف مؤقتًا', className: 'is-paused' };
    case 'stopped':
    case 'deactivated':
      return { label: 'متوقف', className: 'is-stopped' };
    case 'error':
      return { label: 'خطأ', className: 'is-error' };
    default:
      return { label: 'غير معروف', className: 'is-unknown' };
  }
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

const formatRuntime = (seconds) => {
  const total = Number(seconds) || 0;
  if (total <= 0) return '—';

  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);

  const parts = [];
  if (days) parts.push(`${days} يوم`);
  if (hours) parts.push(`${hours} ساعة`);
  if (mins) parts.push(`${mins} دقيقة`);

  return parts.join(' ') || 'أقل من دقيقة';
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return `${d.toLocaleDateString('ar-SA')} · ${d.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return String(value);
  }
};

export default BotHistory;
