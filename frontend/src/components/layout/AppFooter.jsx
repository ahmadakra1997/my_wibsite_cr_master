// frontend/src/components/layout/AppFooter.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * تذييل التطبيق الرئيسي
 * يعرض معلومات أساسية عن النظام وحقوق النشر.
 */
const AppFooter = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const appName = t('app.name', 'QA TRADER');
  const appVersion = t('app.version', 'الإصدار 2.0');
  const copyright =
    t('app.copyright', `جميع الحقوق محفوظة © ${year}`) ||
    `جميع الحقوق محفوظة © ${year}`;

  return (
    <footer
      className="app-footer"
      style={{
        borderTop: '1px solid rgba(15,118,255,0.3)',
        marginTop: '2rem',
        padding: '0.75rem 1rem',
        background:
          'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,1) 100%)',
      }}
    >
      <div
        className="app-footer-inner"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          direction: 'rtl',
          fontSize: '0.8rem',
          color: 'rgba(148,163,184,0.95)',
        }}
      >
        <div className="app-footer-left" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ opacity: 0.9 }}>{appName}</span>
          <span style={{ opacity: 0.45 }}>•</span>
          <span style={{ opacity: 0.9 }}>{appVersion}</span>
        </div>

        <div className="app-footer-middle" style={{ textAlign: 'center', flex: 1 }}>
          <span>{copyright}</span>
        </div>

        <div
          className="app-footer-right"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ opacity: 0.9 }}>⚡</span>
          <span style={{ opacity: 0.85 }}>
            Quantum AI Trading Engine — Bot Orchestration System
          </span>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
