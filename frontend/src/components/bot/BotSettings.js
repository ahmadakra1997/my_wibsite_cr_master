// frontend/src/components/bot/BotSettings.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './BotSettings.css';
import {
  getBotSettings,
  updateBotSettings,
  resetBotSettings,
  testBotConnection,
  getTradingPairs,
  getTradingStrategies,
} from '../../services/api';

const safeArray = (v) => (Array.isArray(v) ? v : []);
const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const unwrap = (res) => {
  // يدعم شكل {success,data,message} أو data مباشر
  if (res && typeof res === 'object' && 'success' in res) return res.success ? res.data : null;
  return res;
};

const normalizeSettings = (raw) => {
  const s = raw && typeof raw === 'object' ? raw : {};

  return {
    general: {
      botName: s?.general?.botName ?? 'Trading Bot',
      exchange: s?.general?.exchange ?? 'binance',
      mode: s?.general?.mode ?? 'paper', // paper | live
      baseCurrency: s?.general?.baseCurrency ?? 'USDT',
      maxActivePairs: toNum(s?.general?.maxActivePairs ?? 5, 5),
      strategy: s?.general?.strategy ?? 'default',
      enabledPairs: safeArray(s?.general?.enabledPairs),
    },

    trading: {
      riskPerTrade: toNum(s?.trading?.riskPerTrade ?? 1, 1), // %
      maxPositions: toNum(s?.trading?.maxPositions ?? 3, 3),
      leverage: toNum(s?.trading?.leverage ?? 1, 1),
      takeProfit: toNum(s?.trading?.takeProfit ?? 1.5, 1.5), // %
      stopLoss: toNum(s?.trading?.stopLoss ?? 1.0, 1.0), // %
      trailingStop: !!s?.trading?.trailingStop,
      trailingPercent: toNum(s?.trading?.trailingPercent ?? 0.6, 0.6),
      allowShort: !!s?.trading?.allowShort,
    },

    technical: {
      rsiPeriod: toNum(s?.technical?.rsiPeriod ?? 14, 14),
      macdFast: toNum(s?.technical?.macdFast ?? 12, 12),
      macdSlow: toNum(s?.technical?.macdSlow ?? 26, 26),
      macdSignal: toNum(s?.technical?.macdSignal ?? 9, 9),
      bollingerPeriod: toNum(s?.technical?.bollingerPeriod ?? 20, 20),
      bollingerStd: toNum(s?.technical?.bollingerStd ?? 2, 2),
      useVolume: !!s?.technical?.useVolume,
      useSupportResistance: !!s?.technical?.useSupportResistance,
    },

    notifications: {
      emailAlerts: !!s?.notifications?.emailAlerts,
      pushNotifications: !!s?.notifications?.pushNotifications,
      tradeExecuted: !!s?.notifications?.tradeExecuted,
      tradeClosed: !!s?.notifications?.tradeClosed,
      stopLossHit: !!s?.notifications?.stopLossHit,
      takeProfitHit: !!s?.notifications?.takeProfitHit,
      errorAlerts: !!s?.notifications?.errorAlerts,
    },
  };
};

function Badge({ tone = 'info', children }) {
  return <span className={`botSettings__badge botSettings__badge--${tone}`}>{children}</span>;
}

