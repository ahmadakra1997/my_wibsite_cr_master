// frontend/src/components/layout/AppHeader.jsx
import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import LanguageSwitcher from '../LanguageSwitcher';

/**
 * رأس التطبيق الرئيسي
 * - يعرض هوية المنصة (QA TRADER / Quantum AI)
 * - شريط تنقل رئيسي بين الصفحات الأساسية
 * - مبدّل اللغة + مؤشر حالة نظام البوت (بصري فقط)
 */
const AppHeader = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = React.useMemo(
    () => [
      { to: '/dashboard', label: 'لوحة التحكم', icon: '📊' },
      { to: '/trading', label: 'التداول الحي', icon: '⚡' },
      { to: '/analytics', label: 'التحليلات', icon: '📈' },
      { to: '/risk', label: 'إدارة المخاطر', icon: '🛡️' },
      { to: '/bot/dashboard', label: 'نظام البوت', icon: '🤖' },
      { to: '/settings', label: 'الإعدادات', icon: '⚙️' },
      { to: '/profile', label: 'الملف الشخصي', icon: '👤' },
    ],
    []
  );

  const isBotRoute = String(location?.pathname || '').startsWith('/bot');

  const headerWrap = {
    position: 'sticky',
    top: 0,
    zIndex: 60,
    backdropFilter: 'blur(14px)',
    background: 'rgba(2,6,23,0.55)',
    borderBottom: '1px solid rgba(148,163,184,0.18)',
  };

  const headerStyle = {
    maxWidth: 1240,
    margin: '0 auto',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  };

  const brandStyle = { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textDecoration: 'none' };

  const logoMarkStyle = {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: '1px solid rgba(56,189,248,0.85)',
    background: 'linear-gradient(135deg, rgba(0,163,255,1), rgba(0,255,136,0.9))',
    boxShadow: '0 10px 26px rgba(0,163,255,0.22)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#020617',
    fontWeight: 900,
    letterSpacing: '0.08em',
    fontSize: 12,
    flexShrink: 0,
  };

  const brandTextStyle = { display: 'flex', flexDirection: 'column', lineHeight: 1.1, minWidth: 0 };

  const appNameStyle = {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'rgba(226,232,240,0.95)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const appDescStyle = {
    fontSize: 11,
    color: 'rgba(148,163,184,0.9)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  };

  const rightStyle = { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 };

  const botPillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 999,
    border: isBotRoute ? '1px solid rgba(56,189,248,0.9)' : '1px solid rgba(148,163,184,0.45)',
    background: isBotRoute
      ? 'linear-gradient(135deg, rgba(56,189,248,0.20), rgba(0,255,136,0.16))'
      : 'rgba(15,23,42,0.65)',
    color: isBotRoute ? '#e0f2fe' : 'rgba(226,232,240,0.85)',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  };

  const navLinkStyle = ({ isActive }) => ({
    padding: '8px 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    border: isActive ? '1px solid rgba(56,189,248,0.9)' : '1px solid rgba(148,163,184,0.30)',
    background: isActive ? 'rgba(56,189,248,0.12)' : 'rgba(15,23,42,0.55)',
    color: isActive ? 'rgba(226,232,240,0.95)' : 'rgba(226,232,240,0.85)',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  });

  return (
    <div style={headerWrap} role="banner">
      <div style={headerStyle}>
        {/* الشعار / الهوية */}
        <Link to="/" style={brandStyle} aria-label={t('app.name', 'QA TRADER')}>
          <div style={logoMarkStyle} aria-hidden="true">
            QA
          </div>
          <div style={brandTextStyle}>
            <span style={appNameStyle}>{t('app.name', 'QA TRADER')}</span>
            <span style={appDescStyle}>{t('app.description', 'QUANTUM AI TRADING PLATFORM')}</span>
          </div>
        </Link>

        {/* شريط التنقل */}
        <nav style={navStyle} aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={navLinkStyle}
              className={({ isActive }) =>
                [
                  'app-nav-link',
                  isActive ? 'active' : '',
                  isBotRoute && String(item.to).startsWith('/bot') ? 'bot-nav-link' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* الجانب الأيمن: حالة نظام البوت + مبدّل اللغة */}
        <div style={rightStyle}>
          <div style={botPillStyle} title={t('bot.status.active', 'نظام البوت نشط')}>
            <span aria-hidden="true">{isBotRoute ? '🤖' : '✅'}</span>
            <span>{t('bot.status.active', 'نظام البوت نشط')}</span>
          </div>

          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
