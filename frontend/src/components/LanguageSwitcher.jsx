import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [isAnimating, setIsAnimating] = useState(false);

  const dropdownRef = useRef(null);

  const languages = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
    { code: 'zh', name: '中文', flag: '🇨🇳', dir: 'ltr' },
  ];

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // تحديث اللغة الحالية عند التغيير
  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const getCurrentLanguage = () =>
    languages.find((lang) => lang.code === currentLang) || languages[0];

  const toggleDropdown = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsOpen((prev) => !prev);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const updatePageTitle = (lang) => {
    const titles = {
      ar: 'QUANTUM AI TRADING PLATFORM - نظام التداول الآلي المتقدم',
      en: 'QUANTUM AI TRADING PLATFORM - Advanced AI Trading System',
      tr: 'QUANTUM AI TRADING PLATFORM - Gelişmiş AI Ticaret Sistemi',
      ru: 'QUANTUM AI TRADING PLATFORM - Продвинутая AI Торговая Система',
      zh: 'QUANTUM AI TRADING PLATFORM - 高级AI交易系统',
    };

    document.title = titles[lang] || titles.en;
  };

  const changeLanguage = async (langCode, dir) => {
    if (isAnimating || langCode === currentLang) return;

    setIsAnimating(true);

    // تأثير تعتيم سريع
    document.documentElement.style.opacity = '0.7';
    document.documentElement.style.transition = 'opacity 0.3s ease';

    try {
      await i18n.changeLanguage(langCode);

      document.documentElement.dir = dir;
      document.documentElement.lang = langCode;
      document.documentElement.setAttribute('data-lang', langCode);

      try {
        localStorage.setItem('qa_lang', langCode);
      } catch (e) {
        console.warn('Language localStorage not available', e);
      }

      updatePageTitle(langCode);
      setCurrentLang(langCode);
      setIsOpen(false);
    } catch (error) {
      console.error('Language change error:', error);
    } finally {
      setTimeout(() => {
        document.documentElement.style.opacity = '1';
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <>
      <div
        className={`language-switcher ${
          isAnimating ? 'language-loading' : ''
        }`}
        ref={dropdownRef}
      >
        {/* الزر الرئيسي */}
        <button
          type="button"
          className={`language-trigger ${
            isOpen ? 'language-open' : ''
          }`}
          onClick={toggleDropdown}
          disabled={isAnimating}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="trigger-content">
            <span className="trigger-flag">
              {getCurrentLanguage().flag || '🌐'}
            </span>
            <span className="trigger-code">
              {getCurrentLanguage().code.toUpperCase()}
            </span>
            <span className="trigger-chevron">
              <svg
                className="chevron-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M7 10l5 5 5-5H7z" />
              </svg>
            </span>
          </div>

          {/* تأثيرات الزر */}
          <span className="pulse-effect" />
          <span className="glow-effect" />
        </button>

        {/* القائمة المنسدلة */}
        <div
          className={`language-dropdown ${
            isOpen ? 'dropdown-open' : ''
          }`}
        >
          {/* خلفية شفافة للنقر خارج القائمة (محكومة من نفس الـ ref) */}
          <div className="dropdown-backdrop" />

          <div className="dropdown-content">
            {/* رأس القائمة */}
            <div className="dropdown-header">
              <div className="dropdown-title">
                <span className="title-icon">🌐</span>
                <span>
                  {t(
                    'language.select',
                    'اختر لغة واجهة المنصة'
                  )}
                </span>
              </div>
              <div className="dropdown-divider" />
            </div>

            {/* قائمة اللغات */}
            <div className="language-list" role="listbox">
              {languages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() =>
                    changeLanguage(language.code, language.dir)
                  }
                  disabled={isAnimating}
                  className={`language-option ${
                    currentLang === language.code
                      ? 'language-active'
                      : ''
                  }`}
                  aria-selected={currentLang === language.code}
                >
                  <div className="option-content">
                    <span className="option-flag">
                      {language.flag || '🌐'}
                    </span>
                    <div className="option-text">
                      <span className="option-name">
                        {language.name}
                      </span>
                      <span className="option-code">
                        {language.code.toUpperCase()}
                      </span>
                    </div>

                    {currentLang === language.code && (
                      <div className="option-indicator">
                        <span className="indicator-dot" />
                        <span className="indicator-text">
                          {t(
                            'language.current',
                            'اللغة الحالية'
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="option-hover-effect" />
                </button>
              ))}
            </div>

            {/* تذييل القائمة */}
            <div className="dropdown-footer">
              <div className="footer-content">
                <span className="footer-icon">⚡</span>
                <span className="footer-text">
                  {t(
                    'language.realtime',
                    'تبديل فوري للواجهة بدون إعادة تحميل الصفحة'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* مؤشر تحميل عند تغيير اللغة */}
      {isAnimating && (
        <div className="language-loader" role="status" aria-live="polite">
          <div className="loader-spinner" />
          <div className="loader-text">
            {t('language.switching', 'جاري تبديل اللغة...')}
          </div>
        </div>
      )}
    </>
  );
};

export default LanguageSwitcher;
