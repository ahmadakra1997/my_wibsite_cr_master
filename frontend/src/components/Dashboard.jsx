// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const { t } = useTranslation();

  const [botStatus, setBotStatus] = useState('inactive');
  const [performance, setPerformance] = useState({});
  const [liveSignals, setLiveSignals] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTabs, setActiveTabs] = useState({
    signals: true,
    performance: true,
    analytics: false,
  });

  // محاكاة بيانات أداء حية
  const simulateLiveData = useCallback(() => {
    const performanceData = {
      profit: `+${(Math.random() * 5).toFixed(2)}%`,
      activeTrades: Math.floor(Math.random() * 20) + 5,
      successRate: `${(95 + Math.random() * 4).toFixed(1)}%`,
      dailyGain: `+$${(Math.random() * 2000 + 500).toLocaleString()}`,
      totalBalance: `$${(Math.random() * 50000 + 20000).toLocaleString()}`,
      monthlyReturn: `+${(Math.random() * 15 + 5).toFixed(1)}%`,
      riskScore: Math.floor(Math.random() * 30 + 70),
      winRate: `${(85 + Math.random() * 12).toFixed(1)}%`,
      sharpeRatio: (Math.random() * 3 + 1.5).toFixed(2),
      maxDrawdown: `-${(Math.random() * 2).toFixed(1)}%`,
    };

    const signals = [
      {
        id: 1,
        symbol: 'BTC/USDT',
        action: 'buy',
        confidence: '92%',
        time: new Date().toLocaleTimeString(),
        price: '$45,230',
        change: '+2.4%',
        exchange: 'Binance',
      },
      {
        id: 2,
        symbol: 'ETH/USDT',
        action: 'sell',
        confidence: '87%',
        time: new Date().toLocaleTimeString(),
        price: '$2,450',
        change: '-1.2%',
        exchange: 'MEXC',
      },
      {
        id: 3,
        symbol: 'XRP/USDT',
        action: 'buy',
        confidence: '95%',
        time: new Date().toLocaleTimeString(),
        price: '$0.75',
        change: '+5.7%',
        exchange: 'Both',
      },
      {
        id: 4,
        symbol: 'ADA/USDT',
        action: 'buy',
        confidence: '88%',
        time: new Date().toLocaleTimeString(),
        price: '$0.52',
        change: '+3.1%',
        exchange: 'Binance',
      },
    ];

    setPerformance(performanceData);

    setLiveSignals((prev) => {
      const newSignals = signals.slice(0, Math.floor(Math.random() * 2) + 2);
      return [...newSignals, ...(Array.isArray(prev) ? prev.slice(0, 3) : [])];
    });
  }, []);

  useEffect(() => {
    simulateLiveData();
    const interval = setInterval(simulateLiveData, 8000);
    return () => clearInterval(interval);
  }, [simulateLiveData]);

  const startBot = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setBotStatus('active');
    } catch (error) {
      console.error('Failed to start bot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopBot = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setBotStatus('inactive');
    } catch (error) {
      console.error('Failed to stop bot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTab = (tab) => {
    setActiveTabs((prev) => ({ ...(prev || {}), [tab]: !prev?.[tab] }));
  };

  const getStatusColor = () => {
    return botStatus === 'active' ? '#00ff88' : '#ff3b5c';
  };

  const getStatusGlow = () => {
    return botStatus === 'active'
      ? '0 0 20px rgba(0, 255, 136, 0.5)'
      : '0 0 20px rgba(255, 59, 92, 0.3)';
  };

  const title = typeof t === 'function' ? t('dashboard.title') : 'Dashboard';
  const subtitle = typeof t === 'function' ? t('dashboard.subtitle') : 'Live overview';
  const botStatusLabel = typeof t === 'function' ? t('dashboard.botStatus') : 'Bot Status';
  const statusActive = typeof t === 'function' ? t('dashboard.statusActive') : 'Active';
  const statusInactive = typeof t === 'function' ? t('dashboard.statusInactive') : 'Inactive';

  const planLabel = user?.plan === 'pro' ? '⚡ Pro' : 'Basic';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px' }}>
      {/* رأس اللوحة */}
      <header
        style={{
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(56,189,248,0.18)',
          background: 'linear-gradient(135deg, rgba(2,6,23,0.95), rgba(8,47,73,0.70))',
          boxShadow: '0 20px 60px rgba(2,6,23,0.72)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ color: 'rgba(226,232,240,0.98)', fontWeight: 950, fontSize: 20 }}>{title}</div>
          <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)' }}>
            {subtitle} - <span style={{ fontWeight: 950 }}>QUANTUM AI TRADER</span>
          </div>
          <div style={{ marginTop: 6, color: 'rgba(226,232,240,0.92)' }}>
            مرحباً، <span style={{ fontWeight: 950 }}>{user?.email || 'المتداول'}</span>!
          </div>
        </div>

        <div
          style={{
            borderRadius: 999,
            padding: '6px 10px',
            border: '1px solid rgba(0,255,136,0.25)',
            background: 'rgba(0,255,136,0.08)',
            color: 'rgba(226,232,240,0.95)',
            fontWeight: 950,
          }}
        >
          {planLabel}
        </div>
      </header>

      {/* شبكة لوحة التحكم الرئيسية */}
      <section
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {/* بطاقة حالة البوت */}
        <div
          style={{
            borderRadius: 22,
            padding: 16,
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 16 }}>{botStatusLabel}</div>

          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: getStatusColor(),
                boxShadow: getStatusGlow(),
                display: 'inline-block',
              }}
              aria-hidden="true"
            />
            <span style={{ color: 'rgba(226,232,240,0.95)', fontWeight: 950 }}>
              {botStatus === 'active' ? statusActive : statusInactive}
            </span>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={startBot}
              disabled={isLoading || botStatus === 'active'}
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                border: '1px solid rgba(0,255,136,0.35)',
                background: 'rgba(0,255,136,0.10)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 950,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading && botStatus !== 'active' ? '...' : 'ابدأ التداول الآلي'}
            </button>

            <button
              type="button"
              onClick={stopBot}
              disabled={isLoading || botStatus !== 'active'}
              style={{
                borderRadius: 14,
                padding: '10px 12px',
                border: '1px solid rgba(56,189,248,0.30)',
                background: 'rgba(56,189,248,0.10)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 950,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading && botStatus === 'active' ? '...' : 'إيقاف البوت'}
            </button>
          </div>

          <div style={{ marginTop: 12, color: 'rgba(148,163,184,0.95)', lineHeight: 1.7 }}>
            <div>وقت التشغيل 24/7</div>
            <div>السيرفر نشط</div>
            <div>الإصدار v2.4.1</div>
          </div>
        </div>

        {/* بطاقة الأداء الرئيسية */}
        <div
          style={{
            borderRadius: 22,
            padding: 16,
            border: '1px solid rgba(56,189,248,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 16 }}>أداء التداول</div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['1h', '24h', '7d', '30d'].map((timeframe) => (
              <button
                key={timeframe}
                type="button"
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`timeframe-btn ${selectedTimeframe === timeframe ? 'active' : ''}`}
                style={{
                  borderRadius: 999,
                  padding: '6px 10px',
                  border:
                    selectedTimeframe === timeframe
                      ? '1px solid rgba(0,255,136,0.35)'
                      : '1px solid rgba(148,163,184,0.18)',
                  background:
                    selectedTimeframe === timeframe ? 'rgba(0,255,136,0.10)' : 'rgba(15,23,42,0.55)',
                  color: 'rgba(226,232,240,0.95)',
                  fontWeight: 950,
                  cursor: 'pointer',
                }}
              >
                {timeframe}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <div style={{ color: 'rgba(148,163,184,0.95)' }}>إجمالي الأرباح</div>
              <div style={{ marginTop: 6, color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 18 }}>
                {performance.dailyGain || '+$0'}
              </div>
              <div style={{ marginTop: 4, color: 'rgba(0,255,136,0.95)', fontWeight: 950 }}>
                {performance.profit || '+0.0%'}
              </div>
            </div>

            <div>
              <div style={{ color: 'rgba(148,163,184,0.95)' }}>معدل النجاح</div>
              <div style={{ marginTop: 6, color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 18 }}>
                {performance.successRate || '0%'}
              </div>
              <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.95)' }}>دقة عالية ⚡</div>
            </div>

            <div>
              <div style={{ color: 'rgba(148,163,184,0.95)' }}>الصفقات النشطة</div>
              <div style={{ marginTop: 6, color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 18 }}>
                {performance.activeTrades || '0'}
              </div>
              <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.95)' }}>في الوقت الحقيقي</div>
            </div>

            <div>
              <div style={{ color: 'rgba(148,163,184,0.95)' }}>رصيد المحفظة</div>
              <div style={{ marginTop: 6, color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 18 }}>
                {performance.totalBalance || '$0'}
              </div>
              <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.95)' }}>إجمالي الأصول</div>
            </div>
          </div>
        </div>

        {/* بطاقة الإشعارات الحية */}
        <div
          style={{
            borderRadius: 22,
            padding: 16,
            border: '1px solid rgba(45,212,191,0.16)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 16 }}>
              الإشعارات الحية <span style={{ opacity: 0.85 }}>({Array.isArray(liveSignals) ? liveSignals.length : 0})</span>
            </div>
            <button
              type="button"
              onClick={() => toggleTab('signals')}
              style={{
                borderRadius: 12,
                padding: '8px 10px',
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'rgba(15,23,42,0.55)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 950,
                cursor: 'pointer',
              }}
            >
              {activeTabs.signals ? '−' : '+'}
            </button>
          </div>

          {activeTabs.signals ? (
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {Array.isArray(liveSignals) && liveSignals.length > 0 ? (
                liveSignals.map((signal) => (
                  <div
                    key={signal?.id ?? `${signal?.symbol}-${signal?.time}`}
                    style={{
                      borderRadius: 16,
                      padding: 12,
                      border: '1px solid rgba(148,163,184,0.14)',
                      background: 'rgba(2,6,23,0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>
                        {signal?.symbol || '—'}{' '}
                        <span style={{ opacity: 0.85 }}>
                          {signal?.action === 'buy' ? 'شراء' : signal?.action === 'sell' ? 'بيع' : '—'}
                        </span>
                      </div>
                      <div style={{ color: 'rgba(148,163,184,0.95)', fontWeight: 900 }}>{signal?.time || '—'}</div>
                    </div>

                    <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', color: 'rgba(148,163,184,0.95)' }}>
                      <span>Confidence: <strong style={{ color: 'rgba(226,232,240,0.95)' }}>{signal?.confidence || '—'}</strong></span>
                      <span>Price: <strong style={{ color: 'rgba(226,232,240,0.95)' }}>{signal?.price || '—'}</strong></span>
                      <span>Change: <strong style={{ color: 'rgba(226,232,240,0.95)' }}>{signal?.change || '—'}</strong></span>
                      <span>Exchange: <strong style={{ color: 'rgba(226,232,240,0.95)' }}>{signal?.exchange || '—'}</strong></span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'rgba(148,163,184,0.95)' }}>لا توجد إشعارات حالياً</div>
              )}
            </div>
          ) : null}
        </div>

        {/* بطاقة التحليلات المتقدمة */}
        <div
          style={{
            borderRadius: 22,
            padding: 16,
            border: '1px solid rgba(0,255,136,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 16 }}>التحليلات المتقدمة</div>
            <button
              type="button"
              onClick={() => toggleTab('analytics')}
              style={{
                borderRadius: 12,
                padding: '8px 10px',
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'rgba(15,23,42,0.55)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 950,
                cursor: 'pointer',
              }}
            >
              {activeTabs.analytics ? '−' : '+'}
            </button>
          </div>

          {activeTabs.analytics ? (
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <div style={{ color: 'rgba(148,163,184,0.95)' }}>معدل الربحية</div>
                <div style={{ marginTop: 6, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>
                  {performance.winRate || '0%'}
                </div>
              </div>

              <div>
                <div style={{ color: 'rgba(148,163,184,0.95)' }}>نسبة شارب</div>
                <div style={{ marginTop: 6, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>
                  {performance.sharpeRatio || '0.00'} <span style={{ opacity: 0.85 }}>↑ ممتاز</span>
                </div>
              </div>

              <div>
                <div style={{ color: 'rgba(148,163,184,0.95)' }}>أقصى انخفاض</div>
                <div style={{ marginTop: 6, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>
                  {performance.maxDrawdown || '0%'} <span style={{ opacity: 0.85 }}>منخفض</span>
                </div>
              </div>

              <div>
                <div style={{ color: 'rgba(148,163,184,0.95)' }}>مستوى المخاطرة</div>
                <div style={{ marginTop: 6, color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>
                  {performance.riskScore || '0'}/100
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* بطاقة الأخبار السريعة */}
        <div
          style={{
            borderRadius: 22,
            padding: 16,
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 16 }}>أخبار السوق</div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>BTC</span>
              <span style={{ color: 'rgba(148,163,184,0.95)' }}>منذ 2 دقيقة</span>
            </div>
            <div style={{ color: 'rgba(148,163,184,0.95)' }}>Bitcoin يتخطى مستوى المقاومة عند $45,000</div>

            <div style={{ height: 1, background: 'rgba(148,163,184,0.12)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>ETH</span>
              <span style={{ color: 'rgba(148,163,184,0.95)' }}>منذ 15 دقيقة</span>
            </div>
            <div style={{ color: 'rgba(148,163,184,0.95)' }}>Ethereum ترقية الشبكة المقررة الأسبوع القادم</div>

            <div style={{ height: 1, background: 'rgba(148,163,184,0.12)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>NEW</span>
              <span style={{ color: 'rgba(148,163,184,0.95)' }}>منذ ساعة</span>
            </div>
            <div style={{ color: 'rgba(148,163,184,0.95)' }}>أزواج تداول جديدة مضافة إلى المنصة</div>
          </div>
        </div>

        {/* بطاقة الأداء الشهري */}
        <div
          style={{
            borderRadius: 22,
            padding: 16,
            border: '1px solid rgba(56,189,248,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 16 }}>الأداء الشهري</div>

          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ color: 'rgba(0,255,136,0.95)', fontWeight: 950, fontSize: 18 }}>+24.7%</div>
            <div style={{ color: 'rgba(148,163,184,0.95)' }}>هذا الشهر</div>
            <div style={{ marginInlineStart: 10, color: 'rgba(56,189,248,0.95)', fontWeight: 950, fontSize: 18 }}>
              +156.3%
            </div>
            <div style={{ color: 'rgba(148,163,184,0.95)' }}>هذه السنة</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 90 }}>
              {[65, 80, 45, 90, 75, 85, 70].map((height, index) => (
                <div
                  key={index}
                  style={{
                    width: 14,
                    height,
                    borderRadius: 10,
                    border: '1px solid rgba(56,189,248,0.22)',
                    background: 'linear-gradient(180deg, rgba(56,189,248,0.28), rgba(0,255,136,0.10))',
                  }}
                  aria-hidden="true"
                />
              ))}
            </div>

            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              {['أ', 'ب', 'ج', 'د', 'ه', 'و', 'ي'].map((label, index) => (
                <div key={index} style={{ width: 14, textAlign: 'center', color: 'rgba(148,163,184,0.95)' }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* قسم الإجراءات السريعة */}
      <section
        style={{
          marginTop: 12,
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(45,212,191,0.16)',
          background: 'rgba(15,23,42,0.55)',
          boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {['⏱️ التداول الآلي', '📊 تقرير الأداء', '⚙️ الإعدادات', '💬 الدعم الفني'].map((label) => (
          <button
            key={label}
            type="button"
            style={{
              borderRadius: 14,
              padding: '10px 12px',
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(2,6,23,0.25)',
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 950,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </section>
    </div>
  );
};

export default Dashboard;
