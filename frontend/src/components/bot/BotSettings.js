import React, { useState, useEffect, useCallback } from 'react';
import { 
  getBotSettings, 
  updateBotSettings, 
  getTradingPairs,
  getTradingStrategies,
  resetBotSettings,
  testBotConnection
} from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import './BotSettings.css';

const BotSettings = () => {
  const [settings, setSettings] = useState({
    // الإعدادات العامة
    general: {
      botName: 'Trading Bot Pro',
      autoStart: false,
      riskLevel: 'medium', // low, medium, high
      maxDailyTrades: 10,
      stopLoss: 2, // percentage
      takeProfit: 5, // percentage
      tradeAmount: 100, // USD per trade
    },
    // إعدادات التداول
    trading: {
      strategy: 'mean-reversion',
      pairs: ['BTC/USD', 'ETH/USD', 'ADA/USD'],
      timeframe: '1h',
      maxOpenTrades: 3,
      trailingStop: false,
      hedgeMode: false,
      useMargin: false
    },
    // إعدادات التقنية
    technical: {
      rsiPeriod: 14,
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9,
      bollingerPeriod: 20,
      bollingerStd: 2,
      useVolume: true,
      useSupportResistance: true
    },
    // إعدادات الإشعارات
    notifications: {
      emailAlerts: true,
      pushNotifications: false,
      tradeExecuted: true,
      tradeClosed: true,
      stopLossHit: true,
      takeProfitHit: true,
      errorAlerts: true
    }
  });

  const [availablePairs, setAvailablePairs] = useState([]);
  const [availableStrategies, setAvailableStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [testResults, setTestResults] = useState(null);

  const { lastMessage } = useWebSocket('settings-updates');

  // جلب البيانات الأولية
  useEffect(() => {
    fetchInitialData();
  }, []);

  // الاستماع لتحديثات الإعدادات
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'settings_updated') {
        showMessage('تم تحديث الإعدادات تلقائياً', 'success');
        setSettings(data.settings);
      }
    }
  }, [lastMessage]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [settingsResponse, pairsResponse, strategiesResponse] = await Promise.all([
        getBotSettings(),
        getTradingPairs(),
        getTradingStrategies()
      ]);

      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
      }

      if (pairsResponse.success) {
        setAvailablePairs(pairsResponse.data);
      }

      if (strategiesResponse.success) {
        setAvailableStrategies(strategiesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showMessage('فشل في تحميل الإعدادات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleArraySettingChange = (category, field, value, checked) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: checked 
          ? [...prev[category][field], value]
          : prev[category][field].filter(item => item !== value)
      }
    }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await updateBotSettings(settings);
      
      if (response.success) {
        showMessage('✅ تم حفظ الإعدادات بنجاح', 'success');
      } else {
        throw new Error(response.message || 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (window.confirm('⚠️ هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟')) {
      try {
        const response = await resetBotSettings();
        if (response.success) {
          setSettings(response.data);
          showMessage('🔄 تم إعادة تعيين الإعدادات', 'success');
        }
      } catch (error) {
        console.error('Error resetting settings:', error);
        showMessage('فشل في إعادة التعيين', 'error');
      }
    }
  };

  const testConnection = async () => {
    try {
      setTestResults(null);
      const response = await testBotConnection();
      setTestResults(response);
      
      if (response.success) {
        showMessage('✅ اختبار الاتصال ناجح', 'success');
      } else {
        showMessage('❌ فشل اختبار الاتصال', 'error');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      showMessage('❌ خطأ في اختبار الاتصال', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
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
    showMessage('📥 تم تصدير الإعدادات', 'success');
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          showMessage('📤 تم استيراد الإعدادات', 'success');
        } catch (error) {
          showMessage('❌ ملف غير صالح', 'error');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="bot-settings-container">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bot-settings-container">
      <div className="settings-header">
        <h2>⚙️ الإعدادات المتقدمة للبوت</h2>
        <div className="header-actions">
          <button 
            className="btn-test" 
            onClick={testConnection}
            disabled={isSaving}
          >
            🔍 اختبار الاتصال
          </button>
          <button 
            className="btn-export" 
            onClick={exportSettings}
          >
            📥 تصدير
          </button>
          <label className="btn-import">
            📤 استيراد
            <input 
              type="file" 
              accept=".json" 
              onChange={importSettings}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* تبويبات الإعدادات */}
      <div className="settings-tabs">
        <button 
          className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          🏠 عام
        </button>
        <button 
          className={`tab-btn ${activeTab === 'trading' ? 'active' : ''}`}
          onClick={() => setActiveTab('trading')}
        >
          📈 تداول
        </button>
        <button 
          className={`tab-btn ${activeTab === 'technical' ? 'active' : ''}`}
          onClick={() => setActiveTab('technical')}
        >
          📊 تقني
        </button>
        <button 
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 إشعارات
        </button>
      </div>

      {/* محتوى التبويبات */}
      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="tab-panel">
            <div className="settings-group">
              <h4>🛠️ الإعدادات العامة</h4>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>اسم البوت</label>
                  <input 
                    type="text" 
                    value={settings.general.botName}
                    onChange={(e) => handleSettingChange('general', 'botName', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>بدء التشغيل التلقائي</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.general.autoStart}
                      onChange={(e) => handleSettingChange('general', 'autoStart', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="form-group">
                  <label>مستوى المخاطرة</label>
                  <select 
                    value={settings.general.riskLevel}
                    onChange={(e) => handleSettingChange('general', 'riskLevel', e.target.value)}
                    className="form-select"
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
                    value={settings.general.maxDailyTrades}
                    onChange={(e) => handleSettingChange('general', 'maxDailyTrades', parseInt(e.target.value))}
                    className="form-input"
                    min="1"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label>وقف الخسارة (%)</label>
                  <input 
                    type="number" 
                    value={settings.general.stopLoss}
                    onChange={(e) => handleSettingChange('general', 'stopLoss', parseFloat(e.target.value))}
                    className="form-input"
                    min="0.1"
                    max="10"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>أخذ الربح (%)</label>
                  <input 
                    type="number" 
                    value={settings.general.takeProfit}
                    onChange={(e) => handleSettingChange('general', 'takeProfit', parseFloat(e.target.value))}
                    className="form-input"
                    min="0.1"
                    max="20"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>مبلغ التداول ($)</label>
                  <input 
                    type="number" 
                    value={settings.general.tradeAmount}
                    onChange={(e) => handleSettingChange('general', 'tradeAmount', parseFloat(e.target.value))}
                    className="form-input"
                    min="10"
                    max="1000"
                    step="10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trading' && (
          <div className="tab-panel">
            <div className="settings-group">
              <h4>📈 إعدادات التداول</h4>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>الإستراتيجية</label>
                  <select 
                    value={settings.trading.strategy}
                    onChange={(e) => handleSettingChange('trading', 'strategy', e.target.value)}
                    className="form-select"
                  >
                    {availableStrategies.map(strategy => (
                      <option key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>الإطار الزمني</label>
                  <select 
                    value={settings.trading.timeframe}
                    onChange={(e) => handleSettingChange('trading', 'timeframe', e.target.value)}
                    className="form-select"
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
                    value={settings.trading.maxOpenTrades}
                    onChange={(e) => handleSettingChange('trading', 'maxOpenTrades', parseInt(e.target.value))}
                    className="form-input"
                    min="1"
                    max="10"
                  />
                </div>

                <div className="form-group full-width">
                  <label>أزواج التداول</label>
                  <div className="checkbox-grid">
                    {availablePairs.map(pair => (
                      <label key={pair} className="checkbox-label">
                        <input 
                          type="checkbox"
                          checked={settings.trading.pairs.includes(pair)}
                          onChange={(e) => handleArraySettingChange('trading', 'pairs', pair, e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        {pair}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>وقف الخسارة المتابع</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.trading.trailingStop}
                      onChange={(e) => handleSettingChange('trading', 'trailingStop', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="form-group">
                  <label>وضع التحوط</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.trading.hedgeMode}
                      onChange={(e) => handleSettingChange('trading', 'hedgeMode', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="form-group">
                  <label>استخدام الهامش</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.trading.useMargin}
                      onChange={(e) => handleSettingChange('trading', 'useMargin', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'technical' && (
          <div className="tab-panel">
            <div className="settings-group">
              <h4>📊 الإعدادات التقنية</h4>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>فترة RSI</label>
                  <input 
                    type="number" 
                    value={settings.technical.rsiPeriod}
                    onChange={(e) => handleSettingChange('technical', 'rsiPeriod', parseInt(e.target.value))}
                    className="form-input"
                    min="5"
                    max="30"
                  />
                </div>

                <div className="form-group">
                  <label>MACD السريع</label>
                  <input 
                    type="number" 
                    value={settings.technical.macdFast}
                    onChange={(e) => handleSettingChange('technical', 'macdFast', parseInt(e.target.value))}
                    className="form-input"
                    min="5"
                    max="20"
                  />
                </div>

                <div className="form-group">
                  <label>MACD البطيء</label>
                  <input 
                    type="number" 
                    value={settings.technical.macdSlow}
                    onChange={(e) => handleSettingChange('technical', 'macdSlow', parseInt(e.target.value))}
                    className="form-input"
                    min="20"
                    max="40"
                  />
                </div>

                <div className="form-group">
                  <label>إشارة MACD</label>
                  <input 
                    type="number" 
                    value={settings.technical.macdSignal}
                    onChange={(e) => handleSettingChange('technical', 'macdSignal', parseInt(e.target.value))}
                    className="form-input"
                    min="5"
                    max="15"
                  />
                </div>

                <div className="form-group">
                  <label>فترة بولينجر</label>
                  <input 
                    type="number" 
                    value={settings.technical.bollingerPeriod}
                    onChange={(e) => handleSettingChange('technical', 'bollingerPeriod', parseInt(e.target.value))}
                    className="form-input"
                    min="10"
                    max="30"
                  />
                </div>

                <div className="form-group">
                  <label>انحراف بولينجر</label>
                  <input 
                    type="number" 
                    value={settings.technical.bollingerStd}
                    onChange={(e) => handleSettingChange('technical', 'bollingerStd', parseFloat(e.target.value))}
                    className="form-input"
                    min="1"
                    max="3"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>استخدام الحجم</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.technical.useVolume}
                      onChange={(e) => handleSettingChange('technical', 'useVolume', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="form-group">
                  <label>استخدام الدعم والمقاومة</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.technical.useSupportResistance}
                      onChange={(e) => handleSettingChange('technical', 'useSupportResistance', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="tab-panel">
            <div className="settings-group">
              <h4>🔔 إعدادات الإشعارات</h4>
              
              <div className="notifications-grid">
                <div className="notification-category">
                  <h5>قنوات الإشعارات</h5>
                  <div className="notification-item">
                    <label>إشعارات البريد الإلكتروني</label>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.emailAlerts}
                        onChange={(e) => handleSettingChange('notifications', 'emailAlerts', e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="notification-item">
                    <label>الإشعارات المنبثقة</label>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.pushNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                      />
                      <span className="slider"></span>
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
                        checked={settings.notifications.tradeExecuted}
                        onChange={(e) => handleSettingChange('notifications', 'tradeExecuted', e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="notification-item">
                    <label>إغلاق صفقة</label>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.tradeClosed}
                        onChange={(e) => handleSettingChange('notifications', 'tradeClosed', e.target.checked)}
                      />
                      <span className="slider"></span>
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
                        checked={settings.notifications.stopLossHit}
                        onChange={(e) => handleSettingChange('notifications', 'stopLossHit', e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="notification-item">
                    <label>وصول لأخذ الربح</label>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.takeProfitHit}
                        onChange={(e) => handleSettingChange('notifications', 'takeProfitHit', e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="notification-item">
                    <label>تنبيهات الأخطاء</label>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.errorAlerts}
                        onChange={(e) => handleSettingChange('notifications', 'errorAlerts', e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* نتائج اختبار الاتصال */}
      {testResults && (
        <div className={`test-results ${testResults.success ? 'success' : 'error'}`}>
          <h4>نتائج اختبار الاتصال</h4>
          <pre>{JSON.stringify(testResults, null, 2)}</pre>
        </div>
      )}

      {/* رسائل النظام */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* أزرار التحكم */}
      <div className="settings-actions">
        <button 
          className="btn-save"
          onClick={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="spinner"></span>
              جاري الحفظ...
            </>
          ) : (
            '💾 حفظ الإعدادات'
          )}
        </button>
        
        <button 
          className="btn-reset"
          onClick={resetToDefaults}
          disabled={isSaving}
        >
          🔄 إعادة تعيين
        </button>
      </div>

      {/* معلومات الإصدار */}
      <div className="settings-footer">
        <div className="version-info">
          <strong>إصدار البوت:</strong> v2.1.0
        </div>
        <div className="last-updated">
          <strong>آخر تحديث:</strong> {new Date().toLocaleString('ar-SA')}
        </div>
      </div>
    </div>
  );
};

export default BotSettings;
