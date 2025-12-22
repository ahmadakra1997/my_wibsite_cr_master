// frontend/src/App.js
import React from 'react';
import { Provider as ReduxProvider, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';

import store from './store/store';

import AuthProvider, { useAuth } from './context/AuthContext';
import BotProvider, { useBot } from './context/BotContext';
import { ToastProvider, useToast } from './components/common/ToastProvider';

import { useTranslation } from 'react-i18next';
import './App.css';

function ShellCard({ title, subtitle, right, children }) {
  return (
    <div
      style={{
        border: '1px solid rgba(56,189,248,0.20)',
        background: 'linear-gradient(135deg, rgba(2,6,23,0.92), rgba(8,47,73,0.50))',
        borderRadius: 18,
        padding: 14,
        boxShadow: '0 18px 46px rgba(2,6,23,0.65)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, letterSpacing: '0.04em', color: 'rgba(226,232,240,0.95)' }}>{title}</div>
          {subtitle ? (
            <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.92)', fontSize: 13, lineHeight: 1.35 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
        {right || null}
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function TopNav() {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const location = useLocation();
  const { addToast } = useToast();

  const currentLang = String(i18n?.resolvedLanguage || i18n?.language || 'en').split('-')[0];

  const nav = [
    { to: '/', label: t('nav.home', 'الرئيسية') },
    { to: '/dashboard', label: t('nav.dashboard', 'لوحة التحكم') },
    { to: '/trading', label: t('nav.trading', 'التداول') },
    { to: '/bot', label: t('nav.bot', 'البوت') },
    { to: '/settings', label: t('nav.settings', 'الإعدادات') },
    { to: '/profile', label: t('nav.profile', 'الملف الشخصي') },
  ];

  const onLogout = () => {
    try {
      auth?.logout?.();
      addToast?.({ type: 'success', title: t('auth.loggedOut', 'تم تسجيل الخروج') });
    } catch {
      // ignore
    }
  };

  const setLang = async (lng) => {
    try {
      if (!i18n?.changeLanguage) return;
      await i18n.changeLanguage(lng);
      addToast?.({ type: 'success', title: t('language.changed', 'تم تغيير اللغة') });
    } catch {
      addToast?.({ type: 'error', title: t('language.failed', 'فشل تغيير اللغة') });
    }
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(14px)',
        background: 'rgba(2,6,23,0.65)',
        borderBottom: '1px solid rgba(148,163,184,0.16)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(0,163,255,1), rgba(0,255,136,0.90))',
              boxShadow: '0 10px 26px rgba(0,163,255,0.22)',
              border: '1px solid rgba(56,189,248,0.85)',
              display: 'grid',
              placeItems: 'center',
              color: '#020617',
              fontWeight: 900,
              letterSpacing: '0.10em',
              fontSize: 12,
            }}
          >
            QA
          </div>
          <div style={{ lineHeight: 1.05 }}>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.14em', color: 'rgba(226,232,240,0.95)' }}>
              {t('app.name', 'QA TRADER')}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.92)' }}>
              {t('app.description', 'QUANTUM AI TRADING PLATFORM')}
            </div>
          </div>
        </Link>

        <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {nav.map((item) => {
            const active = String(location.pathname || '') === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: active ? '1px solid rgba(56,189,248,0.9)' : '1px solid rgba(148,163,184,0.26)',
                  background: active ? 'rgba(56,189,248,0.10)' : 'rgba(15,23,42,0.45)',
                  color: 'rgba(226,232,240,0.92)',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={currentLang}
            onChange={(e) => setLang(e.target.value)}
            style={{
              borderRadius: 12,
              padding: '8px 10px',
              border: '1px solid rgba(148,163,184,0.26)',
              background: 'rgba(15,23,42,0.55)',
              color: 'rgba(226,232,240,0.92)',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            aria-label="Language"
          >
            <option value="ar">AR</option>
            <option value="en">EN</option>
            <option value="tr">TR</option>
            <option value="ru">RU</option>
            <option value="zh">ZH</option>
          </select>

          {auth?.isAuthenticated ? (
            <button
              type="button"
              onClick={onLogout}
              style={{
                borderRadius: 12,
                padding: '8px 10px',
                border: '1px solid rgba(255,59,92,0.35)',
                background: 'rgba(255,59,92,0.10)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {t('auth.logout', 'خروج')}
            </button>
          ) : (
            <Link
              to="/auth"
              style={{
                textDecoration: 'none',
                borderRadius: 12,
                padding: '8px 10px',
                border: '1px solid rgba(0,255,136,0.35)',
                background: 'rgba(0,255,136,0.10)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 900,
              }}
            >
              {t('auth.login', 'دخول')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <div style={{ maxWidth: 1200, margin: '14px auto 18px', padding: '0 14px' }}>
      <div
        style={{
          borderRadius: 18,
          padding: '10px 12px',
          border: '1px solid rgba(30,64,175,0.55)',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(8,47,73,0.92))',
          color: 'rgba(148,163,184,0.92)',
          fontSize: 12,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ color: 'rgba(226,232,240,0.95)', fontWeight: 900, letterSpacing: '0.06em' }}>
          {t('app.name', 'QA TRADER')} • {t('app.version', 'v2')}
        </div>
        <div>{t('app.copyright', `© ${year} All rights reserved`)}</div>
        <div>{t('app.disclaimerShort', 'هذه المنصّة لأغراض تحليلية وتعليمية، وليست نصيحة استثمارية.')}</div>
      </div>
    </div>
  );
}

function MaintenanceScreen() {
  const message =
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.REACT_APP_MAINTENANCE_MESSAGE) ||
    'نقوم حالياً بإجراء تحديثات جوهرية على نظام QA TRADER لتحسين الأداء وإضافة مزايا جديدة.';
  const eta =
    (typeof process !== 'undefined' && process.env && process.env.REACT_APP_MAINTENANCE_ETA) ||
    'العودة المتوقعة: قريباً جدًا.';

  return (
    <div style={{ maxWidth: 920, margin: '18px auto', padding: '0 14px' }}>
      <ShellCard
        title="️نظام QA TRADER في وضع الصيانة"
        subtitle="نجهّز نسخة أكثر استقراراً وذكاءً من المنصّة."
      >
        <div style={{ color: 'rgba(226,232,240,0.92)', lineHeight: 1.6 }}>
          <div style={{ marginBottom: 10 }}>{message}</div>
          <div style={{ color: 'rgba(148,163,184,0.95)' }}>{eta}</div>
        </div>
      </ShellCard>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth?.loading) {
    return (
      <div style={{ maxWidth: 920, margin: '18px auto', padding: '0 14px' }}>
        <ShellCard title="Loading…" subtitle="Preparing your secure session." />
      </div>
    );
  }

  if (!auth?.isAuthenticated) {
    // ✅ تحسين توافق: نرسل pathname+search بشكل واضح (بدون تغيير المنطق)
    const from = {
      pathname: location?.pathname || '/dashboard',
      search: location?.search || '',
    };
    return <Navigate to="/auth" replace state={{ from }} />;
  }

  return children;
}

function HomeScreen() {
  const { t } = useTranslation();
  return (
    <div style={{ maxWidth: 1200, margin: '18px auto', padding: '0 14px' }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <ShellCard
          title={t('home.title', 'واجهة Quantum UI (نسخة مستقرة للتشغيل)')}
          subtitle={t('home.subtitle', 'تم إصلاح الإقلاع Providers/Router/Toasts/Contexts بدون كسر الباك-إند. الخطوة القادمة: إعادة إدخال صفحاتك الأصلية بعد إصلاحها ملفًا-ملفًا.')}
          right={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to="/trading" style={{ textDecoration: 'none', fontWeight: 900, color: '#00ff88' }}>
                {t('home.ctaTrading', 'فتح التداول')}
              </Link>
              <span style={{ color: 'rgba(148,163,184,0.6)' }}>•</span>
              <Link to="/dashboard" style={{ textDecoration: 'none', fontWeight: 900, color: '#38bdf8' }}>
                {t('home.ctaDashboard', 'لوحة التحكم')}
              </Link>
            </div>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <ShellCard title="UI/UX" subtitle="Turquoise + Blue + Green identity + RTL/LTR ready">
              <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 13, lineHeight: 1.6 }}>
                تحسينات التصميم تتم تدريجيًا بدون كسر أي منطق تداول أو ربط باكيند.
              </div>
            </ShellCard>

            <ShellCard title="Stability" subtitle="Guards ضد null/undefined + منع الكراش">
              <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 13, lineHeight: 1.6 }}>
                تم إصلاح Boot + Providers + APIs داخل Contexts لتفادي أخطاء البناء.
              </div>
            </ShellCard>

            <ShellCard title="Backend-safe" subtitle="No breaking changes to trading/backend logic">
              <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 13, lineHeight: 1.6 }}>
                auth paths قابلة للتخصيص بـ env بدون تعديل كود.
              </div>
            </ShellCard>
          </div>
        </ShellCard>
      </div>
    </div>
  );
}

function DashboardScreen() {
  const trading = useSelector((s) => s?.trading || {});
  return (
    <div style={{ maxWidth: 1200, margin: '18px auto', padding: '0 14px' }}>
      <ShellCard title="Dashboard (تشغيل آمن)" subtitle="عرض سريع لحالة بيانات التداول من Redux بدون كسر">
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ color: 'rgba(148,163,184,0.92)' }}>
            Connection: <b style={{ color: 'rgba(226,232,240,0.95)' }}>{String(trading?.connectionStatus || 'unknown')}</b>
          </div>
          <div style={{ color: 'rgba(148,163,184,0.92)' }}>
            Active Pair: <b style={{ color: 'rgba(226,232,240,0.95)' }}>{String(trading?.activePair || 'BTCUSDT')}</b>
          </div>
          <div style={{ color: 'rgba(148,163,184,0.92)' }}>
            Ticker: <b style={{ color: 'rgba(226,232,240,0.95)' }}>{trading?.ticker ? 'OK' : '—'}</b>
          </div>
          <div style={{ color: 'rgba(148,163,184,0.92)' }}>
            OrderBook: <b style={{ color: 'rgba(226,232,240,0.95)' }}>{trading?.orderBook ? 'OK' : '—'}</b>
          </div>
        </div>
      </ShellCard>
    </div>
  );
}

function TradingScreen() {
  return (
    <div style={{ maxWidth: 1200, margin: '18px auto', padding: '0 14px' }}>
      <ShellCard
        title="Trading (تشغيل آمن)"
        subtitle="حالياً صفحة TradingInterface الأصلية تحتاج إصلاح JSX (ستكون ضمن الروابط القادمة)."
      >
        <div style={{ color: 'rgba(148,163,184,0.92)', lineHeight: 1.6 }}>
          تم تجهيز الـ store + connection state. بعد إصلاح TradingInterface سنعيد إدخالها فورًا بدون تغيير منطق التداول.
        </div>
      </ShellCard>
    </div>
  );
}

function BotScreen() {
  const bot = useBot();
  const { addToast } = useToast();

  const refresh = async () => {
    try {
      await bot?.loadBotData?.();
      addToast?.({ type: 'success', title: 'Bot data updated', description: 'Loaded successfully.' });
    } catch (e) {
      addToast?.({ type: 'error', title: 'Bot load failed', description: e?.message || 'Error' });
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '18px auto', padding: '0 14px' }}>
      <ShellCard
        title="Bot (Context جاهز)"
        subtitle="قراءة status/settings/performance من services/api.js بدون كسر"
        right={
          <button
            type="button"
            onClick={refresh}
            style={{
              borderRadius: 12,
              padding: '8px 10px',
              border: '1px solid rgba(56,189,248,0.35)',
              background: 'rgba(56,189,248,0.10)',
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        }
      >
        <div style={{ display: 'grid', gap: 10, color: 'rgba(148,163,184,0.92)' }}>
          <div>loading: <b style={{ color: 'rgba(226,232,240,0.95)' }}>{String(!!bot?.loading)}</b></div>
          <div>error: <b style={{ color: 'rgba(226,232,240,0.95)' }}>{bot?.error ? String(bot.error) : '—'}</b></div>
          <div>status: <b style={{ color: 'rgba(226,232,240,0.95)' }}>{bot?.botStatus ? 'OK' : '—'}</b></div>
          <div>settings: <b style={{ color: 'rgba(226,232,240,0.95)' }}>{bot?.botSettings ? 'OK' : '—'}</b></div>
          <div>performance: <b style={{ color: 'rgba(226,232,240,0.95)' }}>{bot?.performance ? 'OK' : '—'}</b></div>
        </div>
      </ShellCard>
    </div>
  );
}

function SettingsScreen() {
  const { addToast } = useToast();
  const [maxLeverage, setMaxLeverage] = React.useState(5);
  const [dailyLossLimit, setDailyLossLimit] = React.useState(10);

  const onSave = (e) => {
    e.preventDefault();
    addToast?.({
      type: 'success',
      title: 'Settings saved',
      description: 'تم حفظ الإعدادات محليًا (وسيتم ربطها بالباك-إند عند إصلاح SettingsPage.jsx).',
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: '18px auto', padding: '0 14px' }}>
      <ShellCard title="Settings (تشغيل آمن)" subtitle="واجهة إعدادات مؤقتة بدون كسر حتى إصلاح SettingsPage.jsx">
        <form onSubmit={onSave} style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.92)' }}>
            Max leverage
            <input
              value={maxLeverage}
              onChange={(e) => setMaxLeverage(Number(e.target.value) || 1)}
              type="number"
              min={1}
              max={125}
              style={{
                borderRadius: 12,
                padding: '10px 12px',
                border: '1px solid rgba(148,163,184,0.26)',
                background: 'rgba(15,23,42,0.55)',
                color: 'rgba(226,232,240,0.95)',
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.92)' }}>
            Daily loss limit (%)
            <input
              value={dailyLossLimit}
              onChange={(e) => setDailyLossLimit(Number(e.target.value) || 1)}
              type="number"
              min={1}
              max={100}
              style={{
                borderRadius: 12,
                padding: '10px 12px',
                border: '1px solid rgba(148,163,184,0.26)',
                background: 'rgba(15,23,42,0.55)',
                color: 'rgba(226,232,240,0.95)',
                outline: 'none',
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              borderRadius: 14,
              padding: '10px 12px',
              border: '1px solid rgba(0,255,136,0.35)',
              background: 'rgba(0,255,136,0.10)',
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 900,
              cursor: 'pointer',
              width: 'fit-content',
            }}
          >
            Save
          </button>
        </form>
      </ShellCard>
    </div>
  );
}

function ProfileScreen() {
  const auth = useAuth();
  return (
    <div style={{ maxWidth: 1200, margin: '18px auto', padding: '0 14px' }}>
      <ShellCard title="Profile (تشغيل آمن)" subtitle="عرض بيانات المستخدم من AuthContext بدون كسر">
        <div style={{ color: 'rgba(148,163,184,0.92)', lineHeight: 1.6 }}>
          <div>
            isAuthenticated:{' '}
            <b style={{ color: 'rgba(226,232,240,0.95)' }}>{String(!!auth?.isAuthenticated)}</b>
          </div>
          <div>
            user:{' '}
            <b style={{ color: 'rgba(226,232,240,0.95)' }}>{auth?.user ? 'OK' : '—'}</b>
          </div>
          <div style={{ marginTop: 10 }}>
            صفحة Profile.js الأصلية تحتاج إصلاح JSX وربطها سيعود كما هو (بدون تغيير منطق باك-إند).
          </div>
        </div>
      </ShellCard>
    </div>
  );
}

function AuthScreen() {
  const auth = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = React.useState('login'); // login | signup
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');

  // ✅ FIX توافق: يدعم from كـ string أو object (pathname/search)
  const fromState = location?.state?.from;
  const from =
    typeof fromState === 'string'
      ? fromState
      : `${fromState?.pathname || '/dashboard'}${typeof fromState?.search === 'string' ? fromState.search : ''}`;

  const isSignup = mode === 'signup';

  const onSubmit = async (e) => {
    e.preventDefault();

    if (isSignup && password !== confirm) {
      addToast?.({ type: 'error', title: 'Passwords do not match', description: 'تأكد من مطابقة كلمة المرور.' });
      return;
    }

    try {
      if (isSignup) {
        await auth?.register?.({ email, password });
        addToast?.({ type: 'success', title: 'Account created', description: 'تم إنشاء الحساب.' });
      } else {
        await auth?.login?.({ email, password });
        addToast?.({ type: 'success', title: 'Welcome back', description: 'تم تسجيل الدخول.' });
      }
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Auth failed';
      addToast?.({ type: 'error', title: 'Auth error', description: String(msg) });
    }
  };

  return (
    <div style={{ maxWidth: 920, margin: '18px auto', padding: '0 14px' }}>
      <ShellCard
        title="Secure Access"
        subtitle="صفحة Auth مؤقتة داخل App.js لحين إصلاح AuthPanel.jsx الأصلي (بنفس الوظائف)."
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{
                borderRadius: 12,
                padding: '8px 10px',
                border: mode === 'login' ? '1px solid rgba(56,189,248,0.55)' : '1px solid rgba(148,163,184,0.26)',
                background: mode === 'login' ? 'rgba(56,189,248,0.10)' : 'rgba(15,23,42,0.45)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              style={{
                borderRadius: 12,
                padding: '8px 10px',
                border: mode === 'signup' ? '1px solid rgba(0,255,136,0.55)' : '1px solid rgba(148,163,184,0.26)',
                background: mode === 'signup' ? 'rgba(0,255,136,0.10)' : 'rgba(15,23,42,0.45)',
                color: 'rgba(226,232,240,0.95)',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Sign up
            </button>
          </div>
        }
      >
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.92)' }}>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="you@example.com"
              style={{
                borderRadius: 12,
                padding: '10px 12px',
                border: '1px solid rgba(148,163,184,0.26)',
                background: 'rgba(15,23,42,0.55)',
                color: 'rgba(226,232,240,0.95)',
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.92)' }}>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              placeholder="••••••••"
              style={{
                borderRadius: 12,
                padding: '10px 12px',
                border: '1px solid rgba(148,163,184,0.26)',
                background: 'rgba(15,23,42,0.55)',
                color: 'rgba(226,232,240,0.95)',
                outline: 'none',
              }}
            />
          </label>

          {isSignup ? (
            <label style={{ display: 'grid', gap: 6, color: 'rgba(148,163,184,0.92)' }}>
              Confirm password
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type="password"
                required
                placeholder="Repeat password"
                style={{
                  borderRadius: 12,
                  padding: '10px 12px',
                  border: '1px solid rgba(148,163,184,0.26)',
                  background: 'rgba(15,23,42,0.55)',
                  color: 'rgba(226,232,240,0.95)',
                  outline: 'none',
                }}
              />
            </label>
          ) : null}

          <button
            type="submit"
            disabled={!!auth?.loading}
            style={{
              borderRadius: 14,
              padding: '10px 12px',
              border: '1px solid rgba(56,189,248,0.40)',
              background: 'linear-gradient(135deg, rgba(56,189,248,0.16), rgba(0,255,136,0.12))',
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 900,
              cursor: auth?.loading ? 'not-allowed' : 'pointer',
              width: 'fit-content',
              opacity: auth?.loading ? 0.7 : 1,
            }}
          >
            {auth?.loading ? 'Loading…' : isSignup ? 'Create account' : 'Log in'}
          </button>

          <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 13 }}>
            {auth?.error ? `Error: ${String(auth.error)}` : null}
          </div>
        </form>
      </ShellCard>
    </div>
  );
}

function AppContent() {
  const storeMaintenance = useSelector((state) => !!(state && state.app && state.app.maintenanceMode));
  const envMaintenance = typeof process !== 'undefined' && process.env && process.env.REACT_APP_MAINTENANCE_MODE === 'true';

  if (storeMaintenance || envMaintenance) return <MaintenanceScreen />;

  return (
    <>
      <TopNav />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/auth" element={<AuthScreen />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trading"
          element={
            <ProtectedRoute>
              <TradingScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bot"
          element={
            <ProtectedRoute>
              <BotScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileScreen />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        <BotProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ToastProvider>
        </BotProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
