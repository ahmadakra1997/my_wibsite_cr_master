// frontend/src/components/bot/BotDashboard.js

import React, { useEffect } from 'react';
import { useBot } from '../../context/BotContext';
import BotActivation from './BotActivation';
import BotStatus from './BotStatus';
import BotPerformance from './BotPerformance';
import BotSettings from './BotSettings';
import BotHistory from './BotHistory';
import BotControls from './BotControls';

/**
 * BotDashboard
 * لوحة تحكم متكاملة للبوت بأسلوب Quantum AI Trader:
 * - رأس لوحة بهوية بصرية موحّدة مع /trading
 * - عمود تحكم + حالة
 * - عمود أداء + إعدادات + سجل
 */
const BotDashboard = () => {
  const {
    loadBotStatus,
    loadBotPerformance,
    loadBotHistory,
    hasActiveBot,
    loading,
    error,
  } = useBot();

  // تحميل بيانات البوت عند فتح اللوحة
  useEffect(() => {
    if (typeof loadBotStatus === 'function') loadBotStatus();
    if (typeof loadBotPerformance === 'function') loadBotPerformance();
    if (typeof loadBotHistory === 'function') loadBotHistory();
  }, [loadBotStatus, loadBotPerformance, loadBotHistory]);

  if (loading && !hasActiveBot) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400" />
        <span className="mr-3 text-slate-100">جاري تحميل بيانات البوت...</span>
      </div>
    );
  }

  return (
    <div
      className="bot-dashboard-page space-y-6"
      style={{ direction: 'rtl' }}
    >
      {/* رأس الصفحة بهوية Quantum AI Trader */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-5 shadow-2xl">
        <div className="absolute inset-y-0 left-0 w-40 opacity-40 pointer-events-none">
          <div className="h-full w-full bg-gradient-to-tr from-emerald-500/40 via-cyan-500/40 to-transparent blur-3xl" />
        </div>

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-slate-950/80 px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              <span className="text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-slate-100">
                Quantum AI Trader
              </span>
              <span className="text-[0.7rem] text-slate-300">
                نظام البوت التداولي المتقدّم
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
              🤖 لوحة تحكم البوت
              {hasActiveBot && (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/70 text-emerald-200">
                  البوت مفعل حالياً
                </span>
              )}
            </h1>

            <p className="text-sm text-slate-300 max-w-xl">
              راقب حالة البوت، تحكّم بالتفعيل، اطّلع على الأداء التجميعي وسجل
              الصفقات، وكل ذلك ضمن لوحة واحدة متكاملة.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs text-slate-200">
            <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              <span>وضع النظام: نشط</span>
            </div>
            <div className="inline-flex flex-wrap gap-2 justify-end">
              <span className="px-2 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
                إستراتيجيات متعددة
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
                إدارة مخاطر ذكية
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* رسائل الخطأ */}
      {error && (
        <div className="bg-rose-950/60 border border-rose-500/70 text-rose-100 px-4 py-3 rounded-xl text-sm">
          <strong className="mr-1">خطأ:</strong> {String(error)}
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الأيسر - التحكم والحالة */}
        <div className="lg:col-span-1 space-y-6">
          {!hasActiveBot ? (
            <BotActivation />
          ) : (
            <>
              <BotStatus />
              <BotControls />
            </>
          )}
        </div>

        {/* العمود الأيمن - الأداء والإعدادات وسجل البوت */}
        <div className="lg:col-span-2 space-y-6">
          {hasActiveBot && (
            <>
              <BotPerformance />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BotSettings />
                <BotHistory />
              </div>
            </>
          )}
        </div>
      </div>

      {/* معلومات إضافية عن كيفية عمل البوت بأسلوب بصري موحد */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-950/90 px-5 py-5 mt-2">
        <h3 className="text-sm font-semibold mb-4 text-slate-100">
          💡 كيف يعمل نظام البوت في Quantum AI Trader؟
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="text-center space-y-1.5">
            <div className="text-2xl mb-1">⚡</div>
            <h4 className="font-medium text-slate-100">تحليل السوق</h4>
            <p className="text-slate-400">
              يراقب البوت حركة الأسعار والسيولة باستمرار مستخدماً خوارزميات
              مبنية على بيانات حية.
            </p>
          </div>
          <div className="text-center space-y-1.5">
            <div className="text-2xl mb-1">📊</div>
            <h4 className="font-medium text-slate-100">اتخاذ القرار</h4>
            <p className="text-slate-400">
              ينفّذ قرارات الدخول والخروج وفقاً لاستراتيجيتك وقواعد إدارة رأس
              المال التي قمت بتحديدها.
            </p>
          </div>
          <div className="text-center space-y-1.5">
            <div className="text-2xl mb-1">🔄</div>
            <h4 className="font-medium text-slate-100">تنفيذ تلقائي</h4>
            <p className="text-slate-400">
              ينفّذ الصفقات تلقائياً على حساباتك المربوطة مع إمكانية الإيقاف
              اليدوي في أي وقت.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotDashboard;
