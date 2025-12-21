// frontend/src/components/layout/AppHeader.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

/**
 * رأس التطبيق الرئيسي
 * - يعرض هوية المنصة (QA TRADER / Quantum AI)
 * - شريط تنقل رئيسي بين الصفحات الأساسية
 * - مبدّل اللغة + مؤشر حالة نظام البوت
 */
const AppHeader = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'لوحة التحكم', icon: '' },
    { to: '/trading', label: 'التداول الحي', icon: '⚡' },
    { to: '/analytics', label: 'التحليلات', icon: '' },
    { to: '/risk', label: 'إدارة المخاطر', icon: '🛡️' },
    { to: '/bot/dashboard', label: 'نظام البوت', icon: '🤖' },
    { to: '/settings', label: 'الإعدادات', icon: '⚙️' },
    { to: '/profile', label: 'الملف الشخصي', icon: '👤' },
  ];

  const pathname = String(location?.pathname || '');
  const isBotRoute = pathname.startsWith('/bot');

  const headerStyle = {
    borderRadius: 20,
    padding: '10px 14px',
    marginBottom: 10,
    border: '1px solid rgba(30,64,175,0.8)',
    background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(8,47,73,0.96))',
    boxShadow: '0 18px 40px rgba(15,23,42,0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  };

  const brandStyle = { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 };
  const logoMarkStyle = {
    width: 32,
    height: 32,
    borderRadius: 12,
    border: '1px solid rgba(56,189,248,0.9)',
    background: 'radial-gradient(circle at top, rgba(56,189,248,0.3), rgba(15,23,42,1))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#e0f2fe',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.14em',
    flex: '0 0 auto',
  };

  const brandTextStyle = { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 };
  const appNameStyle = {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#e5e7eb',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const appDescStyle = {
    fontSize: 10,
    color: 'var(--qa-text-muted, #9ca3af)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  };

  const rightStyle = { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 };

  const botPillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    border: isBotRoute ? '1px solid rgba(56,189,248,0.9)' : '1px solid rgba(148,163,184,0.7)',
    background: isBotRoute
      ? 'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(45,212,191,0.2))'
      : 'rgba(15,23,42,0.95)',
    fontSize: 10,
    color: '#e5e7eb',
    whiteSpace: 'nowrap',
  };

  return (
    <header style={headerStyle} aria-label="App Header">
      {/* الشعار / الهوية */}
      <div style={brandStyle}>
        <div style={logoMarkStyle}>QA</div>
        <div style={brandTextStyle}>
          <div style={appNameStyle}>{t('app.name', 'QA TRADER')}</div>
          <div style={appDescStyle}>{t('app.description', 'QUANTUM AI TRADING PLATFORM')}</div>
        </div>
      </div>

      {/* شريط التنقل */}
      <nav style={navStyle} aria-label="Primary Navigation">
        {navItems.map((item) => {
          const isBotItem = String(item?.to || '').startsWith('/bot');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'app-nav-link',
                  isActive ? 'active' : '',
                  isBotRoute && isBotItem ? 'bot-nav-link' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
              }
              style={({ isActive }) => ({
                padding: '0.45rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: isActive ? '1px solid rgba(56,189,248,0.9)' : '1px solid rgba(51,65,85,0.8)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(56,189,248,0.25), rgba(59,130,246,0.18))'
                  : 'rgba(15,23,42,0.7)',
                color: isActive ? '#e0f2fe' : 'rgba(226,232,240,0.85)',
                textDecoration: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              })}
            >
              {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* الجانب الأيمن: حالة نظام البوت + مبدّل اللغة */}
      <div style={rightStyle}>
        <div style={botPillStyle} title={t('bot.status.active', 'نظام البوت نشط')}>
          <span aria-hidden="true">🤖</span>
          <span>{t('bot.status.active', 'نظام البوت نشط')}</span>
        </div>

        {/* مبدّل اللغة */}
        <LanguageSwitcher />
      </div>
    </header>
  );
};

export default AppHeader;
