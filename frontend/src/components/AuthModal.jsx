import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import EncryptionService from '../services/EncryptionService';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // البيانات الأساسية
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    referralCode: '',
    
    // مفاتيح API للمنصات
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
    coinbaseSecret: ''
  });
  
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
    coinbase: false
  });

  // تعريف المنصات المدعومة
  const exchanges = [
    {
      id: 'mexc',
      name: 'MEXC',
      icon: '📊',
      color: '#00ff88',
      fields: ['apiKey', 'secret']
    },
    {
      id: 'binance',
      name: 'Binance',
      icon: '💎',
      color: '#f0b90b',
      fields: ['apiKey', 'secret']
    },
    {
      id: 'kucoin',
      name: 'KuCoin',
      icon: '🔷',
      color: '#23af91',
      fields: ['apiKey', 'secret', 'passphrase']
    },
    {
      id: 'okx',
      name: 'OKX',
      icon: '⚡',
      color: '#000000',
      fields: ['apiKey', 'secret', 'passphrase']
    },
    {
      id: 'bybit',
      name: 'Bybit',
      icon: '🚀',
      color: '#ffcc00',
      fields: ['apiKey', 'secret']
    },
    {
      id: 'gateio',
      name: 'Gate.io',
      icon: '🚪',
      color: '#2d9cdb',
      fields: ['apiKey', 'secret']
    },
    {
      id: 'htx',
      name: 'HTX',
      icon: '🔥',
      color: '#00a7f0',
      fields: ['apiKey', 'secret']
    },
    {
      id: 'coinbase',
      name: 'Coinbase',
      icon: '🏦',
      color: '#0052ff',
      fields: ['apiKey', 'secret']
    }
  ];

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

  // إدارة حالة body عند فتح/إغلاق النافذة
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

  // إعادة تعيين النموذج عند فتح/إغلاق النافذة
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '', password: '', confirmPassword: '', phone: '', referralCode: '',
        mexcApiKey: '', mexcSecret: '',
        binanceApiKey: '', binanceSecret: '',
        kucoinApiKey: '', kucoinSecret: '', kucoinPassphrase: '',
        okxApiKey: '', okxSecret: '', okxPassphrase: '',
        bybitApiKey: '', bybitSecret: '',
        gateioApiKey: '', gateioSecret: '',
        htxApiKey: '', htxSecret: '',
        coinbaseApiKey: '', coinbaseSecret: ''
      });
      setErrors({});
      setPasswordStrength(0);
      setActiveExchanges({
        mexc: false, binance: false, kucoin: false, okx: false,
        bybit: false, gateio: false, htx: false, coinbase: false
      });
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
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return Object.values(strength).filter(Boolean).length;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // التحقق من صحة المدخلات في الوقت الحقيقي
    let newErrors = { ...errors };
    
    if (name === 'email') {
      if (!validateEmail(value)) {
        newErrors.email = t('auth.errors.invalidEmail');
      } else {
        delete newErrors.email;
      }
    }

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

      // التحقق من تطابق كلمات المرور
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

    if (name === 'phone') {
      const phoneRegex = /^[\+]?[0-9]{10,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.phone = t('auth.errors.invalidPhone');
      } else {
        delete newErrors.phone;
      }
    }

    // تحديث حالة المنصة النشطة
    if (name.includes('ApiKey') || name.includes('Secret')) {
      const exchangeId = name.replace(/ApiKey|Secret|Passphrase/g, '').toLowerCase();
      const hasApiKey = formData[`${exchangeId}ApiKey`] || value;
      const hasSecret = formData[`${exchangeId}Secret`] || value;
      
      if (hasApiKey && hasSecret) {
        setActiveExchanges(prev => ({
          ...prev,
          [exchangeId]: true
        }));
      } else {
        setActiveExchanges(prev => ({
          ...prev,
          [exchangeId]: false
        }));
      }
    }

    setErrors(newErrors);
  };

  const toggleExchange = (exchangeId) => {
    setActiveExchanges(prev => ({
      ...prev,
      [exchangeId]: !prev[exchangeId]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = t('auth.errors.required');
    else if (!validateEmail(formData.email)) newErrors.email = t('auth.errors.invalidEmail');

    if (!formData.password) newErrors.password = t('auth.errors.required');
    else if (formData.password.length < 8) newErrors.password = t('auth.errors.passwordTooShort');
    else if (passwordStrength < 3) newErrors.password = t('auth.errors.passwordWeak');

    if (activeTab === 'register') {
      if (!formData.phone) newErrors.phone = t('auth.errors.required');
      if (!formData.confirmPassword) newErrors.confirmPassword = t('auth.errors.required');
      else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('auth.errors.passwordsDontMatch');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // محاكاة عملية المصادقة
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (activeTab === 'register') {
        const apiKeysData = {};
        
        // جمع مفاتيح API للمنصات النشطة فقط
        exchanges.forEach(exchange => {
          if (activeExchanges[exchange.id]) {
            apiKeysData[exchange.id] = {
              apiKey: formData[`${exchange.id}ApiKey`],
              secret: formData[`${exchange.id}Secret`],
              ...(exchange.fields.includes('passphrase') && {
                passphrase: formData[`${exchange.id}Passphrase`]
              })
            };
          }
        });

        const encryptedData = {
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          referralCode: formData.referralCode,
          apiKeys: EncryptionService.encryptApiKeys(apiKeysData),
          activeExchanges: activeExchanges,
          registrationDate: new Date().toISOString()
        };

        console.log('Encrypted registration data:', encryptedData);
        
        // محاكاة نجاح التسجيل
        if (onAuthSuccess) {
          onAuthSuccess({
            id: 'user_' + Date.now(),
            email: formData.email,
            phone: formData.phone,
            plan: 'free',
            activeExchanges: activeExchanges,
            registrationDate: new Date().toISOString()
          });
        }
      } else {
        // محاكاة تسجيل الدخول
        if (onAuthSuccess) {
          onAuthSuccess({
            id: 'user_' + Date.now(),
            email: formData.email,
            plan: 'pro',
            lastLogin: new Date().toISOString()
          });
        }
      }

      onClose();
      
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors({ submit: t('auth.errors.networkError') });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return '#ff3b5c';
      case 1: return '#ff3b5c';
      case 2: return '#ff9f1c';
      case 3: return '#00ff88';
      case 4: return '#00ff88';
      case 5: return '#00ff88';
      default: return '#ff3b5c';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return t('auth.passwordStrength.veryWeak');
      case 1: return t('auth.passwordStrength.weak');
      case 2: return t('auth.passwordStrength.medium');
      case 3: return t('auth.passwordStrength.strong');
      case 4: return t('auth.passwordStrength.veryStrong');
      case 5: return t('auth.passwordStrength.excellent');
      default: return t('auth.passwordStrength.veryWeak');
    }
  };

  const renderExchangeFields = (exchange) => {
    if (!activeExchanges[exchange.id]) return null;

    return (
      <div className={`exchange-api-section exchange-${exchange.id}`}>
        <div className="exchange-header">
          <h4 className="exchange-title">
            <span className="exchange-icon">{exchange.icon}</span>
            {exchange.name} Exchange
          </h4>
          <span className="exchange-badge">نشط</span>
        </div>
        
        <div className="api-inputs-grid">
          <div className="api-input-group">
            <label className="api-input-label">
              <span>🔑</span>
              {exchange.name} API Key
            </label>
            <input
              type="password"
              name={`${exchange.id}ApiKey`}
              value={formData[`${exchange.id}ApiKey`]}
              onChange={handleInputChange}
              className="api-key-input"
              placeholder={`أدخل ${exchange.name} API Key`}
              disabled={isLoading}
            />
          </div>
          
          <div className="api-input-group">
            <label className="api-input-label">
              <span>🗝️</span>
              {exchange.name} Secret Key
            </label>
            <input
              type="password"
              name={`${exchange.id}Secret`}
              value={formData[`${exchange.id}Secret`]}
              onChange={handleInputChange}
              className="api-key-input"
              placeholder={`أدخل ${exchange.name} Secret Key`}
              disabled={isLoading}
            />
          </div>

          {exchange.fields.includes('passphrase') && (
            <div className="api-input-group">
              <label className="api-input-label">
                <span>🔒</span>
                {exchange.name} Passphrase
              </label>
              <input
                type="password"
                name={`${exchange.id}Passphrase`}
                value={formData[`${exchange.id}Passphrase`]}
                onChange={handleInputChange}
                className="api-key-input"
                placeholder={`أدخل ${exchange.name} Passphrase`}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExchangeToggle = (exchange) => (
    <div 
      key={exchange.id}
      className={`method-card ${activeExchanges[exchange.id] ? 'method-active' : ''}`}
      style={{ 
        '--method-color': exchange.color,
        '--exchange-color': exchange.color
      }}
      onClick={() => toggleExchange(exchange.id)}
    >
      <div className="method-header">
        <div className="method-icon" style={{ color: exchange.color }}>
          {exchange.icon}
        </div>
        <div className="method-info">
          <h4 className="method-name">{exchange.name}</h4>
          <p className="method-description">
            {exchange.fields.includes('passphrase') 
              ? 'API Key, Secret Key, و Passphrase مطلوبة'
              : 'API Key و Secret Key مطلوبان'
            }
          </p>
        </div>
        <div className="method-check">
          <div className="check-circle"></div>
        </div>
      </div>
      
      <div className="method-features">
        <span className="feature-tag">💰 تداول</span>
        <span className="feature-tag">📊 رصيد</span>
        <span className="feature-tag">👁️ قراءة</span>
        {exchange.fields.includes('passphrase') && (
          <span className="feature-tag">🔒 آمن</span>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-container">
        {/* تأثيرات الخلفية */}
        <div className="auth-modal-background">
          <div className="quantum-particles"></div>
          <div className="neon-grid-pattern"></div>
        </div>

        {/* النافذة الرئيسية */}
        <div className="auth-modal-content">
          {/* رأس النافذة */}
          <div className="auth-modal-header">
            <div className="auth-modal-title">
              <div className="auth-modal-icon">
                {activeTab === 'login' ? '🔐' : '🚀'}
              </div>
              <h2 className="auth-modal-title-text">
                {activeTab === 'login' ? t('auth.login') : t('auth.register')}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="auth-modal-close-btn"
              disabled={isLoading}
              aria-label="إغلاق نافذة المصادقة"
            >
              <span className="close-icon">&times;</span>
            </button>
          </div>

          {/* أزرار التبويب */}
          <div className="auth-modal-tabs">
            <button
              onClick={() => !isLoading && setActiveTab('login')}
              className={`auth-tab ${activeTab === 'login' ? 'auth-tab-active' : ''}`}
              disabled={isLoading}
              type="button"
            >
              <span className="tab-icon">🔐</span>
              {t('auth.login')}
            </button>
            <button
              onClick={() => !isLoading && setActiveTab('register')}
              className={`auth-tab ${activeTab === 'register' ? 'auth-tab-active' : ''}`}
              disabled={isLoading}
              type="button"
            >
              <span className="tab-icon">🚀</span>
              {t('auth.register')}
            </button>
          </div>

          {/* نموذج المصادقة */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* البريد الإلكتروني */}
            <div className="form-group">
              <label className="form-label">
                <span>📧</span>
                {t('auth.email')} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                placeholder="example@domain.com"
                disabled={isLoading}
                required
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <span className="form-error" id="email-error">
                  <span>⚠️</span>
                  {errors.email}
                </span>
              )}
            </div>

            {/* رقم الهاتف (للتسجيل فقط) */}
            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label">
                  <span>📱</span>
                  {t('auth.phone')} *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                  placeholder="+1234567890"
                  disabled={isLoading}
                  required
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
                {errors.phone && (
                  <span className="form-error" id="phone-error">
                    <span>⚠️</span>
                    {errors.phone}
                  </span>
                )}
              </div>
            )}

            {/* كلمة المرور */}
            <div className="form-group">
              <label className="form-label">
                <span>🔒</span>
                {t('auth.password')} *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                placeholder="••••••••"
                disabled={isLoading}
                required
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {formData.password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div 
                      className="password-strength-fill"
                      style={{ 
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    ></div>
                  </div>
                  <span className="password-strength-text">
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
              {errors.password && (
                <span className="form-error" id="password-error">
                  <span>⚠️</span>
                  {errors.password}
                </span>
              )}
            </div>

            {/* تأكيد كلمة المرور (للتسجيل فقط) */}
            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label">
                  <span>🔏</span>
                  {t('auth.confirmPassword')} *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                  aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                />
                {errors.confirmPassword && (
                  <span className="form-error" id="confirm-password-error">
                    <span>⚠️</span>
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            )}

            {/* كود الإحالة (للتسجيل فقط) */}
            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label">
                  <span>👥</span>
                  {t('auth.referralCode')} (اختياري)
                </label>
                <input
                  type="text"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="أدخل كود الإحالة"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* قسم مفاتيح API (للتسجيل فقط) */}
            {activeTab === 'register' && (
              <div className="api-keys-section">
                <div className="api-keys-header">
                  <h3 className="api-keys-title">
                    <span>🔑</span>
                    {t('auth.apiKeys')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="api-keys-toggle"
                    disabled={isLoading}
                    aria-expanded={showApiKeys}
                  >
                    {showApiKeys ? '👁️ إخفاء' : '👁️ إظهار'}
                  </button>
                </div>

                {showApiKeys && (
                  <div className="api-keys-content">
                    {/* تحذيرات الأمان */}
                    <div className="security-warning">
                      <div className="warning-icon">⚠️</div>
                      <div className="warning-content">
                        <h4 className="warning-title">{t('auth.securityWarning.title')}</h4>
                        <ul className="warning-list">
                          <li>• {t('auth.securityWarning.dontShare')}</li>
                          <li>• {t('auth.securityWarning.onlyTradePermissions')}</li>
                          <li>• {t('auth.securityWarning.noWithdraw')}</li>
                          <li>• {t('auth.securityWarning.encrypted')}</li>
                        </ul>
                      </div>
                    </div>

                    {/* اختيار المنصات */}
                    <div className="methods-section">
                      <h4 className="section-title">
                        <span className="title-icon">🏪</span>
                        اختر منصات التداول
                      </h4>
                      <div className="methods-grid">
                        {exchanges.map(renderExchangeToggle)}
                      </div>
                    </div>

                    {/* حقول API للمنصات المختارة */}
                    <div className="exchanges-container">
                      {exchanges.map(renderExchangeFields)}
                    </div>

                    {/* الصلاحيات الآمنة */}
                    <div className="permissions-info">
                      <h4 className="permissions-title">
                        <span>✅</span>
                        {t('auth.safePermissions.title')}
                      </h4>
                      <div className="permissions-grid">
                        <div className="permission-allowed">
                          <span className="permission-icon">✓</span>
                          {t('auth.safePermissions.trade')}
                        </div>
                        <div className="permission-allowed">
                          <span className="permission-icon">✓</span>
                          {t('auth.safePermissions.read')}
                        </div>
                        <div className="permission-allowed">
                          <span className="permission-icon">✓</span>
                          {t('auth.safePermissions.balance')}
                        </div>
                        <div className="permission-denied">
                          <span className="permission-icon">✗</span>
                          {t('auth.safePermissions.withdraw')}
                        </div>
                        <div className="permission-denied">
                          <span className="permission-icon">✗</span>
                          {t('auth.safePermissions.transfer')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* رسالة الخطأ العامة */}
            {errors.submit && (
              <div className="form-submit-error">
                <span className="error-icon">❌</span>
                {errors.submit}
              </div>
            )}

            {/* زر الإرسال */}
            <button
              type="submit"
              className={`auth-submit-btn ${isLoading ? 'auth-submit-loading' : ''}`}
              disabled={isLoading || Object.keys(errors).length > 0}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  {t('auth.processing')}
                </>
              ) : (
                <>
                  <span className="btn-icon">
                    {activeTab === 'login' ? '🔐' : '🚀'}
                  </span>
                  {activeTab === 'login' ? t('auth.login') : t('auth.register')}
                </>
              )}
            </button>
          </form>

          {/* روابط إضافية */}
          <div className="auth-modal-footer">
            {activeTab === 'login' && (
              <div className="auth-footer-links">
                <button 
                  type="button"
                  className="footer-link" 
                  disabled={isLoading}
                >
                  {t('auth.forgotPassword')}
                </button>
                <span className="footer-separator">•</span>
                <button 
                  type="button"
                  className="footer-link"
                  onClick={() => !isLoading && setActiveTab('register')}
                  disabled={isLoading}
                >
                  {t('auth.createAccount')}
                </button>
              </div>
            )}

            {/* رسالة الخصوصية */}
            <div className="privacy-notice">
              <div className="privacy-icon">🛡️</div>
              <p className="privacy-text">
                <strong>{t('auth.privacy.title')}:</strong> {t('auth.privacy.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;