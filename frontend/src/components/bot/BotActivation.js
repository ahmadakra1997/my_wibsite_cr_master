// frontend/src/components/bot/BotActivation.js

import React, { useState, useEffect } from 'react';
import { 
  activateTradingBot, 
  deactivateTradingBot, 
  getBotStatus 
} from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import './BotActivation.css';

const BotActivation = () => {
  const [botStatus, setBotStatus] = useState({
    isActive: false,
    lastActivation: null,
    currentBalance: 0,
    activePairs: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const { lastMessage } = useWebSocket('bot-status');

  // تحديث الحالة من WebSocket
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'status_update') {
        setBotStatus(prev => ({
          ...prev,
          isActive: data.isActive,
          currentBalance: data.currentBalance,
          activePairs: data.activePairs || []
        }));
      }
    }
  }, [lastMessage]);

  // جلب الحالة الأولية
  useEffect(() => {
    fetchBotStatus();
  }, []);

  const fetchBotStatus = async () => {
    try {
      const response = await getBotStatus();
      if (response.success) {
        setBotStatus({
          isActive: response.data.isActive,
          lastActivation: response.data.lastActivation,
          currentBalance: response.data.currentBalance,
          activePairs: response.data.activePairs || []
        });
      }
    } catch (error) {
      console.error('Error fetching bot status:', error);
      showMessage('فشل في جلب حالة البوت', 'error');
    }
  };

  const handleActivation = async (activate) => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = activate ? 
        await activateTradingBot() : 
        await deactivateTradingBot();
      
      if (response.success) {
        setBotStatus(prev => ({ ...prev, isActive: activate }));
        showMessage(
          activate ? '✅ تم تفعيل البوت بنجاح' : '⏸️ تم إيقاف البوت بنجاح',
          'success'
        );
        
        // تحديث الحالة بعد التغيير
        setTimeout(() => fetchBotStatus(), 1000);
      } else {
        throw new Error(response.message || 'فشل في العملية');
      }
    } catch (error) {
      console.error('Activation error:', error);
      showMessage(
        error.message || `فشل في ${activate ? 'تفعيل' : 'إيقاف'} البوت`,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  return (
    <div className="bot-activation-card">
      <div className="activation-header">
        <h2>🔄 تحكم البوت التداولي</h2>
        <div className={`status-indicator ${botStatus.isActive ? 'active' : 'inactive'}`}>
          <span className="status-dot"></span>
          {botStatus.isActive ? 'نشط' : 'متوقف'}
        </div>
      </div>

      <div className="activation-info">
        <div className="info-item">
          <span className="label">الرصيد الحالي:</span>
          <span className="value">
            ${botStatus.currentBalance.toLocaleString()}
          </span>
        </div>
        <div className="info-item">
          <span className="label">الأزواج النشطة:</span>
          <span className="value">
            {botStatus.activePairs.length > 0 ? 
              botStatus.activePairs.join(', ') : 'لا توجد أزواج نشطة'}
          </span>
        </div>
        {botStatus.lastActivation && (
          <div className="info-item">
            <span className="label">آخر تفعيل:</span>
            <span className="value">
              {new Date(botStatus.lastActivation).toLocaleString('ar-SA')}
            </span>
          </div>
        )}
      </div>

      <div className="activation-controls">
        <button
          className={`btn-activate ${!botStatus.isActive ? 'primary' : 'secondary'}`}
          onClick={() => handleActivation(true)}
          disabled={isLoading || botStatus.isActive}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              جاري التفعيل...
            </>
          ) : (
            '🚀 تفعيل البوت'
          )}
        </button>

        <button
          className={`btn-deactivate ${botStatus.isActive ? 'danger' : 'secondary'}`}
          onClick={() => handleActivation(false)}
          disabled={isLoading || !botStatus.isActive}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              جاري الإيقاف...
            </>
          ) : (
            '⏸️ إيقاف البوت'
          )}
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="activation-tips">
        <h4>💡 نصائح:</h4>
        <ul>
          <li>تأكد من إعدادات التداول قبل التفعيل</li>
          <li>راقب أداء البوت بانتظام</li>
          <li>استخدم إيقاف البوت عند الحاجة للتعديلات</li>
        </ul>
      </div>
    </div>
  );
};

export default BotActivation;