function Switch({ checked, onChange, label, hint }) {
  return (
    <label className="botSettings__switchRow">
      <span className="botSettings__switchText">
        <span className="botSettings__switchLabel">{label}</span>
        {hint ? <span className="botSettings__switchHint">{hint}</span> : null}
      </span>
      <span className="botSettings__switch">
        <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="botSettings__switchTrack" aria-hidden="true" />
      </span>
    </label>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="botSettings__field">
      <div className="botSettings__fieldHead">
        <div className="botSettings__fieldLabel">{label}</div>
        {hint ? <div className="botSettings__fieldHint">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

export default function BotSettings() {
  const [activeTab, setActiveTab] = useState('general');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pairs, setPairs] = useState([]);
  const [strategies, setStrategies] = useState([]);

  const [settings, setSettings] = useState(normalizeSettings(null));
  const [message, setMessage] = useState(null); // {type, text}
  const fileRef = useRef(null);

  const tabMeta = useMemo(
    () => [
      { key: 'general', label: 'عام', icon: '⚙️' },
      { key: 'trading', label: 'التداول', icon: '📈' },
      { key: 'technical', label: 'تقني', icon: '🧠' },
      { key: 'notifications', label: 'الإشعارات', icon: '🔔' },
    ],
    [],
  );

  const showMsg = (type, text) => setMessage({ type, text });

  const loadAll = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const [sRes, pRes, stRes] = await Promise.allSettled([
        getBotSettings(),
        getTradingPairs(),
        getTradingStrategies(),
      ]);

      const s = sRes.status === 'fulfilled' ? unwrap(sRes.value) : null;
      const p = pRes.status === 'fulfilled' ? unwrap(pRes.value) : null;
      const st = stRes.status === 'fulfilled' ? unwrap(stRes.value) : null;

      setSettings(normalizeSettings(s));
      setPairs(safeArray(p?.pairs || p?.items || p));
      setStrategies(safeArray(st?.strategies || st?.items || st));
    } catch (e) {
      console.error('[BotSettings] loadAll error:', e);
      showMsg('error', e?.message || 'فشل تحميل إعدادات البوت');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...(prev?.[section] || {}), [key]: value },
    }));
  };

  const togglePair = (pair) => {
    setSettings((prev) => {
      const current = safeArray(prev?.general?.enabledPairs);
      const exists = current.includes(pair);
      const next = exists ? current.filter((x) => x !== pair) : [...current, pair];
      return {
        ...prev,
        general: { ...(prev.general || {}), enabledPairs: next.slice(0, toNum(prev?.general?.maxActivePairs ?? 99, 99)) },
      };
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = normalizeSettings(settings);
      const res = await updateBotSettings(payload);
      const ok = res && typeof res === 'object' && 'success' in res ? !!res.success : true;
      if (!ok) throw new Error(res?.message || 'تعذّر حفظ الإعدادات');

      showMsg('success', 'تم حفظ إعدادات البوت بنجاح ✅');
      await loadAll();
    } catch (e) {
      console.error('[BotSettings] save error:', e);
      showMsg('error', e?.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('هل تريد إعادة ضبط إعدادات البوت؟')) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await resetBotSettings();
      const ok = res && typeof res === 'object' && 'success' in res ? !!res.success : true;
      if (!ok) throw new Error(res?.message || 'تعذّر إعادة الضبط');
      showMsg('success', 'تمت إعادة الضبط ✅');
      await loadAll();
    } catch (e) {
      showMsg('error', e?.message || 'فشل إعادة الضبط');
    } finally {
      setSaving(false);
    }
  };

  const testConn = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await testBotConnection();
      const ok = res && typeof res === 'object' && 'success' in res ? !!res.success : true;
      if (!ok) throw new Error(res?.message || 'فشل اختبار الاتصال');
      showMsg('success', 'الاتصال بالمنصّة يعمل ✅');
    } catch (e) {
      showMsg('error', e?.message || 'فشل اختبار الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bot-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setSettings(normalizeSettings(parsed));
      showMsg('success', 'تم استيراد الإعدادات (تذكير: اضغط حفظ لتطبيقها) ✅');
    } catch (e) {
      showMsg('error', 'ملف JSON غير صالح');
    }
  };

  if (loading) {
    return (
      <div className="botSettings">
        <div className="botSettings__skeletonTitle" />
        <div className="botSettings__skeletonRow" />
        <div className="botSettings__skeletonRow" />
        <div className="botSettings__skeletonRow" />
      </div>
    );
  }

  return (
    <div className="botSettings">
      <div className="botSettings__header">
        <div>
          <h2 className="botSettings__title">إعدادات البوت</h2>
          <div className="botSettings__sub">
            هوية تركوازي/أزرق/أخضر — تحسين تجربة التحكم دون تغيير منطق التداول.
            <span className="botSettings__subBadges">
              <Badge tone="info">{settings.general.exchange}</Badge>
              <Badge tone={settings.general.mode === 'live' ? 'danger' : 'success'}>
                {settings.general.mode === 'live' ? 'LIVE' : 'PAPER'}
              </Badge>
            </span>
          </div>
        </div>

        <div className="botSettings__actions">
          <button className="botSettings__btn botSettings__btn--ghost" onClick={testConn} disabled={saving}>
            🔌 اختبار الاتصال
          </button>

          <button className="botSettings__btn botSettings__btn--ghost" onClick={exportJson}>
            ⬇️ تصدير
          </button>

          <button
            className="botSettings__btn botSettings__btn--ghost"
            onClick={() => fileRef.current?.click()}
          >
            ⬆️ استيراد
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = '';
            }}
          />

          <button className="botSettings__btn botSettings__btn--primary" onClick={save} disabled={saving}>
            {saving ? 'جاري الحفظ…' : '💾 حفظ الإعدادات'}
          </button>

          <button className="botSettings__btn botSettings__btn--danger" onClick={reset} disabled={saving}>
            ♻️ إعادة ضبط
          </button>
        </div>
      </div>

      {message ? (
        <div className={`botSettings__msg botSettings__msg--${message.type}`}>
          <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
          <div className="botSettings__msgText">{message.text}</div>
          <button className="botSettings__msgClose" onClick={() => setMessage(null)} aria-label="close">
            ✕
          </button>
        </div>
      ) : null}

      <div className="botSettings__tabs">
        {tabMeta.map((t) => (
          <button
            key={t.key}
            className={`botSettings__tab ${activeTab === t.key ? 'is-active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            <span className="botSettings__tabIcon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===================== GENERAL ===================== */}
      {activeTab === 'general' ? (
        <div className="botSettings__panel">
          <div className="botSettings__grid2">
            <Field label="اسم البوت" hint="اسم يظهر للمستخدم في لوحة التحكم">
              <input
                className="botSettings__input"
                value={settings.general.botName}
                onChange={(e) => patch('general', 'botName', e.target.value)}
              />
            </Field>

            <Field label="المنصّة (Exchange)" hint="تُستخدم لعرض الاسم — لا نغيّر منطق التنفيذ">
              <select
                className="botSettings__input"
                value={settings.general.exchange}
                onChange={(e) => patch('general', 'exchange', e.target.value)}
              >
                <option value="binance">Binance</option>
                <option value="bybit">Bybit</option>
                <option value="okx">OKX</option>
                <option value="kucoin">KuCoin</option>
                <option value="gateio">Gate.io</option>
              </select>
            </Field>

            <Field label="وضع التشغيل" hint="Paper للتجربة — Live للحقيقي">
              <select
                className="botSettings__input"
                value={settings.general.mode}
                onChange={(e) => patch('general', 'mode', e.target.value)}
              >
                <option value="paper">Paper (تجريبي)</option>
                <option value="live">Live (حقيقي)</option>
              </select>
            </Field>

            <Field label="عملة الأساس" hint="مثال: USDT / USD">
              <input
                className="botSettings__input"
                value={settings.general.baseCurrency}
                onChange={(e) => patch('general', 'baseCurrency', e.target.value.toUpperCase())}
              />
            </Field>

            <Field label="الحد الأقصى للأزواج النشطة" hint="يحد عدد الأزواج المختارة">
              <input
                className="botSettings__input"
                type="number"
                min={1}
                max={50}
                value={settings.general.maxActivePairs}
                onChange={(e) => patch('general', 'maxActivePairs', toNum(e.target.value, 1))}
              />
            </Field>

            <Field label="الاستراتيجية" hint="قائمة من الخادم إن توفرت">
              <select
                className="botSettings__input"
                value={settings.general.strategy}
                onChange={(e) => patch('general', 'strategy', e.target.value)}
              >
                <option value="default">Default</option>
                {strategies.map((s) => {
                  const id = s?.id ?? s?.key ?? s?.name ?? String(s);
                  const label = s?.name ?? s?.label ?? id;
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>

          <div className="botSettings__divider" />

          <div className="botSettings__sectionHead">
            <h3>الأزواج (Trading Pairs)</h3>
            <div className="botSettings__smallHint">
              اختر حتى <b>{settings.general.maxActivePairs}</b> أزواج
            </div>
          </div>

          <div className="botSettings__pairsGrid">
            {safeArray(pairs).length === 0 ? (
              <div className="botSettings__empty">لا توجد أزواج متاحة من الخادم حالياً.</div>
            ) : (
              safeArray(pairs).map((p) => {
                const pair = p?.symbol ?? p?.pair ?? p?.name ?? String(p);
                const checked = safeArray(settings.general.enabledPairs).includes(pair);
                const disabled =
                  !checked &&
                  safeArray(settings.general.enabledPairs).length >= toNum(settings.general.maxActivePairs, 5);

                return (
                  <button
                    type="button"
                    key={pair}
                    className={`botSettings__pair ${checked ? 'is-on' : ''} ${disabled ? 'is-disabled' : ''}`}
                    onClick={() => !disabled && togglePair(pair)}
                  >
                    <span className="botSettings__pairDot" />
                    <span className="botSettings__pairText">{pair}</span>
                    <span className="botSettings__pairState">{checked ? '✓' : '+'}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {/* ===================== TRADING ===================== */}
      {activeTab === 'trading' ? (
        <div className="botSettings__panel">
          <div className="botSettings__grid2">
            <Field label="مخاطرة لكل صفقة (%)" hint="مثال: 1 يعني 1%">
              <input
                className="botSettings__input"
                type="number"
                step="0.1"
                min={0.1}
                max={20}
                value={settings.trading.riskPerTrade}
                onChange={(e) => patch('trading', 'riskPerTrade', toNum(e.target.value, 1))}
              />
            </Field>

            <Field label="أقصى عدد صفقات مفتوحة" hint="يقيّد التكدّس">
              <input
                className="botSettings__input"
                type="number"
                min={1}
                max={50}
                value={settings.trading.maxPositions}
                onChange={(e) => patch('trading', 'maxPositions', toNum(e.target.value, 3))}
              />
            </Field>

            <Field label="Leverage" hint="عرض فقط إن لم يدعم الخادم">
              <input
                className="botSettings__input"
                type="number"
                min={1}
                max={125}
                value={settings.trading.leverage}
                onChange={(e) => patch('trading', 'leverage', toNum(e.target.value, 1))}
              />
            </Field>

            <Field label="Take Profit (%)" hint="هدف الربح">
              <input
                className="botSettings__input"
                type="number"
                step="0.1"
                min={0.1}
                max={100}
                value={settings.trading.takeProfit}
                onChange={(e) => patch('trading', 'takeProfit', toNum(e.target.value, 1.5))}
              />
            </Field>

            <Field label="Stop Loss (%)" hint="إيقاف الخسارة">
              <input
                className="botSettings__input"
                type="number"
                step="0.1"
                min={0.1}
                max={100}
                value={settings.trading.stopLoss}
                onChange={(e) => patch('trading', 'stopLoss', toNum(e.target.value, 1.0))}
              />
            </Field>

            <Field label="Trailing Stop (%)" hint="يعمل إذا كان Trailing مفعّل">
              <input
                className="botSettings__input"
                type="number"
                step="0.1"
                min={0.1}
                max={20}
                value={settings.trading.trailingPercent}
                onChange={(e) => patch('trading', 'trailingPercent', toNum(e.target.value, 0.6))}
              />
            </Field>
          </div>

          <div className="botSettings__grid2">
            <Switch
              checked={settings.trading.trailingStop}
              onChange={(v) => patch('trading', 'trailingStop', v)}
              label="تفعيل Trailing Stop"
              hint="تحسين حماية الأرباح"
            />
            <Switch
              checked={settings.trading.allowShort}
              onChange={(v) => patch('trading', 'allowShort', v)}
              label="السماح بالـ Short"
              hint="يطبق فقط إذا الخادم يدعم"
            />
          </div>

          <div className="botSettings__note">
            تلميح: لا تغيّر منطق التداول — نحن فقط نحسّن واجهة التحكم والتناسق البصري.
          </div>
        </div>
      ) : null}

      {/* ===================== TECHNICAL ===================== */}
      {activeTab === 'technical' ? (
        <div className="botSettings__panel">
          <div className="botSettings__grid2">
            <Field label="فترة RSI" hint="قيمة شائعة: 14">
              <input
                className="botSettings__input"
                type="number"
                min={2}
                max={200}
                value={settings.technical.rsiPeriod}
                onChange={(e) => patch('technical', 'rsiPeriod', toNum(e.target.value, 14))}
              />
            </Field>

            <Field label="MACD Fast" hint="قيمة شائعة: 12">
              <input
                className="botSettings__input"
                type="number"
                min={2}
                max={200}
                value={settings.technical.macdFast}
                onChange={(e) => patch('technical', 'macdFast', toNum(e.target.value, 12))}
              />
            </Field>

            <Field label="MACD Slow" hint="قيمة شائعة: 26">
              <input
                className="botSettings__input"
                type="number"
                min={2}
                max={200}
                value={settings.technical.macdSlow}
                onChange={(e) => patch('technical', 'macdSlow', toNum(e.target.value, 26))}
              />
            </Field>

            <Field label="MACD Signal" hint="قيمة شائعة: 9">
              <input
                className="botSettings__input"
                type="number"
                min={2}
                max={200}
                value={settings.technical.macdSignal}
                onChange={(e) => patch('technical', 'macdSignal', toNum(e.target.value, 9))}
              />
            </Field>

            <Field label="Bollinger Period" hint="قيمة شائعة: 20">
              <input
                className="botSettings__input"
                type="number"
                min={2}
                max={200}
                value={settings.technical.bollingerPeriod}
                onChange={(e) => patch('technical', 'bollingerPeriod', toNum(e.target.value, 20))}
              />
            </Field>

            <Field label="Bollinger Std" hint="قيمة شائعة: 2">
              <input
                className="botSettings__input"
                type="number"
                step="0.1"
                min={0.5}
                max={10}
                value={settings.technical.bollingerStd}
                onChange={(e) => patch('technical', 'bollingerStd', toNum(e.target.value, 2))}
              />
            </Field>
          </div>

          <div className="botSettings__grid2">
            <Switch
              checked={settings.technical.useVolume}
              onChange={(v) => patch('technical', 'useVolume', v)}
              label="استخدام الحجم (Volume)"
              hint="إشارة دعم للتأكيد"
            />
            <Switch
              checked={settings.technical.useSupportResistance}
              onChange={(v) => patch('technical', 'useSupportResistance', v)}
              label="الدعم والمقاومة"
              hint="تحسين فلترة الدخول"
            />
          </div>
        </div>
      ) : null}

      {/* ===================== NOTIFICATIONS ===================== */}
      {activeTab === 'notifications' ? (
        <div className="botSettings__panel">
          <div className="botSettings__sectionHead">
            <h3>قنوات الإشعارات</h3>
            <div className="botSettings__smallHint">تحسين UX فقط</div>
          </div>

          <div className="botSettings__grid2">
            <Switch
              checked={settings.notifications.emailAlerts}
              onChange={(v) => patch('notifications', 'emailAlerts', v)}
              label="إشعارات البريد الإلكتروني"
            />
            <Switch
              checked={settings.notifications.pushNotifications}
              onChange={(v) => patch('notifications', 'pushNotifications', v)}
              label="إشعارات منبثقة (Push)"
            />
          </div>

          <div className="botSettings__divider" />

          <div className="botSettings__sectionHead">
            <h3>أحداث التداول</h3>
          </div>

          <div className="botSettings__grid2">
            <Switch
              checked={settings.notifications.tradeExecuted}
              onChange={(v) => patch('notifications', 'tradeExecuted', v)}
              label="تنفيذ صفقة"
            />
            <Switch
              checked={settings.notifications.tradeClosed}
              onChange={(v) => patch('notifications', 'tradeClosed', v)}
              label="إغلاق صفقة"
            />
          </div>

          <div className="botSettings__divider" />

          <div className="botSettings__sectionHead">
            <h3>تنبيهات المخاطرة</h3>
          </div>

          <div className="botSettings__grid2">
            <Switch
              checked={settings.notifications.stopLossHit}
              onChange={(v) => patch('notifications', 'stopLossHit', v)}
              label="وصول لوقف الخسارة"
            />
            <Switch
              checked={settings.notifications.takeProfitHit}
              onChange={(v) => patch('notifications', 'takeProfitHit', v)}
              label="وصول لأخذ الربح"
            />
          </div>

          <div className="botSettings__grid2">
            <Switch
              checked={settings.notifications.errorAlerts}
              onChange={(v) => patch('notifications', 'errorAlerts', v)}
              label="تنبيهات الأخطاء"
              hint="مهم للتشخيص"
            />
          </div>
        </div>
      ) : null}

      <div className="botSettings__footerNote">
        حالة: <b>{saving ? 'جاري الحفظ…' : 'جاهز'}</b>
      </div>
    </div>
  );
}
