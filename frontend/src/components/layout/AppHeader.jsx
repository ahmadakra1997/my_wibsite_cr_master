// frontend/src/components/layout/AppHeader.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

/**
 * رأس التطبيق الرئيسي
 * - يعرض هوية المنصة (QA TRADER / Quantum AI)
 * - شريط تنقل رئيسي بين الصفحات الأساسية
 * - مبدّل اللغة (LanguageSwitcher)
 */
const AppHeader = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'لوحة التحكم', icon: '📊' },
    { to: '/trading', label: 'التداول الحي', icon: '📈' },
    { to: '/analytics', label: 'التحليلات', icon: '📉' },
    { to: '/risk', label: 'إدارة المخاطر', icon: '🛡️' },
    { to: '/bot/dashboard', label: 'نظام البوت', icon: '🤖' },
    { to: '/settings', label: 'الإعدادات', icon: '⚙️' },
    { to: '/profile', label: 'الملف الشخصي', icon: '👤' },
  ];

  const isBotRoute = location.pathname.startsWith('/bot');

  return (
    <header
      className="app-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        borderBottom: '1px solid rgba(15, 118, 255, 0.3)',
        background:
          'linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.9) 40%, rgba(15,23,42,0.96) 100%)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="app-header-inner"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          direction: 'rtl',
        }}
      >
        {/* الشعار / الهوية */}
        <div
          className="app-header-brand"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <div
            className="brand-logo-circle"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '999px',
              background:
                'radial-gradient(circle at 30% 30%, #00D4FF, #6366F1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0b1120',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            QA
          </div>
          <div className="brand-text">
            <div
              className="brand-name"
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#e5e7eb',
                letterSpacing: '0.04em',
              }}
            >
              {t('app.name', 'QA TRADER')}
            </div>
            <div
              className="brand-subtitle"
              style={{
                fontSize: '0.75rem',
                color: 'rgba(148,163,184,0.95)',
                textTransform: 'uppercase',
              }}
            >
              {t('app.description', 'QUANTUM AI TRADING PLATFORM')}
            </div>
          </div>
        </div>

        {/* شريط التنقل */}
        <nav
          className="app-nav"
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'app-nav-link',
                  isActive ? 'active' : '',
                  isBotRoute && item.to.startsWith('/bot')
                    ? 'bot-nav-link'
                    : '',
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
                border: isActive
                  ? '1px solid rgba(56,189,248,0.9)'
                  : '1px solid rgba(51,65,85,0.8)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(56,189,248,0.25), rgba(59,130,246,0.18))'
                  : 'rgba(15,23,42,0.7)',
                color: isActive ? '#e0f2fe' : 'rgba(226,232,240,0.85)',
                textDecoration: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* الجانب الأيمن: مبدّل اللغة + مؤشر البوت */}
        <div
          className="app-header-right"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {/* مؤشر حالة نظام البوت في الهيدر (عنصر بصري فقط) */}
          <div
            className="bot-status-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              background: 'rgba(22,163,74,0.12)',
              border: '1px solid rgba(34,197,94,0.5)',
              fontSize: '0.75rem',
              color: '#bbf7d0',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '999px',
                background:
                  'radial-gradient(circle at 30% 30%, #22c55e, #16a34a)',
                boxShadow: '0 0 12px rgba(34,197,94,0.9)',
              }}
            />
            <span>النظام نشط</span>
          </div>

          {/* مبدّل اللغة */}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
