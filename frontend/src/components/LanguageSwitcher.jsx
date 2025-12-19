// frontend/src/components/LanguageSwitcher.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const DEFAULT_LANGS = [
  { code: 'ar', name: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'en', name: 'English', dir: 'ltr', flag: '🇺🇸' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr', flag: '🇹🇷' },
  { code: 'ru', name: 'Русский', dir: 'ltr', flag: '🇷🇺' },
  { code: 'zh', name: '中文', dir: 'ltr', flag: '🇨🇳' },
];

function safeDoc() {
  if (typeof document === 'undefined') return null;
  return document;
}

function normalize(code) {
  return String(code || 'en')
    .trim()
    .split('-')[0]
    .toLowerCase();
}

function setHtmlLangDir(code, dir) {
  const d = safeDoc();
  if (!d) return;

  const html = d.documentElement;
  html.setAttribute('lang', code);
  html.setAttribute('dir', dir);
  html.setAttribute('data-lang', code);
}

function updateTitleForLang(code) {
  const d = safeDoc();
  if (!d) return;

  const titles = {
    ar: 'QA TRADER — منصة التداول الكمي',
    en: 'QA TRADER — Quantum Trading Platform',
    tr: 'QA TRADER — Kuantum Alım-Satım Platformu',
    ru: 'QA TRADER — Квантовая торговая платформа',
    zh: 'QA TRADER — 量化交易平台',
  };

  d.title = titles[code] || d.title || 'QA TRADER';
}

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const rootRef = React.useRef(null);

  const langs = React.useMemo(() => DEFAULT_LANGS, []);
  const currentCode = normalize(i18n?.resolvedLanguage || i18n?.language || 'en');

  const currentLang = React.useMemo(() => {
    return langs.find((l) => l.code === currentCode) || langs.find((l) => l.code === 'en') || langs[0];
  }, [langs, currentCode]);

  const close = React.useCallback(() => setOpen(false), []);
  const toggle = React.useCallback(() => setOpen((v) => !v), []);

  const applyLanguage = React.useCallback(
    async (nextCodeRaw) => {
      const nextCode = normalize(nextCodeRaw);
      if (!i18n || !nextCode) {
        close();
        return;
      }

      if (nextCode === currentCode) {
        close();
        return;
      }

      const target = langs.find((l) => l.code === nextCode) || { code: nextCode, dir: 'ltr' };

      try {
        setLoading(true);

        const d = safeDoc();
        if (d) d.documentElement.classList.add('language-loading');

        await i18n.changeLanguage(target.code);

        setHtmlLangDir(target.code, target.dir);
        updateTitleForLang(target.code);

        try {
          if (typeof window !== 'undefined') {
            window.localStorage?.setItem('qa_lang', target.code);
          }
        } catch {
          // ignore
        }
      } finally {
        const d = safeDoc();
        if (d) d.documentElement.classList.remove('language-loading');

        setLoading(false);
        close();
      }
    },
    [i18n, langs, currentCode, close]
  );

  // Apply stored language (once) + align html lang/dir حتى لو ما في saved
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const saved = normalize(window.localStorage?.getItem('qa_lang'));
      const target = langs.find((l) => l.code === saved);

      if (saved && target && saved !== currentCode) {
        setHtmlLangDir(target.code, target.dir);
        updateTitleForLang(target.code);
        i18n?.changeLanguage?.(target.code);
        return;
      }

      // no saved: ensure html aligned with current
      if (currentLang?.code && currentLang?.dir) {
        setHtmlLangDir(currentLang.code, currentLang.dir);
        updateTitleForLang(currentLang.code);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click + ESC
  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target)) close();
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  return (
    <>
      <div className="language-switcher" ref={rootRef}>
        <button
          type="button"
          className={`language-trigger ${open ? 'language-open' : ''}`}
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t?.('language.switch') || 'Switch language'}
          disabled={loading}
        >
          <div className="pulse-effect" aria-hidden="true" />
          <div className="glow-effect" aria-hidden="true" />

          <div className="trigger-content">
            <span className="trigger-flag" aria-hidden="true">
              {currentLang?.flag || '🌐'}
            </span>
            <span className="trigger-code">{String(currentLang?.code || 'en').toUpperCase()}</span>
            <span className="trigger-chevron" aria-hidden="true">
              <svg className="chevron-icon" viewBox="0 0 20 20" focusable="false" aria-hidden="true">
                <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
              </svg>
            </span>
          </div>
        </button>

        <div className={`language-dropdown ${open ? 'dropdown-open' : ''}`}>
          {open && <div className="dropdown-backdrop" onClick={close} aria-hidden="true" />}

          <div className="dropdown-content" role="listbox" aria-label={t?.('language.select') || 'Select language'}>
            <div className="dropdown-header">
              <p className="dropdown-title">
                <span className="title-icon" aria-hidden="true">
                  🌐
                </span>
                {t?.('language.select') || 'Select Language'}
              </p>
              <div className="dropdown-divider" aria-hidden="true" />
            </div>

            <div className="language-list">
              {langs.map((lang) => {
                const isActive = lang.code === currentLang?.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    className={`language-option ${isActive ? 'language-active' : ''}`}
                    onClick={() => applyLanguage(lang.code)}
                    disabled={loading}
                    aria-selected={isActive}
                  >
                    <span className="option-hover-effect" aria-hidden="true" />
                    <div className="option-content">
                      <span className="option-flag" aria-hidden="true">
                        {lang.flag || '🌐'}
                      </span>
                      <span className="option-text">
                        <span className="option-name">{lang.name}</span>
                        <span className="option-code">{lang.code.toUpperCase()}</span>
                      </span>

                      {isActive && (
                        <span className="option-indicator">
                          <span className="indicator-dot" aria-hidden="true" />
                          <span className="indicator-text">{t?.('language.active') || 'Active'}</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="dropdown-footer">
              <div className="footer-content">
                <span className="footer-icon" aria-hidden="true">
                  ⚙️
                </span>
                <span className="footer-text">{t?.('language.tip') || 'Tip: You can change anytime'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="language-loader" role="status" aria-live="polite">
          <div className="loader-spinner" aria-hidden="true" />
          <div className="loader-text">{t?.('language.loading') || 'Switching language…'}</div>
        </div>
      )}
    </>
  );
}
