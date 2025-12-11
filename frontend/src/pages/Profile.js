import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [apiKeys, setApiKeys] = useState({
    binance: { apiKey: '', secretKey: '' },
    bybit: { apiKey: '', secretKey: '' }
  });
  const [selectedPlatform, setSelectedPlatform] = useState('binance');

  const handleApiKeySubmit = async (platform) => {
    try {
      await api.post('/user/api-keys', {
        platform,
        apiKey: apiKeys[platform].apiKey,
        secretKey: apiKeys[platform].secretKey
      });
      alert('تم حفظ المفاتيح بنجاح');
    } catch (error) {
      alert('فشل في حفظ المفاتيح');
    }
  };

  const activateBot = async () => {
    try {
      const response = await api.post('/user/activate-bot');
      alert(`تم إنشاء البوت: ${response.data.botUrl}`);
    } catch (error) {
      alert('فشل في إنشاء البوت');
    }
  };

  return (
    <div className="profile-container">
      <h2>الملف الشخصي - خطة {user?.subscriptionPlan}</h2>
      
      {/* إدارة API Keys */}
      <div className="api-keys-section">
        <h3>إدارة مفاتيح API</h3>
        <select 
          value={selectedPlatform} 
          onChange={(e) => setSelectedPlatform(e.target.value)}
        >
          <option value="binance">Binance</option>
          <option value="bybit">Bybit</option>
        </select>
        
        <input
          type="text"
          placeholder="API Key"
          value={apiKeys[selectedPlatform]?.apiKey || ''}
          onChange={(e) => setApiKeys(prev => ({
            ...prev,
            [selectedPlatform]: { ...prev[selectedPlatform], apiKey: e.target.value }
          }))}
        />
        
        <input
          type="password"
          placeholder="Secret Key"
          value={apiKeys[selectedPlatform]?.secretKey || ''}
          onChange={(e) => setApiKeys(prev => ({
            ...prev,
            [selectedPlatform]: { ...prev[selectedPlatform], secretKey: e.target.value }
          }))}
        />
        
        <button onClick={() => handleApiKeySubmit(selectedPlatform)}>
          حفظ المفاتيح
        </button>
      </div>

      {/* تفعيل البوت */}
      {user?.paymentStatus === 'completed' && !user.tradingBotUrl && (
        <div className="bot-activation">
          <h3>تفعيل بوت التداول</h3>
          <button onClick={activateBot} className="activate-btn">
            إنشاء بوت التداول الخاص بي
          </button>
        </div>
      )}

      {user?.tradingBotUrl && (
        <div className="bot-info">
          <h3>بوت التداول الخاص بك</h3>
          <p>رابط البوت: <a href={user.tradingBotUrl} target="_blank" rel="noopener noreferrer">
            {user.tradingBotUrl}
          </a></p>
        </div>
      )}
    </div>
  );
};

export default Profile;
