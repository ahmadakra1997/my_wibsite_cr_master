// frontend/src/components/bot/BotSettings.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getBotSettings,
  updateBotSettings,
  getTradingPairs,
  getTradingStrategies,
  resetBotSettings,
  testBotConnection,
} from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import './BotSettings.css';

const defaultSettings = {
  general: {
    botName: 'Trading Bot Pro',
    autoStart: false,
    riskLevel: 'medium',
    maxDailyTrades: 10,
    stopLoss: 2,
    takeProfit: 5,
    tradeAmount: 100,
  },
  trading: {
    strategy: 'mean-reversion',
    pairs: ['BTC/USD', 'ETH/USD', 'ADA/USD'],
    timeframe: '1h',
    maxOpenTrades: 3,
    trailingStop: false,
    hedgeMode: false,
    useMargin: false,
  },
  technical: {
    rsiPeriod: 14,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    bollingerPeriod: 20,
    bollingerStd: 2,
    useVolume: true,
    useSupportResistance: true,
  },
  notifications: {
    emailAlerts: true,
    pushNotifications: false,
    tradeExecuted: true,
    tradeClosed: true,
    stopLossHit: true,
    takeProfitHit: true,
    errorAlerts: true,
  },
};

const safeParse = (x) => {
  try {
    if (!x) return null;
    if (typeof x === 'object') return x;
    return JSON.parse(x);
  } catch {
    return null;
  }
};

const unwrap = (res) => {
  // يدعم شكل {success,data} أو data مباشرة
  if (res && typeof res === 'object' && 'success' in res) {
    return res.success ? res.data : null;
  }
  return res;
};

const BotSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [availablePairs, setAvailablePairs] = useState([]);
  const [availableStrategies, setAvailableStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [testResults, setTestResults] = useState(null);

  const { lastMessage } = useWebSocket('settings-updates');
  const msgTimerRef = useRef(null);

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    if (msgTimerRef.current) window.clearTimeout(msgTimerRef.current);
    msgTimerRef.current = window.setTimeout(() => setMessage({ text: '', type: '' }), 4500);
  }, []);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sRes, pRes, stRes] = await Promise.all([
        getBotSettings(),
        getTradingPairs(),
        getTradingStrategies(),
      ]);

      const s = unwrap(sRes);
      const pairs = unwrap(pRes);
      const strategies = unwrap(stRes);

      if (s) setSettings(s);
      if (Array.isArray(pairs)) setAvailablePairs(pairs);

      if (Array.isArray(strategies)) {
        // قد تكون array of strings أو objects
        setAvailableStrategies(
          strategies.map((x) =>
            typeof x === 'string' ? { id: x, name: x, value: x } : x,
          ),
        );
      }
    } catch (error) {
      console.error('[BotSettings] fetchInitialData error:', error);
      showMessage('فشل في تحميل الإعدادات', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // ✅ WebSocket: تحديثات تلقائية
  useEffect(() => {
    if (!lastMessage) return;
    const data = safeParse(lastMessage?.data ?? lastMessage);
    if (!data) return;

    if (data.type === 'settings_updated' && data.settings) {
      setSettings(data.settings);
      showMessage('تم تحديث الإعدادات تلقائياً', 'success');
    }
  }, [lastMessage, showMessage]);

  const handleSettingChange = (category, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
  };

  const handleArraySettingChange = (category, field, value, checked) => {
    setSettings((prev) => {
      const current = Array.isArray(prev?.[category]?.[field]) ? prev[category][field] : [];
      const next = checked ? [...new Set([...current, value])] : current.filter((x) => x !== value);
      return { ...prev, [category]: { ...prev[category], [field]: next } };
    });
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setTestResults(null);
    try {
      const res = await updateBotSettings(settings);
      const ok = res && typeof res === 'object' && 'success' in res ? res.success : true;
      if (ok) showMessage('✅ تم حفظ الإعدادات بنجاح', 'success');
      else throw new Error(res?.message || 'فشل في حفظ الإعدادات');
    } catch (error) {
      console.error('[BotSettings] saveSettings error:', error);
      showMessage(error?.message || 'فشل في حفظ الإعدادات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    const confirmed = window.confirm('⚠️ هل أنت متأكد من إعادة تعيين الإعدادات للقيم الافتراضية؟');
    if (!confirmed) return;

    setIsSaving(true);
    setTestResults(null);
    try {
      const res = await resetBotSettings();
      const data = unwrap(res);
      if (data) setSettings(data);
      showMessage('✅ تم إعادة تعيين الإعدادات', 'success');
    } catch (error) {
      console.error('[BotSettings] resetToDefaults error:', error);
      showMessage('فشل في إعادة التعيين', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsSaving(true);
    setTestResults(null);
    try {
      const res = await testBotConnection();
      setTestResults(res);
      const ok = res && typeof res === 'object' && 'success' in res ? res.success : true;
      showMessage(ok ? '✅ اختبار الاتصال ناجح' : '❌ فشل اختبار الاتصال', ok ? 'success' : 'error');
    } catch (error) {
      console.error('[BotSettings] testConnection error:', error);
      showMessage('❌ خطأ في اختبار الاتصال', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bot-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    showMessage('✅ تم تصدير الإعدادات', 'success');
  };

  const importSettings = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        setSettings(parsed);
        showMessage('✅ تم استيراد الإعدادات', 'success');
      } catch {
        showMessage('❌ ملف غير صالح', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const pairsToRender = useMemo(() => {
    if (availablePairs.length) return availablePairs;
    return defaultSettings.trading.pairs;
  }, [availablePairs]);

  if (isLoading) {
    return (
      <div className="bot-settings-container" dir="rtl">
        <div className="loading-container">
          <div className="spinner-large" />
          <p>جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bot-settings-container" dir="rtl">
      <div className="settings-header">
        <div className="settings-title">
          <h2>⚙️ الإعدادات المتقدمة للبوت</h2>
          <p>اضبط الاستراتيجية، المخاطر، المؤشرات، والإشعارات دون التأثير على منطق التداول.</p>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary" type="button" onClick={testConnection} disabled={isSaving}>
            اختبار الاتصال
          </button>
          <button className="btn btn-secondary" type="button" onClick={exportSettings}>
            تصدير
          </button>
          <label className="btn btn-secondary file-btn">
            استيراد
            <input type="file" accept="application/json" onChange={importSettings} hidden />
          </label>
        </div>
      </div>

      <div className="settings-tabs">
        <button className={`tab-button ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')} type="button">عام</button>
        <button className={`tab-button ${activeTab === 'trading' ? 'active' : ''}`} onClick={() => setActiveTab('trading')} type="button">تداول</button>
        <button className={`tab-button ${activeTab === 'technical' ? 'active' : ''}`} onClick={() => setActiveTab('technical')} type="button">تقني</button>
        <button className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')} type="button">إشعارات</button>
      </div>

      <div className="tab-content">
        {activeTab === 'general' && (
          <section className="settings-panel">
            <h3>الإعدادات العامة</h3>

            <div className="form-row">
              <label>اسم البوت</label>
              <input
                className="form-input"
                value={settings.general.botName}
                onChange={(e) => handleSettingChange('general', 'botName', e.target.value)}
              />
            </div>

            <div className="form-row inline">
              <label>بدء التشغيل التلقائي</label>
              <input
                type="checkbox"
                checked={!!settings.general.autoStart}
                onChange={(e) => handleSettingChange('general', 'autoStart', e.target.checked)}
              />
            </div>

            <div className="form-row">
              <label>مستوى المخاطرة</label>
              <select
                className="form-select"
                value={settings.general.riskLevel}
                onChange={(e) => handleSettingChange('general', 'riskLevel', e.target.value)}
              >
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">مرتفع</option>
              </select>
            </div>

            <div className="grid-2">
              <div className="form-row">
                <label>أقصى صفقات يومية</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="200"
                  value={settings.general.maxDailyTrades}
                  onChange={(e) => handleSettingChange('general', 'maxDailyTrades', parseInt(e.target.value || '0', 10))}
                />
              </div>

              <div className="form-row">
                <label>مبلغ التداول ($)</label>
                <input
                  className="form-input"
                  type="number"
                  min="10"
                  step="10"
                  value={settings.general.tradeAmount}
                  onChange={(e) => handleSettingChange('general', 'tradeAmount', parseFloat(e.target.value || '0'))}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-row">
                <label>وقف الخسارة (%)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={settings.general.stopLoss}
                  onChange={(e) => handleSettingChange('general', 'stopLoss', parseFloat(e.target.value || '0'))}
                />
              </div>

              <div className="form-row">
                <label>أخذ الربح (%)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={settings.general.takeProfit}
                  onChange={(e) => handleSettingChange('general', 'takeProfit', parseFloat(e.target.value || '0'))}
                />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'trading' && (
          <section className="settings-panel">
            <h3>إعدادات التداول</h3>

            <div className="grid-2">
              <div className="form-row">
                <label>الإستراتيجية</label>
                <select
                  className="form-select"
                  value={settings.trading.strategy}
                  onChange={(e) => handleSettingChange('trading', 'strategy', e.target.value)}
                >
                  {(availableStrategies.length ? availableStrategies : [{ name: settings.trading.strategy, value: settings.trading.strategy }]).map((s) => (
                    <option key={s.value || s.name} value={s.value || s.name}>
                      {s.name || s.value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>الإطار الزمني</label>
                <select
                  className="form-select"
                  value={settings.trading.timeframe}
                  onChange={(e) => handleSettingChange('trading', 'timeframe', e.target.value)}
                >
                  <option value="1m">1 دقيقة</option>
                  <option value="5m">5 دقائق</option>
                  <option value="15m">15 دقيقة</option>
                  <option value="1h">1 ساعة</option>
                  <option value="4h">4 ساعات</option>
                  <option value="1d">1 يوم</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <label>أقصى صفقات مفتوحة</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="20"
                value={settings.trading.maxOpenTrades}
                onChange={(e) => handleSettingChange('trading', 'maxOpenTrades', parseInt(e.target.value || '0', 10))}
              />
            </div>

            <div className="form-row">
              <label>أزواج التداول</label>
              <div className="checkbox-grid">
                {pairsToRender.map((pair) => {
                  const checked = settings.trading.pairs.includes(pair);
                  return (
                    <label className="check-item" key={pair}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => handleArraySettingChange('trading', 'pairs', pair, e.target.checked)}
                      />
                      <span>{pair}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid-3">
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.trading.trailingStop}
                  onChange={(e) => handleSettingChange('trading', 'trailingStop', e.target.checked)}
                />
                <span>وقف خسارة متابع</span>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.trading.hedgeMode}
                  onChange={(e) => handleSettingChange('trading', 'hedgeMode', e.target.checked)}
                />
                <span>وضع التحوط</span>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.trading.useMargin}
                  onChange={(e) => handleSettingChange('trading', 'useMargin', e.target.checked)}
                />
                <span>استخدام الهامش</span>
              </label>
            </div>
          </section>
        )}

        {activeTab === 'technical' && (
          <section className="settings-panel">
            <h3>الإعدادات التقنية</h3>

            <div className="grid-2">
              <div className="form-row">
                <label>فترة RSI</label>
                <input
                  className="form-input"
                  type="number"
                  min="5"
                  max="40"
                  value={settings.technical.rsiPeriod}
                  onChange={(e) => handleSettingChange('technical', 'rsiPeriod', parseInt(e.target.value || '0', 10))}
                />
              </div>

              <div className="form-row">
                <label>فترة بولينجر</label>
                <input
                  className="form-input"
                  type="number"
                  min="10"
                  max="40"
                  value={settings.technical.bollingerPeriod}
                  onChange={(e) => handleSettingChange('technical', 'bollingerPeriod', parseInt(e.target.value || '0', 10))}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-row">
                <label>MACD السريع</label>
                <input
                  className="form-input"
                  type="number"
                  min="5"
                  max="30"
                  value={settings.technical.macdFast}
                  onChange={(e) => handleSettingChange('technical', 'macdFast', parseInt(e.target.value || '0', 10))}
                />
              </div>

              <div className="form-row">
                <label>MACD البطيء</label>
                <input
                  className="form-input"
                  type="number"
                  min="10"
                  max="60"
                  value={settings.technical.macdSlow}
                  onChange={(e) => handleSettingChange('technical', 'macdSlow', parseInt(e.target.value || '0', 10))}
                />
              </div>

              <div className="form-row">
                <label>إشارة MACD</label>
                <input
                  className="form-input"
                  type="number"
                  min="5"
                  max="25"
                  value={settings.technical.macdSignal}
                  onChange={(e) => handleSettingChange('technical', 'macdSignal', parseInt(e.target.value || '0', 10))}
                />
              </div>
            </div>

            <div className="form-row">
              <label>انحراف بولينجر</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="4"
                step="0.1"
                value={settings.technical.bollingerStd}
                onChange={(e) => handleSettingChange('technical', 'bollingerStd', parseFloat(e.target.value || '0'))}
              />
            </div>

            <div className="grid-2">
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.technical.useVolume}
                  onChange={(e) => handleSettingChange('technical', 'useVolume', e.target.checked)}
                />
                <span>استخدام الحجم</span>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.technical.useSupportResistance}
                  onChange={(e) => handleSettingChange('technical', 'useSupportResistance', e.target.checked)}
                />
                <span>استخدام الدعم/المقاومة</span>
              </label>
            </div>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="settings-panel">
            <h3>إعدادات الإشعارات</h3>

            <h4>قنوات الإشعارات</h4>
            <div className="grid-2">
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.notifications.emailAlerts}
                  onChange={(e) => handleSettingChange('notifications', 'emailAlerts', e.target.checked)}
                />
                <span>إشعارات البريد الإلكتروني</span>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.notifications.pushNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                />
                <span>إشعارات منبثقة</span>
              </label>
            </div>

            <h4>أحداث التداول</h4>
            <div className="grid-3">
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.notifications.tradeExecuted}
                  onChange={(e) => handleSettingChange('notifications', 'tradeExecuted', e.target.checked)}
                />
                <span>تنفيذ صفقة</span>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.notifications.tradeClosed}
                  onChange={(e) => handleSettingChange('notifications', 'tradeClosed', e.target.checked)}
                />
                <span>إغلاق صفقة</span>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.notifications.errorAlerts}
                  onChange={(e) => handleSettingChange('notifications', 'errorAlerts', e.target.checked)}
                />
                <span>تنبيهات الأخطاء</span>
              </label>
            </div>

            <h4>تنبيهات المخاطرة</h4>
            <div className="grid-2">
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.notifications.stopLossHit}
                  onChange={(e) => handleSettingChange('notifications', 'stopLossHit', e.target.checked)}
                />
                <span>وصول لوقف الخسارة</span>
              </label>

              <label className="check-item">
                <input
                  type="checkbox"
                  checked={!!settings.notifications.takeProfitHit}
                  onChange={(e) => handleSettingChange('notifications', 'takeProfitHit', e.target.checked)}
                />
                <span>وصول لأخذ الربح</span>
              </label>
            </div>
          </section>
        )}
      </div>

      <div className="settings-footer">
        <button className="btn btn-primary" type="button" onClick={saveSettings} disabled={isSaving}>
          {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
        <button className="btn btn-danger" type="button" onClick={resetToDefaults} disabled={isSaving}>
          إعادة تعيين
        </button>
      </div>

      {message.text ? <div className={`system-message ${message.type}`}>{message.text}</div> : null}

      {testResults ? (
        <div className="test-results">
          <h4>نتائج اختبار الاتصال</h4>
          <pre>{JSON.stringify(testResults, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
};

export default BotSettings;
