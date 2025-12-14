// frontend/src/components/layout/AppFooter.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * تذييل التطبيق الرئيسي
 * يعرض:
 * - اسم المنصّة + الإصدار
 * - حقوق النشر
 * - Tagline بسيط للـ Quantum AI Engine
 */
const AppFooter = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const appName = t('app.name', 'QA TRADER');
  const appVersion = t('app.version', 'الإصدار 2.0');

  const copyright =
    t(
      'app.copyright',
      `جميع الحقوق محفوظة © ${year}`,
    ) || `جميع الحقوق محفوظة © ${year}`;

  const tagline =
    t(
      'app.tagline',
      '⚡ Quantum AI Trading Engine — Bot Orchestration System',
    ) ||
    '⚡ Quantum AI Trading Engine — Bot Orchestration System';

  const footerStyle = {
    marginTop: 10,
    borderRadius: 18,
    padding: '8px 12px',
    border: '1px solid rgba(30,64,175,0.7)',
    background:
      'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(8,47,73,0.96))',
    boxShadow: '0 14px 30px rgba(15,23,42,0.9)',
    fontSize: 11,
    color: 'var(--qa-text-soft, #9ca3af)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  };

  const leftStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  const rightStyle = {
    textAlign: 'end',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  const nameVersionStyle = {
    color: '#e5e7eb',
    fontSize: 11,
  };

  return (
    <footer className="app-footer" style={footerStyle}>
      <div className="app-footer__left" style={leftStyle}>
        <span style={nameVersionStyle}>
          {appName} • {appVersion}
        </span>
        <span>{copyright}</span>
      </div>

      <div className="app-footer__right" style={rightStyle}>
        <span>{tagline}</span>
        <span
          style={{
            fontSize: 10,
            opacity: 0.85,
          }}
        >
          {t(
            'app.disclaimerShort',
            'هذه المنصّة لأغراض تحليلية وتعليمية، وليست نصيحة استثمارية.',
          )}
        </span>
      </div>
    </footer>
  );
};

export default AppFooter;
