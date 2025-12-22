// frontend/src/pages/Profile.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user } = useContext(AuthContext);

  const [apiKeys, setApiKeys] = useState({
    binance: { apiKey: '', secretKey: '' },
    bybit: { apiKey: '', secretKey: '' },
  });

  const [selectedPlatform, setSelectedPlatform] = useState('binance');

  const handleApiKeySubmit = async (platform) => {
    try {
      await api.post('/user/api-keys', {
        platform,
        apiKey: apiKeys?.[platform]?.apiKey || '',
        secretKey: apiKeys?.[platform]?.secretKey || '',
      });
      alert('تم حفظ المفاتيح بنجاح');
    } catch (error) {
      alert('فشل في حفظ المفاتيح');
    }
  };

  const activateBot = async () => {
    try {
      const response = await api.post('/user/activate-bot');
      alert(`تم إنشاء البوت: ${response?.data?.botUrl || ''}`);
    } catch (error) {
      alert('فشل في إنشاء البوت');
    }
  };

  const currentPlatform = selectedPlatform || 'binance';
  const currentKeys = apiKeys?.[currentPlatform] || { apiKey: '', secretKey: '' };

  const onChangeApiKey = (value) => {
    setApiKeys((prev) => ({
      ...prev,
      [currentPlatform]: {
        ...(prev?.[currentPlatform] || {}),
        apiKey: value,
      },
    }));
  };

  const onChangeSecretKey = (value) => {
    setApiKeys((prev) => ({
      ...prev,
      [currentPlatform]: {
        ...(prev?.[currentPlatform] || {}),
        secretKey: value,
      },
    }));
  };

  const canActivateBot = user?.paymentStatus === 'completed' && !user?.tradingBotUrl;
  const hasBotUrl = !!user?.tradingBotUrl;

  return (
    <div style={{ maxWidth: 980, margin: '18px auto', padding: '0 14px' }}>
      <div
        style={{
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(56,189,248,0.18)',
          background: 'linear-gradient(135deg, rgba(2,6,23,0.95), rgba(8,47,73,0.70))',
          boxShadow: '0 20px 60px rgba(2,6,23,0.72)',
        }}
      >
        <h2 style={{ margin: 0, color: 'rgba(226,232,240,0.98)', fontWeight: 950 }}>
          الملف الشخصي - خطة {user?.subscriptionPlan || '—'}
        </h2>
        <p style={{ margin: '6px 0 0', color: 'rgba(148,163,184,0.95)', lineHeight: 1.7 }}>
          إدارة مفاتيح API وربط البوت بشكل آمن — بدون تغيير منطق الباكيند.
        </p>
      </div>

      {/* إدارة API Keys */}
      <section
        style={{
          marginTop: 12,
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(45,212,191,0.16)',
          background: 'rgba(15,23,42,0.55)',
          boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
        }}
      >
        <h3 style={{ margin: 0, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>إدارة مفاتيح API</h3>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 900 }}>
            المنصة
            <select
              value={currentPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'rgba(15,23,42,0.55)',
                color: 'rgba(226,232,240,0.95)',
                outline: 'none',
              }}
            >
              <option value="binance">Binance</option>
              <option value="bybit">Bybit</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 900 }}>
            API Key
            <input
              value={currentKeys.apiKey}
              onChange={(e) => onChangeApiKey(e.target.value)}
              placeholder="Enter API Key"
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'rgba(15,23,42,0.55)',
                color: 'rgba(226,232,240,0.95)',
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 900 }}>
            Secret Key
            <input
              value={currentKeys.secretKey}
              onChange={(e) => onChangeSecretKey(e.target.value)}
              placeholder="Enter Secret Key"
              type="password"
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'rgba(15,23,42,0.55)',
                color: 'rgba(226,232,240,0.95)',
                outline: 'none',
              }}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => handleApiKeySubmit(currentPlatform)}
          style={{
            marginTop: 12,
            borderRadius: 14,
            padding: '10px 12px',
            border: '1px solid rgba(0,255,136,0.35)',
            background: 'linear-gradient(135deg, rgba(56,189,248,0.14), rgba(0,255,136,0.10))',
            color: 'rgba(226,232,240,0.95)',
            fontWeight: 950,
            cursor: 'pointer',
            width: 'fit-content',
          }}
        >
          حفظ المفاتيح
        </button>
      </section>

      {/* تفعيل البوت */}
      {canActivateBot ? (
        <section
          style={{
            marginTop: 12,
            borderRadius: 22,
            padding: 16,
            border: '1px solid rgba(56,189,248,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <h3 style={{ margin: 0, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>تفعيل بوت التداول</h3>
          <p style={{ margin: '6px 0 0', color: 'rgba(148,163,184,0.95)', lineHeight: 1.7 }}>
            متاح بعد اكتمال حالة الدفع. سيتم إنشاء رابط البوت من الباكيند.
          </p>

          <button
            type="button"
            onClick={activateBot}
            style={{
              marginTop: 12,
              borderRadius: 14,
              padding: '10px 12px',
              border: '1px solid rgba(56,189,248,0.40)',
              background: 'rgba(56,189,248,0.10)',
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 950,
              cursor: 'pointer',
              width: 'fit-content',
            }}
          >
            إنشاء بوت التداول الخاص بي
          </button>
        </section>
      ) : null}

      {/* رابط البوت */}
      {hasBotUrl ? (
        <section
          style={{
            marginTop: 12,
            borderRadius: 22,
            padding: 16,
            border: '1px solid rgba(0,255,136,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <h3 style={{ margin: 0, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>بوت التداول الخاص بك</h3>
          <div style={{ marginTop: 10, color: 'rgba(148,163,184,0.95)', lineHeight: 1.7 }}>
            رابط البوت:{' '}
            <a
              href={user.tradingBotUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'rgba(56,189,248,0.95)', fontWeight: 950 }}
            >
              {user.tradingBotUrl}
            </a>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default Profile;
