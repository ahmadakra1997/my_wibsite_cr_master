// frontend/src/components/bot/BotSettings.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const DEFAULT_SETTINGS = {
  general: {
    botName: 'Trading Bot Pro',
    autoStart: false,
    riskLevel: 'medium', // low, medium, high
    maxDailyTrades: 10,
    stopLoss: 2, // %
    takeProfit: 5, // %
    tradeAmount: 100, // USD
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

function safeJsonParse(x) {
  try {
    if (!x) return null;
    if (typeof x === 'object') return x;
    return JSON.parse(x);
  } catch {
    return null;
  }
}

// دمج عميق بسيط: يحافظ على البنية الافتراضية ويأخذ قيم الـ API إن وجدت
function normalizeSettings(input) {
  const s = input && typeof input === 'object' ? input : {};
  return {
    general: { ...DEFAULT_SETTINGS.general, ...(s.general || {}) },
    trading: { ...DEFAULT_SETTINGS.trading, ...(s.trading || {}) },
    technical: { ...DEFAULT_SETTINGS.technical, ...(s.technical || {}) },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(s.notifications || {}) },
  };
}

const BotSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [availablePairs, setAvailablePairs] = useState([]);
  const [availableStrategies, setAvailableStrategies] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [testResults, setTestResults] = useState(null);

  const fileInputRef = useRef(null);

  const { lastMessage } = useWebSocket('settings-updates');

  // رسائل مؤقتة
  const showMessage = (text, type) => {
    setMessage({ text, type });
    window.clearTimeout(showMessage._t);
    showMessage._t = window.setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // جلب البيانات الأولية
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [settingsResponse, pairsResponse, strategiesResponse] = await Promise.all([
        getBotSettings(),
        getTradingPairs(),
        getTradingStrategies(),
      ]);

      if (settingsResponse?.success) {
        setSettings(normalizeSettings(settingsResponse.data));
      } else if (settingsResponse?.data) {
        setSettings(normalizeSettings(settingsResponse.data));
      }

      if (pairsResponse?.success) setAvailablePairs(Array.isArray(pairsResponse.data) ? pairsResponse.data : []);
      else if (Array.isArray(pairsResponse)) setAvailablePairs(pairsResponse);

      if (strategiesResponse?.success)
        setAvailableStrategies(Array.isArray(strategiesResponse.data) ? strategiesResponse.data : []);
      else if (Array.isArray(strategiesResponse)) setAvailableStrategies(strategiesResponse);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showMessage('فشل في تحميل الإعدادات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // الاستماع لتحديثات الإعدادات عبر WS
  useEffect(() => {
    if (!lastMessage) return;
    const payload = safeJsonParse(lastMessage?.data ?? lastMessage);
    if (!payload) return;

    if (payload.type === 'settings_updated' && payload.settings) {
      setSettings(normalizeSettings(payload.settings));
      showMessage('تم تحديث الإعدادات تلقائياً', 'success');
    }
  }, [lastMessage]);

  const handleSettingChange = (category, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: { ...(prev[category] || {}), [field]: value },
    }));
  };

  const handleToggle = (category, field) => {
    handleSettingChange(category, field, !Boolean(settings?.[category]?.[field]));
  };

  const handleArraySettingChange = (category, field, value, checked) => {
    setSettings((prev) => {
      const current = Array.isArray(prev?.[category]?.[field]) ? prev[category][field] : [];
      const next = checked ? Array.from(new Set([...current, value])) : current.filter((x) => x !== value);
      return { ...prev, [category]: { ...prev[category], [field]: next } };
    });
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await updateBotSettings(settings);
      if (response?.success) {
        showMessage('✅ تم حفظ الإعدادات بنجاح', 'success');
      } else {
        throw new Error(response?.message || 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage(error?.message || 'فشل في حفظ الإعدادات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    const ok = window.confirm('⚠️ هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟');
    if (!ok) return;

    try {
      const response = await resetBotSettings();
      if (response?.success && response.data) {
        setSettings(normalizeSettings(response.data));
        showMessage('✅ تم إعادة تعيين الإعدادات', 'success');
      } else {
        setSettings(DEFAULT_SETTINGS);
        showMessage('✅ تم إعادة تعيين الإعدادات', 'success');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      showMessage('فشل في إعادة التعيين', 'error');
    }
  };

  const testConnection = async () => {
    try {
      setTestResults(null);
      const response = await testBotConnection();
      setTestResults(response);
      if (response?.success) showMessage('✅ اختبار الاتصال ناجح', 'success');
      else showMessage('❌ فشل اختبار الاتصال', 'error');
    } catch (error) {
      console.error('Error testing connection:', error);
      showMessage('❌ خطأ في اختبار الاتصال', 'error');
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
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
      const imported = safeJsonParse(e.target?.result);
      if (!imported) {
        showMessage('❌ ملف غير صالح', 'error');
        event.target.value = '';
        return;
      }
      setSettings(normalizeSettings(imported));
      showMessage('✅ تم استيراد الإعدادات', 'success');
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const strategyOptions = useMemo(() => {
    // يقبل [{name}] أو ['x']
    return (Array.isArray(availableStrategies) ? availableStrategies : []).map((s) =>
      typeof s === 'string' ? { id: s, name: s } : { id: s.id || s.name, name: s.name || s.id },
    );
  }, [availableStrategies]);

  const pairsOptions = useMemo(() => {
    return Array.isArray(availablePairs) && availablePairs.length ? availablePairs : settings.trading.pairs;
  }, [availablePairs, settings.trading.pairs]);

  if (isLoading) {
    return (
      <div className="bot-settings-container">
        <div className="loading-container">
          <div className="spinner-large" />
          <div>جاري تحميل الإعدادات...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bot-settings-container">
      <div className="settings-header">
        <h2>⚙️ الإعدادات المتقدمة للبوت</h2>

        <div className="header-actions">
          <button type="button" className="btn-test" onClick={testConnection}>
            اختبار الاتصال
          </button>
          <button type="button" className="btn-export" onClick={exportSettings}>
            تصدير
          </button>

          <button
            type="button"
            className="btn-import"
            onClick={() => fileInputRef.current?.click()}
            title="استيراد ملف JSON"
          >
            استيراد
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={importSettings}
          />
        </div>
      </div>

      {message.text ? <div className={`message ${message.type}`}>{message.text}</div> : null}

      {testResults ? (
        <div className={`test-results ${testResults?.success ? 'success' : 'error'}`}>
          <h4>نتائج اختبار الاتصال</h4>
          <pre>{JSON.stringify(testResults, null, 2)}</pre>
        </div>
      ) : null}

      <div className="settings-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          عام
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'trading' ? 'active' : ''}`}
          onClick={() => setActiveTab('trading')}
        >
          تداول
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'technical' ? 'active' : ''}`}
          onClick={() => setActiveTab('technical')}
        >
          تقني
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          إشعارات
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'general' ? (
          <div className="tab-panel">
            <div className="settings-group">
              <h4>الإعدادات العامة</h4>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>اسم البوت</label>
                  <input
                    className="form-input"
                    value={settings.general.botName}
                    onChange={(e) => handleSettingChange('general', 'botName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>بدء التشغيل التلقائي</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.general.autoStart)}
                      onChange={() => handleToggle('general', 'autoStart')}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="form-group">
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

                <div className="form-group">
                  <label>أقصى صفقات يومية</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="100"
                    value={settings.general.maxDailyTrades}
                    onChange={(e) => handleSettingChange('general', 'maxDailyTrades', Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>وقف الخسارة (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={settings.general.stopLoss}
                    onChange={(e) => handleSettingChange('general', 'stopLoss', Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>أخذ الربح (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={settings.general.takeProfit}
                    onChange={(e) => handleSettingChange('general', 'takeProfit', Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>مبلغ التداول ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="10"
                    max="100000"
                    step="10"
                    value={settings.general.tradeAmount}
                    onChange={(e) => handleSettingChange('general', 'tradeAmount', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'trading' ? (
          <div className="tab-panel">
            <div className="settings-group">
              <h4>إعدادات التداول</h4>

              <div className="form-grid">
                <div className="form-group">
                  <label>الإستراتيجية</label>
                  <select
                    className="form-select"
                    value={settings.trading.strategy}
                    onChange={(e) => handleSettingChange('trading', 'strategy', e.target.value)}
                  >
                    {strategyOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
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

                <div className="form-group">
                  <label>أقصى صفقات مفتوحة</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="50"
                    value={settings.trading.maxOpenTrades}
                    onChange={(e) => handleSettingChange('trading', 'maxOpenTrades', Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>وقف الخسارة المتابع</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.trading.trailingStop)}
                      onChange={() => handleToggle('trading', 'trailingStop')}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="form-group">
                  <label>وضع التحوط</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.trading.hedgeMode)}
                      onChange={() => handleToggle('trading', 'hedgeMode')}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="form-group">
                  <label>استخدام الهامش</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.trading.useMargin)}
                      onChange={() => handleToggle('trading', 'useMargin')}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="form-group full-width">
                  <label>أزواج التداول</label>
                  <div className="checkbox-grid">
                    {pairsOptions.map((pair) => {
                      const checked = settings.trading.pairs.includes(pair);
                      return (
                        <label key={pair} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              handleArraySettingChange('trading', 'pairs', pair, e.target.checked)
                            }
                          />
                          <span className="checkmark" />
                          <span>{pair}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'technical' ? (
          <div className="tab-panel">
            <div className="settings-group">
              <h4>الإعدادات التقنية</h4>

              <div className="form-grid">
                <div className="form-group">
                  <label>فترة RSI</label>
                  <input
                    type="number"
                    className="form-input"
                    min="5"
                    max="60"
                    value={settings.technical.rsiPeriod}
                    onChange={(e) => handleSettingChange('technical', 'rsiPeriod', Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>MACD السريع</label>
                  <input
                    type="number"
                    className="form-input"
                    min="5"
                    max="30"
                    value={settings.technical.macdFast}
                    onChange={(e) => handleSettingChange('technical', 'macdFast', Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>MACD البطيء</label>
                  <input
                    type="number"
                    className="form-input"
                    min="10"
                    max="60"
                    value={settings.technical.macdSlow}
                    onChange={(e) => handleSettingChange('technical', 'macdSlow', Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>إشارة MACD</label>
                  <input
                    type="number"
                    className="form-input"
                    min="3"
                    max="30"
                    value={settings.technical.macdSignal}
                    onChange={(e) =>
                      handleSettingChange('technical', 'macdSignal', Number(e.target.value))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>فترة بولينجر</label>
                  <input
                    type="number"
                    className="form-input"
                    min="10"
                    max="60"
                    value={settings.technical.bollingerPeriod}
                    onChange={(e) =>
                      handleSettingChange('technical', 'bollingerPeriod', Number(e.target.value))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>انحراف بولينجر</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="5"
                    step="0.1"
                    value={settings.technical.bollingerStd}
                    onChange={(e) =>
                      handleSettingChange('technical', 'bollingerStd', Number(e.target.value))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>استخدام الحجم</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.technical.useVolume)}
                      onChange={() => handleToggle('technical', 'useVolume')}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="form-group">
                  <label>الدعم والمقاومة</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.technical.useSupportResistance)}
                      onChange={() => handleToggle('technical', 'useSupportResistance')}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'notifications' ? (
          <div className="tab-panel">
            <div className="settings-group">
              <h4>إعدادات الإشعارات</h4>

              <div className="notifications-grid">
                <div className="notification-category">
                  <h5>قنوات الإشعارات</h5>

                  <div className="notification-item">
                    <label>إشعارات البريد الإلكتروني</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.notifications.emailAlerts)}
                        onChange={() => handleToggle('notifications', 'emailAlerts')}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="notification-item">
                    <label>الإشعارات المنبثقة</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.notifications.pushNotifications)}
                        onChange={() => handleToggle('notifications', 'pushNotifications')}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>

                <div className="notification-category">
                  <h5>أحداث التداول</h5>

                  <div className="notification-item">
                    <label>تنفيذ صفقة</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.notifications.tradeExecuted)}
                        onChange={() => handleToggle('notifications', 'tradeExecuted')}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="notification-item">
                    <label>إغلاق صفقة</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.notifications.tradeClosed)}
                        onChange={() => handleToggle('notifications', 'tradeClosed')}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>

                <div className="notification-category">
                  <h5>تنبيهات المخاطرة</h5>

                  <div className="notification-item">
                    <label>وصول لوقف الخسارة</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.notifications.stopLossHit)}
                        onChange={() => handleToggle('notifications', 'stopLossHit')}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="notification-item">
                    <label>وصول لأخذ الربح</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.notifications.takeProfitHit)}
                        onChange={() => handleToggle('notifications', 'takeProfitHit')}
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="notification-item">
                    <label>تنبيهات الأخطاء</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.notifications.errorAlerts)}
                        onChange={() => handleToggle('notifications', 'errorAlerts')}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="settings-actions">
        <button type="button" className="btn-save" onClick={saveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <span className="spinner" /> جاري الحفظ...
            </>
          ) : (
            '💾 حفظ الإعدادات'
          )}
        </button>

        <button type="button" className="btn-reset" onClick={resetToDefaults} disabled={isSaving}>
          ♻️ إعادة تعيين
        </button>
      </div>

      <div className="settings-footer">
        <div>تلميح: احفظ الإعدادات بعد أي تغيير لضمان تطبيقها.</div>
        <div>حالة: {isSaving ? 'جاري الحفظ…' : 'جاهز'}</div>
      </div>
    </div>
  );
};

export default BotSettings;
