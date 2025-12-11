// frontend/src/components/trading/AISignals.jsx

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * AISignals
 * لوحة عرض إشارات الذكاء الاصطناعي (دخول / خروج / مراقبة).
 *
 * props (اختيارية):
 * - signals: Array<{
 *     id,
 *     symbol,
 *     type,        // 'entry' | 'exit' | 'watch'
 *     direction,   // 'long' | 'short'
 *     confidence,  // 0 – 100
 *     timeframe,   // '1h' | '4h' ...
 *     strategy,    // اسم الإستراتيجية
 *     time         // Date | timestamp | string
 *   }>
 * - isLoading: boolean
 * - onSelectSignal: fn(signal)
 */
const AISignals = ({ signals = [], isLoading = false, onSelectSignal }) => {
  const { t } = useTranslation();

  const hasSignals = Array.isArray(signals) && signals.length > 0;

  const sortedSignals = useMemo(() => {
    if (!hasSignals) return [];
    return [...signals].sort(
      (a, b) => (b.confidence || 0) - (a.confidence || 0),
    );
  }, [signals, hasSignals]);

  const handleSelect = (signal) => {
    if (onSelectSignal) {
      onSelectSignal(signal);
    }
  };

  return (
    <div
      className="space-y-3"
      style={{ direction: 'rtl' }}
      data-testid="ai-signals-panel"
    >
      {/* رأس اللوحة */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span className="text-lg">🧠</span>
            {t('trading.aiSignals.title', 'إشارات الذكاء الاصطناعي')}
          </h2>
          <p className="text-[0.75rem] text-slate-400 mt-0.5">
            {t(
              'trading.aiSignals.subtitle',
              'رصد فرص الدخول والخروج اعتماداً على خوارزميات تحليل السوق.',
            )}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-[0.7rem]">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-emerald-500/60 px-2 py-0.5 text-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            {t('trading.aiSignals.status', 'الوحدة التجريبية مفعّلة')}
          </span>
          {hasSignals && (
            <span className="text-slate-400">
              {t('trading.aiSignals.count', 'عدد الإشارات الحالية')}:{' '}
              <span className="text-slate-100 font-semibold">
                {sortedSignals.length}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* حالة التحميل */}
      {isLoading && (
        <div className="flex items-center justify-center py-6 text-xs text-slate-300">
          <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin ml-2" />
          {t('trading.aiSignals.loading', 'جاري تحليل السوق وإعداد الإشارات...')}
        </div>
      )}

      {/* لا توجد بيانات */}
      {!isLoading && !hasSignals && (
        <div className="rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-4 text-center space-y-2">
          <div className="text-3xl mb-1">✨</div>
          <p className="text-xs text-slate-200">
            {t(
              'trading.aiSignals.empty',
              'سيتم قريباً تفعيل نظام إشارات ذكاء اصطناعي متقدم، لاقتراح صفقات دخول وخروج وفق استراتيجيات مدروسة.',
            )}
          </p>
          <ul className="text-[0.7rem] text-slate-400 space-y-1 text-right max-w-md mx-auto">
            <li>• {t('trading.aiSignals.benefit1', 'تحليل تلقائي لعشرات الأزواج السوقية في نفس الوقت.')}</li>
            <li>• {t('trading.aiSignals.benefit2', 'تقييم قوة الإشارة بناءً على السيولة والتذبذب والتوقيت.')}</li>
            <li>• {t('trading.aiSignals.benefit3', 'دمج الإشارات مع إدارة مخاطرك الحالية في المنصة.')}</li>
          </ul>
        </div>
      )}

      {/* قائمة الإشارات */}
      {hasSignals && (
        <div className="space-y-1.5">
          {sortedSignals.map((signal) => (
            <SignalRow
              key={signal.id || `${signal.symbol}-${signal.time}-${signal.type}`}
              signal={signal}
              onClick={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SignalRow = ({ signal, onClick }) => {
  const { t } = useTranslation();

  const {
    symbol,
    type,
    direction,
    confidence,
    timeframe,
    strategy,
    time,
  } = signal;

  const isEntry = type === 'entry';
  const isExit = type === 'exit';

  const isLong = direction === 'long';
  const isShort = direction === 'short';

  const labelType = isEntry
    ? t('trading.aiSignals.type.entry', 'دخول')
    : isExit
      ? t('trading.aiSignals.type.exit', 'خروج')
      : t('trading.aiSignals.type.watch', 'مراقبة');

  const typeColor = isEntry
    ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-200'
    : isExit
      ? 'bg-rose-500/15 border-rose-400/60 text-rose-200'
      : 'bg-sky-500/10 border-sky-400/60 text-sky-200';

  const dirColor = isLong
    ? 'text-emerald-300'
    : isShort
      ? 'text-rose-300'
      : 'text-slate-200';

  const conf = Number(confidence) || 0;
  const isStrong = conf >= 80;

  const formattedTime = (() => {
    if (!time) return '—';
    try {
      const d = time instanceof Date ? time : new Date(time);
      return d.toLocaleString();
    } catch {
      return String(time);
    }
  })();

  const handleClick = () => {
    if (onClick) {
      onClick(signal);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-right rounded-xl border border-slate-700/80 bg-slate-950/80 hover:bg-slate-900/90 transition shadow-sm shadow-slate-950/60 px-3 py-2.5 flex items-center justify-between gap-3"
    >
      {/* اليسار: الرمز / الإطار الزمني / الإستراتيجية */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-100">
            {symbol || '—'}
          </span>
          {timeframe && (
            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-600 text-slate-300">
              {timeframe}
            </span>
          )}
          <span
            className={`text-[0.65rem] px-2 py-0.5 rounded-full border ${typeColor}`}
          >
            {labelType}
          </span>
        </div>

        {strategy && (
          <div className="text-[0.7rem] text-slate-400 truncate">
            {t('trading.aiSignals.strategy', 'الإستراتيجية')}: {strategy}
          </div>
        )}

        <div className="text-[0.7rem] text-slate-500">
          {formattedTime}
        </div>
      </div>

      {/* اليمين: الاتجاه والثقة */}
      <div className="flex flex-col items-end gap-1 text-[0.75rem]">
        <div className="flex items-center gap-1">
          {isLong && <span className="text-emerald-400 text-sm">⬆</span>}
          {isShort && <span className="text-rose-400 text-sm">⬇</span>}
          <span className={`font-semibold ${dirColor}`}>
            {isLong
              ? t('trading.aiSignals.direction.long', 'اتجاه: شراء')
              : isShort
                ? t('trading.aiSignals.direction.short', 'اتجاه: بيع')
                : t('trading.aiSignals.direction.neutral', 'اتجاه: محايد')}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[0.7rem] text-slate-300">
          <span className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
              style={{ width: `${Math.min(100, Math.max(conf, 0))}%` }}
            />
          </span>
          <span className="font-semibold">{conf.toFixed(0)}%</span>
        </div>

        {isStrong && (
          <div className="text-[0.65rem] text-emerald-300 bg-emerald-900/40 border border-emerald-500/50 rounded-full px-2 py-0.5">
            {t('trading.aiSignals.strong', 'إشارة قوية')}
          </div>
        )}
      </div>
    </button>
  );
};

export default AISignals;
