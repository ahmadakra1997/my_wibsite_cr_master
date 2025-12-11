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
    { code: 'zh', name: '中文', flag: '🇨🇳', dir: 'ltr' }
  ];

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // تحديث اللغة الحالية عند التغيير
  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const toggleDropdown = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsOpen(!isOpen);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const changeLanguage = async (langCode, dir) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // إضافة تأثير الانتقال السلس
    document.documentElement.style.opacity = '0.7';
    document.documentElement.style.transition = 'opacity 0.3s ease';
    
    try {
      await i18n.changeLanguage(langCode);
      
      // تحديث اتجاه ولغة الصفحة
      document.documentElement.dir = dir;
      document.documentElement.lang = langCode;
      document.documentElement.setAttribute('data-lang', langCode);
      
      // تحديث عنوان الصفحة بناءً على اللغة
      updatePageTitle(langCode);
      
      // إغلاق القائمة
      setIsOpen(false);
      
    } catch (error) {
      console.error('Language change error:', error);
    } finally {
      // استعادة التعتيم
      setTimeout(() => {
        document.documentElement.style.opacity = '1';
        setIsAnimating(false);
      }, 300);
    }
  };

  const updatePageTitle = (lang) => {
    const titles = {
      ar: 'QUANTUM AI TRADING PLATFORM - نظام التداول الآلي المتقدم',
      en: 'QUANTUM AI TRADING PLATFORM - Advanced AI Trading System',
      tr: 'QUANTUM AI TRADING PLATFORM - Gelişmiş AI Ticaret Sistemi',
      ru: 'QUANTUM AI TRADING PLATFORM - Продвинутая AI Торговая Система',
      zh: 'QUANTUM AI TRADING PLATFORM - 高级AI交易系统'
    };
    
    document.title = titles[lang] || titles.en;
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLang) || languages[0];
  };

  return (
    <div 
      ref={dropdownRef}
      className={`language-switcher ${isOpen ? 'language-open' : ''} ${isAnimating ? 'animating' : ''}`}
      data-lang={currentLang}
    >
      {/* الزر الرئيسي */}
      <button
        onClick={toggleDropdown}
        disabled={isAnimating}
        className="language-trigger"
        aria-label={t('language.switcher')}
        aria-expanded={isOpen}
      >
        <div className="trigger-content">
          <span className="trigger-flag">{getCurrentLanguage().flag}</span>
          <span className="trigger-code">{getCurrentLanguage().code.toUpperCase()}</span>
          <span className="trigger-chevron">
            <svg 
              className={`chevron-icon ${isOpen ? 'rotate-180' : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        
        {/* تأثير النبض */}
        <div className="pulse-effect"></div>
        
        {/* تأثير التوهج */}
        <div className="glow-effect"></div>
      </button>

      {/* قائمة اللغة */}
      <div className={`language-dropdown ${isOpen ? 'dropdown-open' : ''}`}>
        <div className="dropdown-backdrop"></div>
        
        <div className="dropdown-content">
          {/* رأس القائمة */}
          <div className="dropdown-header">
            <h3 className="dropdown-title">
              <span className="title-icon">🌐</span>
              {t('language.select')}
            </h3>
            <div className="dropdown-divider"></div>
          </div>

          {/* عناصر اللغة */}
          <div className="language-list">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code, language.dir)}
                disabled={isAnimating}
                className={`language-option ${currentLang === language.code ? 'language-active' : ''}`}
                aria-selected={currentLang === language.code}
              >
                <div className="option-content">
                  <span className="option-flag">{language.flag}</span>
                  
                  <div className="option-text">
                    <span className="option-name">{language.name}</span>
                    <span className="option-code">{language.code.toUpperCase()}</span>
                  </div>
                  
                  {currentLang === language.code && (
                    <div className="option-indicator">
                      <div className="indicator-dot"></div>
                      <span className="indicator-text">{t('language.current')}</span>
                    </div>
                  )}
                </div>
                
                {/* تأثير التحويم */}
                <div className="option-hover-effect"></div>
              </button>
            ))}
          </div>

          {/* تذييل القائمة */}
          <div className="dropdown-footer">
            <div className="footer-content">
              <span className="footer-icon">⚡</span>
              <span className="footer-text">
                {t('language.realtime')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* مؤشر تحميل اللغة */}
      {isAnimating && (
        <div className="language-loader">
          <div className="loader-spinner"></div>
          <span className="loader-text">{t('language.switching')}</span>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;