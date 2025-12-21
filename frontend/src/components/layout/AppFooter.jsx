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
    t('app.copyright', `جميع الحقوق محفوظة © ${year}`) ||
    `جميع الحقوق محفوظة © ${year}`;

  const tagline =
    t('app.tagline', '⚡ Quantum AI Trading Engine — Bot Orchestration System') ||
    '⚡ Quantum AI Trading Engine — Bot Orchestration System';

  const disclaimer =
    t(
      'app.disclaimerShort',
      'هذه المنصّة لأغراض تحليلية وتعليمية، وليست نصيحة استثمارية.',
    ) || 'هذه المنصّة لأغراض تحليلية وتعليمية، وليست نصيحة استثمارية.';

  const footerStyle = {
    marginTop: 10,
    borderRadius: 18,
    padding: '8px 12px',
    border: '1px solid rgba(30,64,175,0.7)',
    background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(8,47,73,0.96))',
    boxShadow: '0 14px 30px rgba(15,23,42,0.9)',
    fontSize: 11,
    color: 'var(--qa-text-soft, #9ca3af)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  };

  const leftStyle = { display: 'flex', flexDirection: 'column', gap: 2 };
  const rightStyle = { textAlign: 'end', display: 'flex', flexDirection: 'column', gap: 2 };

  const nameVersionStyle = { color: '#e5e7eb', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em' };

  return (
    <footer style={footerStyle} aria-label="App Footer">
      <div style={leftStyle}>
        <div style={nameVersionStyle}>
          {appName} • {appVersion}
        </div>
        <div>{copyright}</div>
      </div>

      <div style={rightStyle}>
        <div style={{ color: 'rgba(226,232,240,0.9)' }}>{tagline}</div>
        <div>{disclaimer}</div>
      </div>
    </footer>
  );
};

export default AppFooter;
