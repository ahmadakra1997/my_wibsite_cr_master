// frontend/src/components/bot/BotActivation.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { activateTradingBot, deactivateTradingBot, getBotStatus } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import './BotActivation.css';

const safeParse = (raw) => {
  try {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const formatMoney = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const BotActivation = () => {
  const [botStatus, setBotStatus] = useState({
    isActive: false,
    lastActivation: null,
    currentBalance: 0,
    activePairs: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const { lastMessage } = useWebSocket('bot-status');

  const statusLabel = useMemo(() => (botStatus.isActive ? 'نشط' : 'متوقف'), [botStatus.isActive]);

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    window.clearTimeout(showMessage._t);
    showMessage._t = window.setTimeout(() => setMessage({ text: '', type: '' }), 4500);
  }, []);
  showMessage._t = showMessage._t || null;

  const fetchBotStatus = useCallback(async () => {
    try {
      const response = await getBotStatus();
      if (response?.success && response?.data) {
        setBotStatus({
          isActive: !!response.data.isActive,
          lastActivation: response.data.lastActivation ?? null,
          currentBalance: Number(response.data.currentBalance ?? 0),
          activePairs: Array.isArray(response.data.activePairs) ? response.data.activePairs : [],
        });
      }
    } catch (error) {
      console.error('[BotActivation] getBotStatus error:', error);
      showMessage('فشل في جلب حالة البوت', 'error');
    }
  }, [showMessage]);

  // WebSocket live updates
  useEffect(() => {
    if (!lastMessage) return;

    const data = safeParse(lastMessage?.data ?? lastMessage);
    if (!data) return;

    if (data.type === 'status_update' || data.type === 'bot_status') {
      setBotStatus((prev) => ({
        ...prev,
        isActive: typeof data.isActive === 'boolean' ? data.isActive : prev.isActive,
        currentBalance: data.currentBalance ?? prev.currentBalance,
        activePairs: Array.isArray(data.activePairs) ? data.activePairs : prev.activePairs,
        lastActivation: data.lastActivation ?? prev.lastActivation,
      }));
    }
  }, [lastMessage]);

  // Initial fetch
  useEffect(() => {
    fetchBotStatus();
  }, [fetchBotStatus]);

  const handleActivation = async (activate) => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = activate ? await activateTradingBot() : await deactivateTradingBot();

      if (response?.success) {
        setBotStatus((prev) => ({ ...prev, isActive: activate }));
        showMessage(activate ? '✅ تم تفعيل البوت بنجاح' : '⏸️ تم إيقاف البوت بنجاح', 'success');

        // refresh after action
        window.setTimeout(() => fetchBotStatus(), 800);
      } else {
        throw new Error(response?.message || 'فشل في العملية');
      }
    } catch (error) {
      console.error('[BotActivation] action error:', error);
      showMessage(error?.message || `فشل في ${activate ? 'تفعيل' : 'إيقاف'} البوت`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bot-activation-card" dir="rtl">
      <div className="activation-header">
        <div className="activation-title">
          <h2>تحكم البوت التداولي</h2>
          <p className="activation-subtitle">
            فعّل/أوقف البوت بأمان. الحالة تتحدث تلقائياً عبر WebSocket عند توفره.
          </p>
        </div>

        <div className={`status-indicator ${botStatus.isActive ? 'active' : 'inactive'}`}>
          <span className="status-dot" />
          <span>{statusLabel}</span>
        </div>
      </div>

      <div className="activation-info">
        <div className="info-item">
          <span className="label">الرصيد الحالي</span>
          <span className="value">${formatMoney(botStatus.currentBalance)}</span>
        </div>

        <div className="info-item">
          <span className="label">الأزواج النشطة</span>
          <span className="value">
            {botStatus.activePairs?.length ? botStatus.activePairs.join(', ') : '—'}
          </span>
        </div>

        {botStatus.lastActivation && (
          <div className="info-item">
            <span className="label">آخر تفعيل</span>
            <span className="value">
              {new Date(botStatus.lastActivation).toLocaleString('ar-SA')}
            </span>
          </div>
        )}
      </div>

      <div className="activation-controls">
        <button
          className={`btn-activate ${botStatus.isActive ? 'secondary' : 'primary'}`}
          onClick={() => handleActivation(true)}
          disabled={isLoading || botStatus.isActive}
          type="button"
        >
          {isLoading && !botStatus.isActive ? <span className="spinner" /> : null}
          تفعيل البوت
        </button>

        <button
          className={`btn-deactivate ${botStatus.isActive ? 'danger' : 'secondary'}`}
          onClick={() => handleActivation(false)}
          disabled={isLoading || !botStatus.isActive}
          type="button"
        >
          {isLoading && botStatus.isActive ? <span className="spinner" /> : null}
          إيقاف البوت
        </button>
      </div>

      {message.text ? <div className={`message ${message.type}`}>{message.text}</div> : null}

      <div className="activation-tips">
        <h4>نصائح تشغيل</h4>
        <ul>
          <li>تأكد من ضبط الإعدادات قبل التفعيل.</li>
          <li>راقب الأداء بشكل دوري من لوحة البوت.</li>
          <li>أوقف البوت قبل أي تغييرات حساسة أو اختبارات كبيرة.</li>
        </ul>
      </div>
    </div>
  );
};

export default BotActivation;
