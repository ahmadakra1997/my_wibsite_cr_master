// frontend/src/components/common/EmptyState.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * EmptyState
 * مكوّن عام لعرض حالة عدم وجود بيانات في القسم (مراكز، إشارات، أداء...).
 *
 * props:
 * - type: نوع الحالة (positions, bot, analytics, generic...)
 * - message: رسالة رئيسية
 * - description?: وصف إضافي صغير
 * - actionText?: نص زر الإجراء
 * - onAction?: دالة تُستدعى عند الضغط على زر الإجراء
 */
const EmptyState = ({
  type = 'generic',
  message,
  description,
  actionText,
  onAction,
}) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'positions':
        return '📉';
      case 'bot':
        return '🤖';
      case 'analytics':
        return '📊';
      case 'orders':
        return '📑';
      default:
        return '✨';
    }
  };

  const defaultMessage =
    message ||
    (type === 'positions'
      ? t('positions.empty', 'لا توجد مراكز حالياً.')
      : t('common.noData', 'لا توجد بيانات للعرض حالياً.'));

  const defaultDescription =
    description ||
    (type === 'positions'
      ? t(
          'positions.emptyHint',
          'قم بفتح أول صفقة لتبدأ متابعة أداء محفظتك هنا.',
        )
      : t(
          'common.noDataHint',
          'حاول تغيير الإعدادات أو العودة لاحقاً بعد توفر بيانات جديدة.',
        ));

  return (
    <div
      className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-inner shadow-slate-950/80"
      data-testid={`empty-state-${type}`}
    >
      {/* الأيقونة */}
      <div className="mb-3 text-4xl">{getIcon()}</div>

      {/* الرسالة الرئيسية */}
      <h3 className="text-sm font-semibold text-slate-100 mb-1">
        {defaultMessage}
      </h3>

      {/* الوصف */}
      <p className="text-xs text-slate-400 max-w-xs mb-4">
        {defaultDescription}
      </p>

      {/* زر الإجراء (اختياري) */}
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-lg hover:shadow-cyan-500/40 transition"
        >
          <span className="ml-1">⚡</span>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
