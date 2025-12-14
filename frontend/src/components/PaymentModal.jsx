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
  const [paymentStep, setPaymentStep] = useState('method'); // method | details | confirmation
  const [countdown, setCountdown] = useState(900); // 15 minutes
  const [transactionStatus, setTransactionStatus] = useState(null);

  const modalRef = useRef(null);

  // أسعار الخطط (كما في الملف الأصلي)
  const planPrices = {
    basic: 29,
    medium: 99,
    professional: 149,
  };
  const amount = planPrices[plan] || 29;

  // إغلاق بـ ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // عد تنازلي عند فتح خطوة التفاصيل
  useEffect(() => {
    let interval;

    if (isOpen && paymentStep === 'details') {
      interval = setInterval(() => {
        setCountdown((prev) => {
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

  // جلب معلومات الدفع (حالياً Mock كما في الكود الأصلي)
  const fetchPaymentInfo = async () => {
    try {
      const mockPaymentInfo = {
        methods: [
          {
            id: 'usdt',
            name: 'USDT',
            icon: '💸',
            description: 'أسرع وأأمن طريقة دفع عالمية',
            features: ['تحويل فوري', 'رسوم منخفضة', 'مدعوم عالمياً'],
            color: '#00ff88',
          },
          {
            id: 'sham_bank',
            name: 'بنك شام كاش',
            icon: '🏦',
            description: 'تحويل آمن عبر الحساب التاجر',
            features: ['تحويل محلي', 'دعم فوري', 'آمن ومضمون'],
            color: '#00a3ff',
          },
          {
            id: 'dev_test',
            name: 'دفع تجريبي',
            icon: '🧪',
            description: 'تفعيل فوري بدون دفع',
            isTest: true,
            features: ['تفعيل فوري', 'بدون تكلفة', 'لأغراض التطوير'],
            color: '#a855f7',
          },
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
              color: '#ff6b35',
            },
            {
              id: 'ERC20',
              address: '0x7a8d9fC5B5e5E5b5e5D5c5B5a5F5e5D5c5B5a5F5e',
              name: 'ERC20',
              fee: '10 USDT',
              popular: false,
              speed: 'بطيء',
              color: '#627eea',
            },
            {
              id: 'BEP20',
              address: '0x7a8d9fC5B5e5E5b5e5D5c5B5a5F5e5D5c5B5a5F5e',
              name: 'BEP20',
              fee: '1 USDT',
              popular: true,
              speed: 'متوسط',
              color: '#f0b90b',
            },
            {
              id: 'POLYGON',
              address: '0x7a8d9fC5B5e5E5b5e5D5c5B5a5F5e5D5c5B5a5F5e',
              name: 'Polygon',
              fee: '0.1 USDT',
              popular: false,
              speed: 'سريع جداً',
              color: '#8247e5',
            },
          ],
        },
        shamBankInfo: {
          merchantAccount: 'SY789-654321-888',
          beneficiary: 'Strong Akraa Trading',
          referencePrefix: 'AKR',
          bankName: 'بنك شام كاش',
          swiftCode: 'SHAMSYPP',
        },
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
        amount,
        plan,
        network: activeMethod === 'usdt' ? selectedNetwork : null,
        reference:
          activeMethod === 'sham_bank'
            ? `AKR-${Date.now().toString().slice(-6)}`
            : null,
      };

      console.log('إرسال بيانات الدفع:', paymentData);

      // محاكاة اتصال بالخادم
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const mockResponse = {
        success: true,
        message: 'تمت عملية الدفع بنجاح ✅ سيتم تفعيل اشتراكك فوراً',
        data: {
          transactionId: `TX-${Date.now()}`,
          subscription: {
            plan,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          user: {
            name: user?.name || 'مستخدم Strong Akraa',
            email: user?.email || 'test@akraa.com',
          },
        },
      };

      setTransactionStatus(mockResponse);
      setPaymentStep('confirmation');
      console.log('✅ عملية الدفع ناجحة:', mockResponse.data);
    } catch (err) {
      console.error('خطأ في معالجة الدفع:', err);
      setError('حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, buttonEl) => {
    if (!navigator.clipboard) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (!buttonEl) return;
        const originalText = buttonEl.innerHTML;
        buttonEl.innerHTML = '✅ تم النسخ!';
        buttonEl.style.background = '#22d3ee';
        buttonEl.style.color = '#020617';

        setTimeout(() => {
          buttonEl.innerHTML = originalText;
          buttonEl.style.background = '';
          buttonEl.style.color = '';
        }, 2000);
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
      });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const getPlanName = () => {
    const plans = {
      basic: 'الباقة الأساسية',
      medium: 'الباقة المتوسطة',
      professional: 'الباقة الاحترافية',
    };
    return plans[plan] || 'الباقة الأساسية';
  };

  const getWalletAddress = () => {
    const network = paymentInfo?.walletInfo?.networks?.find(
      (n) => n.id === selectedNetwork,
    );
    return network?.address || 'TJX5m8K9pQ2sR7tN1vW3yZ6xL4dF8gH0j';
  };

  if (!isOpen) return null;

  const paymentMethods = paymentInfo?.methods || [];
  const usdtNetworks = paymentInfo?.walletInfo?.networks || [];

  return (
    <div className="payment-modal-overlay" role="dialog" aria-modal="true">
      <div
        className="payment-modal-backdrop"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />
      <div className="payment-modal-container">
        <div className="payment-modal-panel" ref={modalRef}>
          {/* رأس المودال */}
          <header className="payment-header">
            <div className="payment-title-group">
              <h2 className="payment-title">إتمام عملية الدفع</h2>
              <p className="payment-subtitle">
                {getPlanName()} - نظام QUANTUM AI TRADER
              </p>
            </div>
            <button
              type="button"
              className="payment-close-btn"
              onClick={loading ? undefined : onClose}
              aria-label="إغلاق"
            >
              ×
            </button>
          </header>

          {/* شريط الخطوات */}
          <div className="payment-steps">
            <div
              className={`payment-step ${
                paymentStep === 'method' ? 'payment-step-active' : ''
              }`}
            >
              <span className="payment-step-index">1</span>
              <span className="payment-step-label">اختيار طريقة الدفع</span>
            </div>
            <div
              className={`payment-step ${
                paymentStep === 'details' ? 'payment-step-active' : ''
              }`}
            >
              <span className="payment-step-index">2</span>
              <span className="payment-step-label">تفاصيل الدفع</span>
            </div>
            <div
              className={`payment-step ${
                paymentStep === 'confirmation' ? 'payment-step-active' : ''
              }`}
            >
              <span className="payment-step-index">3</span>
              <span className="payment-step-label">التأكيد</span>
            </div>
          </div>

          {/* محتوى المودال */}
          <div className="payment-body">
            {/* الخطوة 1: اختيار طريقة الدفع */}
            {paymentStep === 'method' && (
              <section className="payment-step-content">
                <div className="amount-card">
                  <div className="amount-label">المبلغ المطلوب</div>
                  <div className="amount-value">${amount}</div>
                  <div className="amount-plan">
                    {getPlanName()} <span className="amount-plan-period">شهرياً</span>
                  </div>
                </div>

                <div className="methods-section">
                  <h3 className="section-title">اختر طريقة الدفع</h3>

                  {paymentInfo ? (
                    <div className="methods-grid">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          className={`method-card ${
                            activeMethod === method.id ? 'method-active' : ''
                          } ${method.isTest ? 'method-test' : ''}`}
                          style={{ '--method-color': method.color }}
                          onClick={() => setActiveMethod(method.id)}
                          disabled={loading}
                        >
                          <div className="method-header">
                            <span className="method-icon">
                              {method.icon || '💳'}
                            </span>
                            <span className="method-name">{method.name}</span>
                          </div>
                          <p className="method-description">
                            {method.description}
                          </p>
                          <ul className="method-features">
                            {method.features?.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                          {method.isTest && (
                            <span className="method-test-badge">وضع تجريبي</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="payment-loading">
                      <div className="payment-spinner" />
                      <span>جارٍ تحميل طرق الدفع...</span>
                    </div>
                  )}
                </div>

                <div className="payment-actions">
                  <button
                    type="button"
                    className="control-btn primary wide"
                    onClick={() => setPaymentStep('details')}
                    disabled={!activeMethod || !paymentInfo}
                  >
                    → المتابعة إلى تفاصيل الدفع
                  </button>
                </div>
              </section>
            )}

            {/* الخطوة 2: تفاصيل الدفع */}
            {paymentStep === 'details' && (
              <section className="payment-step-content">
                {/* العد التنازلي */}
                <div className="countdown-card">
                  <div className="countdown-icon">⏰</div>
                  <div className="countdown-content">
                    <div className="countdown-label">مهلة الدفع</div>
                    <div className="countdown-time">{formatTime(countdown)}</div>
                    <p className="countdown-note">
                      يرجى إتمام الدفع قبل انتهاء الوقت
                    </p>
                  </div>
                </div>

                {/* محتوى حسب طريقة الدفع */}
                {activeMethod === 'usdt' && (
                  <div className="usdt-details">
                    <div className="warning-box">
                      <div className="warning-icon">⚠️</div>
                      <div className="warning-content">
                        <h4>تنبيهات مهمة قبل الدفع</h4>
                        <ul>
                          <li>تأكد من تطابق الشبكة (TRC20, ERC20, إلخ)</li>
                          <li>تحقق من العنوان أكثر من مرة قبل الإرسال</li>
                          <li>لا ترسل عملات أخرى غير USDT</li>
                          <li>العمليات غير قابلة للاسترجاع</li>
                        </ul>
                      </div>
                    </div>

                    <h4 className="section-subtitle">اختر شبكة التحويل</h4>
                    <div className="network-grid">
                      {usdtNetworks.map((network) => (
                        <button
                          key={network.id}
                          type="button"
                          className={`network-card ${
                            selectedNetwork === network.id ? 'network-active' : ''
                          }`}
                          style={{ '--network-color': network.color }}
                          onClick={() => setSelectedNetwork(network.id)}
                          disabled={loading}
                        >
                          <div className="network-header">
                            <span className="network-name">{network.name}</span>
                            {network.popular && (
                              <span className="network-badge">موصى به</span>
                            )}
                          </div>
                          <div className="network-meta">
                            <span>رسوم: {network.fee}</span>
                            <span>{network.speed}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="wallet-info">
                      <h4>معلومات المحفظة</h4>
                      <div className="wallet-row">
                        <span className="wallet-label">الشبكة:</span>
                        <span className="wallet-value">{selectedNetwork}</span>
                      </div>
                      <div className="wallet-row">
                        <span className="wallet-label">عنوان المحفظة:</span>
                        <div className="wallet-value-copy">
                          <code className="wallet-address">
                            {getWalletAddress()}
                          </code>
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={(e) =>
                              copyToClipboard(
                                getWalletAddress(),
                                e.currentTarget,
                              )
                            }
                            disabled={loading}
                          >
                            نسخ
                          </button>
                        </div>
                      </div>
                      <div className="wallet-row">
                        <span className="wallet-label">المبلغ المطلوب:</span>
                        <span className="wallet-value">
                          ${amount} USDT
                        </span>
                      </div>
                      <div className="wallet-row">
                        <span className="wallet-label">الرسوم التقريبية:</span>
                        <span className="wallet-value">
                          {usdtNetworks.find((n) => n.id === selectedNetwork)?.fee ||
                            '1 USDT'}
                        </span>
                      </div>
                      <p className="wallet-note">
                        بعد إتمام التحويل، اضغط على زر تأكيد الدفع وسيتم تفعيل
                        اشتراكك تلقائياً.
                      </p>
                    </div>
                  </div>
                )}

                {activeMethod === 'sham_bank' && (
                  <div className="bank-details">
                    <h4 className="section-subtitle">معلومات التحويل البنكي</h4>
                    <div className="bank-grid">
                      <div className="bank-field">
                        <span className="field-label">اسم البنك:</span>
                        <span className="field-value">
                          {paymentInfo?.shamBankInfo?.bankName}
                        </span>
                      </div>
                      <div className="bank-field">
                        <span className="field-label">الحساب التاجر:</span>
                        <div className="field-value-copy">
                          <code className="wallet-address">
                            {paymentInfo?.shamBankInfo?.merchantAccount}
                          </code>
                          <button
                            type="button"
                            className="copy-btn small"
                            onClick={(e) =>
                              copyToClipboard(
                                paymentInfo?.shamBankInfo?.merchantAccount || '',
                                e.currentTarget,
                              )
                            }
                            disabled={loading}
                          >
                            نسخ
                          </button>
                        </div>
                      </div>
                      <div className="bank-field">
                        <span className="field-label">اسم المستفيد:</span>
                        <span className="field-value">
                          {paymentInfo?.shamBankInfo?.beneficiary}
                        </span>
                      </div>
                      <div className="bank-field">
                        <span className="field-label">المبلغ:</span>
                        <span className="field-value">${amount}</span>
                      </div>
                    </div>

                    <h4 className="section-subtitle">تعليمات التحويل</h4>
                    <ol className="bank-instructions">
                      <li>اذهب إلى أقرب فرع لبنك شام كاش أو استخدم التطبيق.</li>
                      <li>أدخل رقم الحساب التاجر أعلاه.</li>
                      <li>أدخل المبلغ: ${amount}.</li>
                      <li>استخدم رقم المرجع في وصف التحويل.</li>
                    </ol>

                    <div className="reference-box">
                      <div className="field-label">رقم المرجع (مثال):</div>
                      <div className="reference-value">
                        {paymentInfo?.shamBankInfo?.referencePrefix}-
                        {Date.now().toString().slice(-6)}
                      </div>
                      <p className="reference-note">
                        يرجى كتابة هذا الرقم في وصف التحويل لتسريع عملية التفعيل.
                      </p>
                    </div>
                  </div>
                )}

                {activeMethod === 'dev_test' && (
                  <div className="devtest-details">
                    <h4 className="section-subtitle">الدفع التجريبي</h4>
                    <p>
                      هذا الوضع مخصص للتطوير والاختبار. لن يتم خصم أي أموال حقيقية.
                    </p>
                    <ul className="devtest-list">
                      <li>الباقة: {getPlanName()}</li>
                      <li>المدة: 30 يوم</li>
                      <li>السعر: $0 (تجريبي)</li>
                    </ul>
                    <p className="devtest-note">
                      سيتم تفعيل جميع ميزات الباقة المختارة باستخدام بيانات تجريبية
                      واقعية.
                    </p>
                  </div>
                )}

                <div className="payment-actions">
                  <button
                    type="button"
                    className="control-btn secondary"
                    onClick={() => setPaymentStep('method')}
                    disabled={loading}
                  >
                    ← العودة
                  </button>
                  <button
                    type="button"
                    className="control-btn primary"
                    onClick={handlePayment}
                    disabled={loading}
                  >
                    {loading ? 'جاري المعالجة...' : '✅ تأكيد الدفع'}
                  </button>
                </div>
              </section>
            )}

            {/* الخطوة 3: تأكيد النجاح */}
            {paymentStep === 'confirmation' && transactionStatus && (
              <section className="payment-step-content confirmation-step">
                <h3 className="confirmation-title">تم الدفع بنجاح!</h3>
                <p className="confirmation-text">
                  تم تفعيل {getPlanName()} بنجاح. يمكنك الآن استخدام جميع ميزات النظام.
                </p>

                <div className="confirmation-grid">
                  <div className="confirmation-card">
                    <div className="confirmation-label">رقم العملية</div>
                    <div className="confirmation-value">
                      {transactionStatus.data.transactionId}
                    </div>
                  </div>
                  <div className="confirmation-card">
                    <div className="confirmation-label">الباقة</div>
                    <div className="confirmation-value">{getPlanName()}</div>
                  </div>
                  <div className="confirmation-card">
                    <div className="confirmation-label">تاريخ البدء</div>
                    <div className="confirmation-value">
                      {new Date().toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                  <div className="confirmation-card">
                    <div className="confirmation-label">تاريخ الانتهاء</div>
                    <div className="confirmation-value">
                      {new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>

                <div className="next-steps">
                  <h4>الخطوات التالية</h4>
                  <ol>
                    <li>تفعيل البوت: اذهب إلى لوحة التحكم وقم بتفعيل البوت.</li>
                    <li>إعداد API Keys: أضف مفاتيح API من منصات التداول.</li>
                    <li>بدء التداول: راقب أداء نظام QUANTUM AI TRADING PLATFORM.</li>
                  </ol>
                </div>

                <button
                  type="button"
                  className="confirmation-btn primary"
                  onClick={() => {
                    onClose();
                    window.location.reload();
                  }}
                >
                  الانتقال إلى لوحة التحكم
                </button>
              </section>
            )}
          </div>

          {/* رسالة الخطأ العامة */}
          {error && (
            <div className="payment-error-banner">
              <span className="error-icon">❌</span>
              <div className="error-text">
                <div className="error-title">حدث خطأ</div>
                <div className="error-message">{error}</div>
              </div>
            </div>
          )}

          {/* معلومات الدعم */}
          <footer className="payment-footer">
            <div className="support-title">بحاجة إلى مساعدة؟</div>
            <div className="support-text">
              فريق الدعم متاح 24/7 لمساعدتك في أي استفسار.
            </div>
            <div className="support-contact">
              <span>support@akraa-trade.com</span>
              <span>•</span>
              <span>+963 123 456 789</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
