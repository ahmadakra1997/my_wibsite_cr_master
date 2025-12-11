import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, plan, user }) => {
  const { t } = useTranslation();
  const [activeMethod, setActiveMethod] = useState('usdt');
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentStep, setPaymentStep] = useState('method'); // method, details, confirmation
  const [countdown, setCountdown] = useState(900); // 15 minutes in seconds
  const [transactionStatus, setTransactionStatus] = useState(null);
  const modalRef = useRef(null);

  // أسعار الخطط المحدثة
  const planPrices = {
    basic: 29,
    medium: 99,
    professional: 149
  };

  const amount = planPrices[plan] || 29;

  // إغلاق النافذة بالضغط على ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27 && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // عد تنازلي للدفع
  useEffect(() => {
    let interval;
    if (isOpen && paymentStep === 'details') {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setError('انتهت مهلة الدفع. يرجى البدء من جديد.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, paymentStep]);

  // جلب معلومات الدفع
  const fetchPaymentInfo = async () => {
    try {
      const mockPaymentInfo = {
        methods: [
          { 
            id: 'usdt', 
            name: 'USDT', 
            icon: '💎', 
            description: 'أسرع وأأمن طريقة دفع عالمية',
            features: ['تحويل فوري', 'رسوم منخفضة', 'مدعوم عالمياً'],
            color: '#00ff88'
          },
          { 
            id: 'sham_bank', 
            name: 'بنك شام كاش', 
            icon: '🏦', 
            description: 'تحويل آمن عبر الحساب التاجر',
            features: ['تحويل محلي', 'دعم فوري', 'آمن ومضمون'],
            color: '#00a3ff'
          },
          { 
            id: 'dev_test', 
            name: 'دفع تجريبي', 
            icon: '🧪', 
            description: 'تفعيل فوري بدون دفع', 
            isTest: true,
            features: ['تفعيل فوري', 'بدون تكلفة', 'لأغراض التطوير'],
            color: '#a855f7'
          }
        ],
        walletInfo: {
          networks: [
            { 
              id: 'TRC20', 
              address: 'TJX5m8K9pQ2sR7tN1vW3yZ6xL4dF8gH0j',
              name: 'TRC20',
              fee: '1 USDT',
              popular: true,
              speed: 'سريع',
              color: '#ff6b35'
            },
            { 
              id: 'ERC20', 
              address: '0x7a8d9fC5B5e5E5b5e5D5c5B5a5F5e5D5c5B5a5F5e',
              name: 'ERC20',
              fee: '10 USDT',
              popular: false,
              speed: 'بطيء',
              color: '#627eea'
            },
            { 
              id: 'BEP20', 
              address: '0x7a8d9fC5B5e5E5b5e5D5c5B5a5F5e5D5c5B5a5F5e',
              name: 'BEP20',
              fee: '1 USDT',
              popular: true,
              speed: 'متوسط',
              color: '#f0b90b'
            },
            { 
              id: 'POLYGON', 
              address: '0x7a8d9fC5B5e5E5b5e5D5c5B5a5F5e5D5c5B5a5F5e',
              name: 'Polygon',
              fee: '0.1 USDT',
              popular: false,
              speed: 'سريع جداً',
              color: '#8247e5'
            }
          ]
        },
        shamBankInfo: {
          merchantAccount: 'SY789-654321-888',
          beneficiary: 'Strong Akraa Trading',
          referencePrefix: 'AKR',
          bankName: 'بنك شام كاش',
          swiftCode: 'SHAMSYPP'
        }
      };
      
      setPaymentInfo(mockPaymentInfo);
    } catch (err) {
      console.error('Failed to fetch payment info:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPaymentInfo();
      setPaymentStep('method');
      setCountdown(900);
      setTransactionStatus(null);
      setError(null);
    }
  }, [isOpen, plan]);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const paymentData = {
        userId: user?.id || 'user_test_123',
        method: activeMethod,
        amount: amount,
        plan: plan,
        network: activeMethod === 'usdt' ? selectedNetwork : null,
        reference: activeMethod === 'sham_bank' ? `AKR-${Date.now().toString().slice(-6)}` : null
      };

      console.log('🚀 إرسال بيانات الدفع:', paymentData);

      // محاكاة اتصال ناجح بالخادم
      await new Promise(resolve => setTimeout(resolve, 3000));

      // محاكاة استجابة ناجحة
      const mockResponse = {
        success: true,
        message: 'تمت عملية الدفع بنجاح ✅ سيتم تفعيل اشتراكك فوراً',
        data: {
          transactionId: `TX-${Date.now()}`,
          subscription: {
            plan: plan,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          user: {
            name: user?.name || 'مستخدم Strong Akraa',
            email: user?.email || 'test@akraa.com'
          }
        }
      };

      setTransactionStatus(mockResponse);
      setPaymentStep('confirmation');
      
      console.log('✅ عملية الدفع ناجحة:', mockResponse.data);

    } catch (err) {
      console.error('💥 خطأ في معالجة الدفع:', err);
      setError('حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, message = '✅ تم نسخ النص إلى الحافظة') => {
    navigator.clipboard.writeText(text).then(() => {
      // إضافة تأثير مرئي بدلاً من alert
      const button = event.target;
      const originalText = button.innerHTML;
      button.innerHTML = '✅ تم النسخ!';
      button.style.background = '#00ff88';
      button.style.color = '#0f172a';
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
        button.style.color = '';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlanName = () => {
    const plans = {
      basic: 'الباقة الأساسية',
      medium: 'الباقة المتوسطة', 
      professional: 'الباقة الاحترافية'
    };
    return plans[plan] || 'الباقة الأساسية';
  };

  const getWalletAddress = () => {
    const network = paymentInfo?.walletInfo?.networks?.find(n => n.id === selectedNetwork);
    return network?.address || 'TJX5m8K9pQ2sR7tN1vW3yZ6xL4dF8gH0j';
  };

  if (!isOpen) return null;

  const paymentMethods = paymentInfo?.methods || [];
  const usdtNetworks = paymentInfo?.walletInfo?.networks || [];

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-container">
        {/* خلفية متحركة */}
        <div className="payment-modal-background">
          <div className="quantum-particles-payment"></div>
          <div className="neon-grid-payment"></div>
        </div>

        {/* النافذة الرئيسية */}
        <div className="payment-modal-content" ref={modalRef}>
          {/* رأس النافذة */}
          <div className="payment-modal-header">
            <div className="header-content">
              <div className="header-icon">💳</div>
              <div className="header-text">
                <h2 className="modal-title">إتمام عملية الدفع</h2>
                <p className="modal-subtitle">
                  {getPlanName()} - نظام QUANTUM AI TRADER
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={loading}
              className="modal-close-btn"
            >
              <span className="close-icon">&times;</span>
            </button>
          </div>

          {/* شريط التقدم */}
          <div className="payment-progress">
            <div className="progress-steps">
              <div className={`progress-step ${paymentStep === 'method' ? 'active' : ''} ${paymentStep !== 'method' ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">اختيار طريقة الدفع</div>
              </div>
              <div className={`progress-step ${paymentStep === 'details' ? 'active' : ''} ${paymentStep === 'confirmation' ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">تفاصيل الدفع</div>
              </div>
              <div className={`progress-step ${paymentStep === 'confirmation' ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">التأكيد</div>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: paymentStep === 'method' ? '0%' : 
                         paymentStep === 'details' ? '50%' : '100%' 
                }}
              ></div>
            </div>
          </div>

          {/* الخطوة 1: اختيار طريقة الدفع */}
          {paymentStep === 'method' && (
            <div className="payment-step">
              {/* معلومات المبلغ */}
              <div className="amount-section">
                <div className="amount-card">
                  <div className="amount-icon">💰</div>
                  <div className="amount-content">
                    <div className="amount-label">المبلغ المطلوب</div>
                    <div className="amount-value">${amount}</div>
                    <div className="amount-plan">{getPlanName()}</div>
                  </div>
                  <div className="amount-badge">شهرياً</div>
                </div>
              </div>

              {/* طرق الدفع */}
              <div className="methods-section">
                <h3 className="section-title">
                  <span className="title-icon">💎</span>
                  اختر طريقة الدفع
                </h3>
                <div className="methods-grid">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setActiveMethod(method.id)}
                      className={`method-card ${activeMethod === method.id ? 'method-active' : ''} ${method.isTest ? 'method-test' : ''}`}
                      style={{ '--method-color': method.color }}
                    >
                      <div className="method-header">
                        <div className="method-icon">{method.icon}</div>
                        <div className="method-info">
                          <h4 className="method-name">{method.name}</h4>
                          <p className="method-description">{method.description}</p>
                        </div>
                        <div className="method-check">
                          <div className="check-circle"></div>
                        </div>
                      </div>
                      
                      <div className="method-features">
                        {method.features?.map((feature, index) => (
                          <span key={index} className="feature-tag">{feature}</span>
                        ))}
                      </div>

                      {method.isTest && (
                        <div className="test-badge">
                          <span className="badge-icon">🧪</span>
                          وضع تجريبي
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* زر المتابعة */}
              <button
                onClick={() => setPaymentStep('details')}
                className="payment-continue-btn"
              >
                <span className="btn-icon">→</span>
                المتابعة إلى تفاصيل الدفع
              </button>
            </div>
          )}

          {/* الخطوة 2: تفاصيل الدفع */}
          {paymentStep === 'details' && (
            <div className="payment-step">
              {/* مؤقت العد التنازلي */}
              <div className="countdown-section">
                <div className="countdown-card">
                  <div className="countdown-icon">⏰</div>
                  <div className="countdown-content">
                    <div className="countdown-text">مهلة الدفع</div>
                    <div className="countdown-timer">{formatTime(countdown)}</div>
                    <div className="countdown-warning">
                      يرجى إتمام الدفع قبل انتهاء الوقت
                    </div>
                  </div>
                </div>
              </div>

              {/* محتوى طريقة الدفع المختارة */}
              <div className="payment-details">
                {activeMethod === 'usdt' ? (
                  <div className="usdt-payment">
                    {/* تحذيرات USDT */}
                    <div className="warning-card">
                      <div className="warning-header">
                        <span className="warning-icon">⚠️</span>
                        <h4>تنبيهات مهمة قبل الدفع</h4>
                      </div>
                      <div className="warning-content">
                        <ul className="warning-list">
                          <li>• تأكد من تطابق الشبكة (TRC20, ERC20, إلخ)</li>
                          <li>• تحقق من العنوان أكثر من مرة قبل الإرسال</li>
                          <li>• لا ترسل عملات أخرى غير USDT</li>
                          <li>• العمليات غير قابلة للاسترجاع</li>
                        </ul>
                      </div>
                    </div>

                    {/* اختيار الشبكة */}
                    <div className="network-section">
                      <h4 className="section-subtitle">اختر شبكة التحويل</h4>
                      <div className="networks-grid">
                        {usdtNetworks.map((network) => (
                          <div
                            key={network.id}
                            onClick={() => setSelectedNetwork(network.id)}
                            className={`network-card ${selectedNetwork === network.id ? 'network-active' : ''}`}
                            style={{ '--network-color': network.color }}
                          >
                            <div className="network-header">
                              <div className="network-name">{network.name}</div>
                              {network.popular && (
                                <div className="network-badge">🟢 موصى به</div>
                              )}
                            </div>
                            <div className="network-details">
                              <div className="network-fee">رسوم: {network.fee}</div>
                              <div className="network-speed">{network.speed}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* معلومات المحفظة */}
                    <div className="wallet-section">
                      <div className="wallet-card">
                        <div className="wallet-header">
                          <h4 className="wallet-title">
                            <span className="title-icon">📍</span>
                            معلومات المحفظة
                          </h4>
                          <div className="network-indicator">
                            الشبكة: <span className="network-name">{selectedNetwork}</span>
                          </div>
                        </div>
                        
                        <div className="wallet-info">
                          <div className="info-row">
                            <span className="info-label">عنوان المحفظة:</span>
                            <div className="address-container">
                              <code className="wallet-address">{getWalletAddress()}</code>
                              <button 
                                onClick={() => copyToClipboard(getWalletAddress())}
                                className="copy-btn"
                              >
                                📋 نسخ
                              </button>
                            </div>
                          </div>
                          
                          <div className="info-row">
                            <span className="info-label">المبلغ المطلوب:</span>
                            <span className="amount-display">${amount} USDT</span>
                          </div>
                          
                          <div className="info-row">
                            <span className="info-label">الرسوم التقريبية:</span>
                            <span className="fee-display">
                              {usdtNetworks.find(n => n.id === selectedNetwork)?.fee || '1 USDT'}
                            </span>
                          </div>
                        </div>

                        <div className="wallet-note">
                          <div className="note-icon">💡</div>
                          <p>بعد إتمام التحويل، اضغط على زر تأكيد الدفع وسيتم تفعيل اشتراكك تلقائياً</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeMethod === 'sham_bank' ? (
                  <div className="bank-payment">
                    {/* معلومات البنك */}
                    <div className="bank-info-card">
                      <div className="bank-header">
                        <h4 className="bank-title">
                          <span className="title-icon">🏦</span>
                          معلومات التحويل البنكي
                        </h4>
                      </div>
                      
                      <div className="bank-details">
                        <div className="detail-row">
                          <span className="detail-label">اسم البنك:</span>
                          <span className="detail-value">{paymentInfo?.shamBankInfo?.bankName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">الحساب التاجر:</span>
                          <div className="value-with-copy">
                            <code>{paymentInfo?.shamBankInfo?.merchantAccount}</code>
                            <button 
                              onClick={() => copyToClipboard(paymentInfo?.shamBankInfo?.merchantAccount)}
                              className="copy-btn small"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">اسم المستفيد:</span>
                          <span className="detail-value">{paymentInfo?.shamBankInfo?.beneficiary}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">المبلغ:</span>
                          <span className="detail-value amount">${amount}</span>
                        </div>
                      </div>
                    </div>

                    {/* تعليمات التحويل */}
                    <div className="instructions-card">
                      <h4 className="instructions-title">📋 تعليمات التحويل</h4>
                      <ol className="instructions-list">
                        <li>اذهب إلى أقرب فرع لبنك شام كاش أو استخدم التطبيق</li>
                        <li>أدخل رقم الحساب التاجر أعلاه</li>
                        <li>أدخل المبلغ: <strong>${amount}</strong></li>
                        <li>استخدم رقم المرجع أدناه في وصف التحويل</li>
                      </ol>
                    </div>

                    {/* رقم المرجع */}
                    <div className="reference-section">
                      <div className="reference-card">
                        <div className="reference-header">
                          <span className="reference-icon">🔢</span>
                          <h5>رقم المرجع</h5>
                        </div>
                        <div className="reference-code">
                          {paymentInfo?.shamBankInfo?.referencePrefix}-{Date.now().toString().slice(-6)}
                        </div>
                        <p className="reference-note">
                          يرجى كتابة هذا الرقم في وصف التحويل لتسريع عملية التفعيل
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="test-payment">
                    <div className="test-card">
                      <div className="test-header">
                        <div className="test-icon">🧪</div>
                        <div className="test-content">
                          <h4 className="test-title">الدفع التجريبي</h4>
                          <p className="test-description">
                            هذا الوضع مخصص للتطوير والاختبار. لن يتم خصم أي أموال حقيقية.
                          </p>
                        </div>
                      </div>
                      
                      <div className="test-details">
                        <div className="test-info">
                          <div className="info-item">
                            <span className="item-label">الباقة:</span>
                            <span className="item-value">{getPlanName()}</span>
                          </div>
                          <div className="info-item">
                            <span className="item-label">المدة:</span>
                            <span className="item-value">30 يوم</span>
                          </div>
                          <div className="info-item">
                            <span className="item-label">السعر:</span>
                            <span className="item-value">$0 (تجريبي)</span>
                          </div>
                        </div>
                        
                        <div className="test-features">
                          <h5>الميزات المتضمنة:</h5>
                          <ul>
                            <li>✅ جميع ميزات الباقة المختارة</li>
                            <li>✅ تفعيل فوري</li>
                            <li>✅ دعم كامل للنظام</li>
                            <li>✅ بيانات تجريبية واقعية</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* أزرار التحكم */}
              <div className="payment-controls">
                <button
                  onClick={() => setPaymentStep('method')}
                  className="control-btn secondary"
                >
                  ← العودة
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="control-btn primary"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">✅</span>
                      تأكيد الدفع
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* الخطوة 3: تأكيد النجاح */}
          {paymentStep === 'confirmation' && transactionStatus && (
            <div className="payment-step">
              <div className="confirmation-section">
                <div className="success-card">
                  <div className="success-icon">🎉</div>
                  <div className="success-content">
                    <h3 className="success-title">تم الدفع بنجاح!</h3>
                    <p className="success-message">
                      تم تفعيل {getPlanName()} بنجاح. يمكنك الآن استخدام جميع ميزات النظام.
                    </p>
                    
                    <div className="transaction-details">
                      <div className="detail-item">
                        <span className="detail-label">رقم العملية:</span>
                        <span className="detail-value">{transactionStatus.data.transactionId}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">الباقة:</span>
                        <span className="detail-value">{getPlanName()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">تاريخ البدء:</span>
                        <span className="detail-value">
                          {new Date().toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">تاريخ الانتهاء:</span>
                        <span className="detail-value">
                          {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="next-steps">
                  <h4 className="steps-title">🎯 الخطوات التالية</h4>
                  <div className="steps-list">
                    <div className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <strong>تفعيل البوت</strong>
                        <p>اذهب إلى لوحة التحكم وقم بتفعيل البوت لبدء التداول</p>
                      </div>
                    </div>
                    <div className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <strong>إعداد API Keys</strong>
                        <p>أضف مفاتيح API الخاصة بك من منصات التداول</p>
                      </div>
                    </div>
                    <div className="step-item">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <strong>بدء التداول</strong>
                        <p>شاهد نظام QUANTUM AI TRADING PLATFORM يعمل بأقصى كفاءة</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="confirmation-actions">
                  <button
                    onClick={() => {
                      onClose();
                      window.location.reload();
                    }}
                    className="confirmation-btn primary"
                  >
                    🚀 الانتقال إلى لوحة التحكم
                  </button>
                  <button
                    onClick={onClose}
                    className="confirmation-btn secondary"
                  >
                    موافق
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* رسالة الخطأ */}
          {error && (
            <div className="error-message">
              <div className="error-icon">❌</div>
              <div className="error-content">
                <h4>حدث خطأ</h4>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* معلومات الدعم */}
          <div className="support-section">
            <div className="support-card">
              <div className="support-icon">🆘</div>
              <div className="support-content">
                <h5>بحاجة إلى مساعدة؟</h5>
                <p>فريق الدعم متاح 24/7 لمساعدتك في أي استفسار</p>
                <div className="support-contacts">
                  <span className="contact-item">📧 support@akraa-trade.com</span>
                  <span className="contact-item">📞 +963 123 456 789</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;