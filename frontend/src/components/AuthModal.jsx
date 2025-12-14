import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import EncryptionService from '../services/EncryptionService';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [activeExchanges, setActiveExchanges] = useState({
    mexc: false,
    binance: false,
    kucoin: false,
    okx: false,
    bybit: false,
    gateio: false,
    htx: false,
    coinbase: false,
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    referralCode: '',
    mexcApiKey: '',
    mexcSecret: '',
    binanceApiKey: '',
    binanceSecret: '',
    kucoinApiKey: '',
    kucoinSecret: '',
    kucoinPassphrase: '',
    okxApiKey: '',
    okxSecret: '',
    okxPassphrase: '',
    bybitApiKey: '',
    bybitSecret: '',
    gateioApiKey: '',
    gateioSecret: '',
    htxApiKey: '',
    htxSecret: '',
    coinbaseApiKey: '',
    coinbaseSecret: '',
  });

  // تعريف المنصات المدعومة (نفس البيانات الأصلية)
  const exchanges = [
    { id: 'mexc', name: 'MEXC', icon: '', color: '#00ff88', fields: ['apiKey', 'secret'] },
    { id: 'binance', name: 'Binance', icon: '', color: '#f0b90b', fields: ['apiKey', 'secret'] },
    { id: 'kucoin', name: 'KuCoin', icon: '', color: '#23af91', fields: ['apiKey', 'secret', 'passphrase'] },
    { id: 'okx', name: 'OKX', icon: '⚡', color: '#000000', fields: ['apiKey', 'secret', 'passphrase'] },
    { id: 'bybit', name: 'Bybit', icon: '', color: '#ffcc00', fields: ['apiKey', 'secret'] },
    { id: 'gateio', name: 'Gate.io', icon: '', color: '#2d9cdb', fields: ['apiKey', 'secret'] },
    { id: 'htx', name: 'HTX', icon: '', color: '#00a7f0', fields: ['apiKey', 'secret'] },
    { id: 'coinbase', name: 'Coinbase', icon: '', color: '#0052ff', fields: ['apiKey', 'secret'] },
  ];

  // إغلاق النافذة بـ ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // منع سكرول الـ body عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('auth-modal-open');
    } else {
      document.body.classList.remove('auth-modal-open');
    }

    return () => {
      document.body.classList.remove('auth-modal-open');
    };
  }, [isOpen]);

  // إعادة تعيين النموذج عند الإغلاق
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        referralCode: '',
        mexcApiKey: '',
        mexcSecret: '',
        binanceApiKey: '',
        binanceSecret: '',
        kucoinApiKey: '',
        kucoinSecret: '',
        kucoinPassphrase: '',
        okxApiKey: '',
        okxSecret: '',
        okxPassphrase: '',
        bybitApiKey: '',
        bybitSecret: '',
        gateioApiKey: '',
        gateioSecret: '',
        htxApiKey: '',
        htxSecret: '',
        coinbaseApiKey: '',
        coinbaseSecret: '',
      });
      setErrors({});
      setPasswordStrength(0);
      setShowApiKeys(false);
      setActiveExchanges({
        mexc: false,
        binance: false,
        kucoin: false,
        okx: false,
        bybit: false,
        gateio: false,
        htx: false,
        coinbase: false,
      });
      setActiveTab('login');
    }
  }, [isOpen]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    const strength = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return Object.values(strength).filter(Boolean).length;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // نسخ الأخطاء للتعديل عليها
    const newErrors = { ...errors };

    // التحقق من البريد
    if (name === 'email') {
      if (!validateEmail(value)) {
        newErrors.email = t('auth.errors.invalidEmail');
      } else {
        delete newErrors.email;
      }
    }

    // التحقق من كلمة المرور
    if (name === 'password') {
      const strength = validatePassword(value);
      setPasswordStrength(strength);

      if (value.length < 8) {
        newErrors.password = t('auth.errors.passwordTooShort');
      } else if (strength < 3) {
        newErrors.password = t('auth.errors.passwordWeak');
      } else {
        delete newErrors.password;
      }

      if (formData.confirmPassword && value !== formData.confirmPassword) {
        newErrors.confirmPassword = t('auth.errors.passwordsDontMatch');
      } else if (formData.confirmPassword) {
        delete newErrors.confirmPassword;
      }
    }

    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        newErrors.confirmPassword = t('auth.errors.passwordsDontMatch');
      } else {
        delete newErrors.confirmPassword;
      }
    }

    // التحقق من رقم الهاتف
    if (name === 'phone') {
      const phoneRegex = /^[+]?[0-9]{10,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.phone = t('auth.errors.invalidPhone');
      } else {
        delete newErrors.phone;
      }
    }

    // تحديث حالة المنصة النشطة بناءً على مفاتيح API
    if (name.includes('ApiKey') || name.includes('Secret') || name.includes('Passphrase')) {
      const exchangeId = name.replace(/ApiKey|Secret|Passphrase/g, '').toLowerCase();
      const hasApiKey = (exchangeId && (formData[`${exchangeId}ApiKey`] || value)) || '';
      const hasSecret = (exchangeId && (formData[`${exchangeId}Secret`] || value)) || '';

      setActiveExchanges((prev) => ({
        ...prev,
        [exchangeId]: Boolean(hasApiKey && hasSecret),
      }));
    }

    setErrors(newErrors);
  };

  const toggleExchange = (exchangeId) => {
    setActiveExchanges((prev) => ({
      ...prev,
      [exchangeId]: !prev[exchangeId],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = t('auth.errors.required');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('auth.errors.invalidEmail');
    }

    if (!formData.password) {
      newErrors.password = t('auth.errors.required');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.errors.passwordTooShort');
    } else if (passwordStrength < 3) {
      newErrors.password = t('auth.errors.passwordWeak');
    }

    if (activeTab === 'register') {
      if (!formData.phone) {
        newErrors.phone = t('auth.errors.required');
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = t('auth.errors.required');
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('auth.errors.passwordsDontMatch');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, submit: undefined }));

    try {
      // محاكاة الـ API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (activeTab === 'register') {
        const apiKeysData = {};

        // جمع مفاتيح API للمنصات النشطة فقط
        exchanges.forEach((exchange) => {
          if (activeExchanges[exchange.id]) {
            apiKeysData[exchange.id] = {
              apiKey: formData[`${exchange.id}ApiKey`],
              secret: formData[`${exchange.id}Secret`],
              ...(exchange.fields.includes('passphrase') && {
                passphrase: formData[`${exchange.id}Passphrase`],
              }),
            };
          }
        });

        const encryptedData = {
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          referralCode: formData.referralCode,
          apiKeys: EncryptionService.encryptApiKeys(apiKeysData),
          activeExchanges,
          registrationDate: new Date().toISOString(),
        };

        console.log('Encrypted registration data:', encryptedData);

        if (onAuthSuccess) {
          onAuthSuccess({
            id: `user_${Date.now()}`,
            email: formData.email,
            phone: formData.phone,
            plan: 'free',
            activeExchanges,
            registrationDate: new Date().toISOString(),
          });
        }
      } else {
        // محاكاة تسجيل الدخول
        if (onAuthSuccess) {
          onAuthSuccess({
            id: `user_${Date.now()}`,
            email: formData.email,
            plan: 'pro',
            lastLogin: new Date().toISOString(),
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors((prev) => ({
        ...prev,
        submit: t('auth.errors.networkError'),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return '#f97373';
      case 2:
        return '#facc15';
      case 3:
      case 4:
      case 5:
        return '#4ade80';
      default:
        return '#f97373';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
        return t('auth.passwordStrength.veryWeak');
      case 1:
        return t('auth.passwordStrength.weak');
      case 2:
        return t('auth.passwordStrength.medium');
      case 3:
        return t('auth.passwordStrength.strong');
      case 4:
        return t('auth.passwordStrength.veryStrong');
      case 5:
        return t('auth.passwordStrength.excellent');
      default:
        return t('auth.passwordStrength.veryWeak');
    }
  };

  const renderExchangeFields = (exchange) => {
    if (!activeExchanges[exchange.id]) return null;

    const apiKeyName = `${exchange.id}ApiKey`;
    const secretName = `${exchange.id}Secret`;
    const passphraseName = `${exchange.id}Passphrase`;

    return (
      <div
        key={`${exchange.id}-fields`}
        className="api-exchange-fields-card"
        style={{ borderColor: exchange.color }}
      >
        <div className="api-exchange-header">
          <div className="api-exchange-title">
            <span className="api-exchange-icon">{exchange.icon || '🧬'}</span>
            <span>{exchange.name} Exchange</span>
          </div>
          <span className="api-exchange-status">نشط</span>
        </div>

        <div className="auth-field-inline">
          <label className="auth-label" htmlFor={apiKeyName}>
            {exchange.name} API Key
          </label>
          <input
            id={apiKeyName}
            name={apiKeyName}
            type="text"
            className="auth-input"
            value={formData[apiKeyName]}
            onChange={handleInputChange}
            autoComplete="off"
            disabled={isLoading}
          />
        </div>

        <div className="auth-field-inline">
          <label className="auth-label" htmlFor={secretName}>
            {exchange.name} Secret Key
          </label>
          <input
            id={secretName}
            name={secretName}
            type="password"
            className="auth-input"
            value={formData[secretName]}
            onChange={handleInputChange}
            autoComplete="off"
            disabled={isLoading}
          />
        </div>

        {exchange.fields.includes('passphrase') && (
          <div className="auth-field-inline">
            <label className="auth-label" htmlFor={passphraseName}>
              {exchange.name} Passphrase
            </label>
            <input
              id={passphraseName}
              name={passphraseName}
              type="password"
              className="auth-input"
              value={formData[passphraseName] || ''}
              onChange={handleInputChange}
              autoComplete="off"
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    );
  };

  const renderExchangeToggle = (exchange) => {
    const isActive = activeExchanges[exchange.id];

    return (
      <button
        key={`${exchange.id}-toggle`}
        type="button"
        className={`exchange-toggle-card ${isActive ? 'exchange-toggle-active' : ''}`}
        onClick={() => toggleExchange(exchange.id)}
        style={{ '--exchange-color': exchange.color }}
        disabled={isLoading}
      >
        <div className="exchange-toggle-header">
          <span className="exchange-toggle-icon">{exchange.icon || '📊'}</span>
          <span className="exchange-toggle-name">{exchange.name}</span>
        </div>
        <p className="exchange-toggle-description">
          {exchange.fields.includes('passphrase')
            ? 'API Key, Secret Key, و Passphrase مطلوبة'
            : 'API Key و Secret Key مطلوبان'}
        </p>
        <div className="exchange-toggle-permissions">
          <span>✅ تداول</span>
          <span>✅ رصيد</span>
          <span>✅ قراءة</span>
          {exchange.fields.includes('passphrase') && <span>🛡️ آمن</span>}
        </div>
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" role="dialog" aria-modal="true">
      <div
        className="auth-modal-backdrop"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />
      <div className="auth-modal-container">
        <div className="auth-modal-panel">
          {/* رأس المودال */}
          <header className="auth-modal-header">
            <div className="auth-modal-title-group">
              <h2 className="auth-modal-title">
                {activeTab === 'login' ? t('auth.login') : t('auth.register')}
              </h2>
              <p className="auth-modal-subtitle">
                {activeTab === 'login'
                  ? t('auth.loginSubtitle', 'سجّل دخولك للوصول إلى لوحة التحكم الذكية.')
                  : t(
                      'auth.registerSubtitle',
                      'أنشئ حسابًا وفعّل مفاتيح API لربط منصات التداول بأمان.',
                    )}
              </p>
            </div>
            <button
              type="button"
              className="auth-close-btn"
              onClick={isLoading ? undefined : onClose}
              aria-label={t('auth.close', 'إغلاق')}
            >
              ×
            </button>
          </header>

          {/* التبويبات */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${activeTab === 'login' ? 'auth-tab-active' : ''}`}
              onClick={() => !isLoading && setActiveTab('login')}
              disabled={isLoading}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              className={`auth-tab ${activeTab === 'register' ? 'auth-tab-active' : ''}`}
              onClick={() => !isLoading && setActiveTab('register')}
              disabled={isLoading}
            >
              {t('auth.register')}
            </button>
          </div>

          {/* النموذج */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* البريد الإلكتروني */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email">
                {t('auth.email')} <span className="required">*</span>
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                className={`auth-input ${errors.email ? 'has-error' : ''}`}
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="email"
                disabled={isLoading}
              />
              {errors.email && <div className="auth-error">{errors.email}</div>}
            </div>

            {/* الهاتف (للتسجيل فقط) */}
            {activeTab === 'register' && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-phone">
                  {t('auth.phone')} <span className="required">*</span>
                </label>
                <input
                  id="auth-phone"
                  name="phone"
                  type="tel"
                  className={`auth-input ${errors.phone ? 'has-error' : ''}`}
                  value={formData.phone}
                  onChange={handleInputChange}
                  autoComplete="tel"
                  disabled={isLoading}
                />
                {errors.phone && <div className="auth-error">{errors.phone}</div>}
              </div>
            )}

            {/* كلمة المرور */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password">
                {t('auth.password')} <span className="required">*</span>
              </label>
              <input
                id="auth-password"
                name="password"
                type="password"
                className={`auth-input ${errors.password ? 'has-error' : ''}`}
                value={formData.password}
                onChange={handleInputChange}
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                disabled={isLoading}
              />
              {formData.password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div
                      className="password-strength-fill"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor(),
                      }}
                    />
                  </div>
                  <span className="password-strength-text">
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
              {errors.password && <div className="auth-error">{errors.password}</div>}
            </div>

            {/* تأكيد كلمة المرور (للتسجيل فقط) */}
            {activeTab === 'register' && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-confirm-password">
                  {t('auth.confirmPassword')} <span className="required">*</span>
                </label>
                <input
                  id="auth-confirm-password"
                  name="confirmPassword"
                  type="password"
                  className={`auth-input ${errors.confirmPassword ? 'has-error' : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <div className="auth-error">{errors.confirmPassword}</div>
                )}
              </div>
            )}

            {/* كود الإحالة (اختياري) */}
            {activeTab === 'register' && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-referral">
                  {t('auth.referralCode')} ({t('auth.optional', 'اختياري')})
                </label>
                <input
                  id="auth-referral"
                  name="referralCode"
                  type="text"
                  className="auth-input"
                  value={formData.referralCode}
                  onChange={handleInputChange}
                  autoComplete="off"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* قسم مفاتيح API (للتسجيل فقط) */}
            {activeTab === 'register' && (
              <section className="api-keys-section">
                <div className="api-keys-header">
                  <h3 className="api-keys-title">{t('auth.apiKeys')}</h3>
                  <button
                    type="button"
                    className="api-keys-toggle"
                    onClick={() => setShowApiKeys((prev) => !prev)}
                    disabled={isLoading}
                    aria-expanded={showApiKeys}
                  >
                    {showApiKeys ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>

                {showApiKeys && (
                  <>
                    {/* تحذيرات الأمان */}
                    <div className="api-security-box">
                      <div className="api-security-icon">⚠️</div>
                      <div className="api-security-content">
                        <h4>{t('auth.securityWarning.title')}</h4>
                        <ul>
                          <li>{t('auth.securityWarning.dontShare')}</li>
                          <li>{t('auth.securityWarning.onlyTradePermissions')}</li>
                          <li>{t('auth.securityWarning.noWithdraw')}</li>
                          <li>{t('auth.securityWarning.encrypted')}</li>
                        </ul>
                      </div>
                    </div>

                    {/* اختيار المنصات */}
                    <h4 className="api-section-subtitle">اختر منصات التداول</h4>
                    <div className="exchange-toggle-grid">
                      {exchanges.map(renderExchangeToggle)}
                    </div>

                    {/* حقول المنصات النشطة */}
                    <div className="api-exchanges-fields-grid">
                      {exchanges.map(renderExchangeFields)}
                    </div>

                    {/* الصلاحيات الآمنة */}
                    <div className="api-safe-permissions">
                      <h4>✅ {t('auth.safePermissions.title')}</h4>
                      <ul>
                        <li>✓ {t('auth.safePermissions.trade')}</li>
                        <li>✓ {t('auth.safePermissions.read')}</li>
                        <li>✓ {t('auth.safePermissions.balance')}</li>
                        <li>✗ {t('auth.safePermissions.withdraw')}</li>
                        <li>✗ {t('auth.safePermissions.transfer')}</li>
                      </ul>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* رسالة الخطأ العامة */}
            {errors.submit && (
              <div className="auth-submit-error">
                <span className="auth-error-icon">❌</span>
                <span>{errors.submit}</span>
              </div>
            )}

            {/* زر الإرسال */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="auth-spinner" />
                  <span>{t('auth.processing')}</span>
                </>
              ) : (
                <span>
                  {activeTab === 'login' ? t('auth.login') : t('auth.register')}
                </span>
              )}
            </button>

            {/* روابط إضافية */}
            {activeTab === 'login' && (
              <div className="auth-extra-links">
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    // يمكن ربطها بصفحة استعادة كلمة المرور لاحقاً
                    console.log('Forgot password clicked');
                  }}
                  disabled={isLoading}
                >
                  {t('auth.forgotPassword')}
                </button>
                <span className="auth-link-separator">•</span>
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => !isLoading && setActiveTab('register')}
                  disabled={isLoading}
                >
                  {t('auth.createAccount')}
                </button>
              </div>
            )}

            {/* رسالة الخصوصية */}
            <p className="auth-privacy">
              <span className="privacy-icon">🔒</span>
              <span className="privacy-text">
                {t('auth.privacy.title')}: {t('auth.privacy.description')}
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
