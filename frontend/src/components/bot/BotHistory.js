// frontend/src/components/bot/BotHistory.js
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBot } from '../../context/BotContext';

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

  const {
    botHistory = [],
    loadBotHistory,
    loading,
    error,
  } = useBot() || {};

  // جلب السجل عند فتح لوحة البوت
  useEffect(() => {
    if (typeof loadBotHistory === 'function') {
      loadBotHistory();
    }
  }, [loadBotHistory]);

  const entries = Array.isArray(botHistory) ? botHistory : [];

  const { totalBots, activeBots } = useMemo(() => {
    const total = entries.length;
    const active = entries.filter((item) => item?.status === 'active').length;
    return { totalBots: total, activeBots: active };
  }, [entries]);

  const isLoading = Boolean(loading) && entries.length === 0;

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 shadow-xl space-y-4">
      {/* العنوان والإحصاءات العامة */}
      <div className="flex items-center justify-between gap-4 mb-1">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span className="text-lg">📜</span>
            {t('bot.history.title', 'سجل البوتات السابقة')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              'bot.history.subtitle',
              'تابع أداء وأعمار البوتات السابقة، وراقب أسباب إيقافها لتحسين استراتيجيتك.',
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200">
            {t('bot.history.totalBots', 'إجمالي البوتات')}: {totalBots}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-600/70 text-emerald-200">
            {t('bot.history.activeBots', 'البوتات النشطة سابقاً')}: {activeBots}
          </span>
        </div>
      </div>

      {/* حالة التحميل */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-slate-300 text-sm">
          <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin ml-2" />
          {t('bot.history.loading', 'جاري تحميل سجل البوت...')}
        </div>
      )}

      {/* لا توجد بيانات */}
      {!isLoading && entries.length === 0 && !error && (
        <div className="py-6 text-center text-xs text-slate-400">
          {t(
            'bot.history.empty',
            'لا يوجد سجل بعد – سيتم إنشاء سجل جديد عند تشغيل أول بوت تداول.',
          )}
        </div>
      )}

      {/* رسالة الخطأ */}
      {error && (
        <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-700/60 rounded-lg px-3 py-2">
          <strong className="mr-1">
            {t('bot.history.errorTitle', 'تعذر تحميل السجل:')}
          </strong>
          {String(error)}
        </div>
      )}

      {/* جدول السجل */}
      {entries.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="min-w-full text-xs text-slate-200">
            <thead className="bg-slate-900/90">
              <tr className="text-slate-400">
                <Th>{t('bot.history.botName', 'اسم البوت')}</Th>
                <Th>{t('bot.history.status', 'الحالة')}</Th>
                <Th>{t('bot.history.totalProfit', 'الربح الكلي')}</Th>
                <Th>{t('bot.history.totalTrades', 'عدد الصفقات')}</Th>
                <Th>{t('bot.history.runtime', 'مدة التشغيل')}</Th>
                <Th>{t('bot.history.createdAt', 'تاريخ الإنشاء')}</Th>
                <Th>{t('bot.history.reason', 'سبب الإيقاف')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {entries.map((entry) => (
                <HistoryRow
                  key={entry.botId || entry.created || Math.random()}
                  entry={entry}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Th = ({ children }) => (
  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">
    {children}
  </th>
);

const HistoryRow = ({ entry }) => {
  const {
    botId,
    botName,
    status,
    totalProfit,
    totalTrades,
    totalRuntime,
    created,
    deactivated,
    reason,
  } = entry || {};

  const statusConfig = getStatusConfig(status);
  const profitNumber = formatNumber(totalProfit, 2);
  const runtimeLabel = formatRuntime(totalRuntime);
  const createdLabel = formatDate(created);
  const reasonText = reason || (deactivated ? 'تم الإيقاف' : '—');

  return (
    <tr className="hover:bg-slate-900/70 transition-colors">
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-100">
            {botName || botId || '—'}
          </span>
          {botId && (
            <span className="text-[0.65rem] text-slate-500 mt-0.5">
              ID: {botId}
            </span>
          )}
        </div>
      </td>

      <td className="px-3 py-2 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold ${statusConfig.bg} ${statusConfig.text}`}
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
          {statusConfig.label}
        </span>
      </td>

      <td className="px-3 py-2 whitespace-nowrap">
        <span
          className={
            profitNumber > 0
              ? 'text-emerald-300'
              : profitNumber < 0
                ? 'text-rose-300'
                : 'text-slate-200'
          }
        >
          {profitNumber.toFixed(2)} USDT
        </span>
      </td>

      <td className="px-3 py-2 whitespace-nowrap">
        {Number.isFinite(Number(totalTrades)) ? totalTrades : '—'}
      </td>

      <td className="px-3 py-2 whitespace-nowrap">{runtimeLabel}</td>

      <td className="px-3 py-2 whitespace-nowrap">{createdLabel}</td>

      <td className="px-3 py-2 max-w-xs">
        <span className="text-[0.72rem] text-slate-300">
          {reasonText}
        </span>
      </td>
    </tr>
  );
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'active':
      return {
        label: 'نشط',
        bg: 'bg-emerald-900/60',
        text: 'text-emerald-300',
      };
    case 'stopped':
    case 'deactivated':
      return {
        label: 'متوقف',
        bg: 'bg-slate-900/60',
        text: 'text-slate-300',
      };
    case 'error':
      return {
        label: 'خطأ',
        bg: 'bg-rose-900/60',
        text: 'text-rose-300',
      };
    default:
      return {
        label: 'غير معروف',
        bg: 'bg-slate-900/60',
        text: 'text-slate-300',
      };
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
    return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return String(value);
  }
};

export default BotHistory;
