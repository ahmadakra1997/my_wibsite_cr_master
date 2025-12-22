// frontend/src/components/LanguageSwitcher.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const DEFAULT_LANGS = [
  { code: 'ar', name: 'العربية', dir: 'rtl', flag: '' },
  { code: 'en', name: 'English', dir: 'ltr', flag: '' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr', flag: '' },
  { code: 'ru', name: 'Русский', dir: 'ltr', flag: '' },
  { code: 'zh', name: '中文', dir: 'ltr', flag: '' },
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

      const target = langs.find((l) => l.code === nextCode) || { code: nextCode, dir: 'ltr', name: nextCode };

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
    [i18n, langs, currentCode, close],
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
    <div ref={rootRef} className="language-switcher" style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="lang-trigger"
        style={{
          borderRadius: 12,
          padding: '8px 10px',
          border: '1px solid rgba(148,163,184,0.26)',
          background: 'rgba(15,23,42,0.55)',
          color: 'rgba(226,232,240,0.92)',
          fontWeight: 900,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          gap: 8,
          alignItems: 'center',
          minWidth: 92,
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <span aria-hidden="true">{currentLang?.flag || ''}</span>
          <span>{String(currentLang?.code || 'en').toUpperCase()}</span>
        </span>
        <span aria-hidden="true" style={{ opacity: 0.8 }}>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t?.('language.select') || 'Select Language'}
          className="lang-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 50,
            width: 260,
            borderRadius: 16,
            border: '1px solid rgba(56,189,248,0.20)',
            background: 'linear-gradient(135deg, rgba(2,6,23,0.96), rgba(8,47,73,0.75))',
            boxShadow: '0 18px 46px rgba(2,6,23,0.72)',
            padding: 10,
          }}
        >
          <div style={{ color: 'rgba(226,232,240,0.95)', fontWeight: 950, marginBottom: 8 }}>
            {t?.('language.select') || 'Select Language'}
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            {langs.map((lang) => {
              const isActive = lang.code === currentLang?.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => applyLanguage(lang.code)}
                  disabled={loading}
                  aria-selected={isActive}
                  className={`lang-item ${isActive ? 'active' : ''}`}
                  style={{
                    borderRadius: 14,
                    padding: '10px 10px',
                    border: isActive ? '1px solid rgba(0,255,136,0.35)' : '1px solid rgba(148,163,184,0.16)',
                    background: isActive ? 'rgba(0,255,136,0.10)' : 'rgba(15,23,42,0.55)',
                    color: 'rgba(226,232,240,0.92)',
                    textAlign: 'start',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                    <span aria-hidden="true">{lang.flag || ''}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lang.name}
                    </span>
                    <span style={{ opacity: 0.7, fontWeight: 900 }}>{lang.code.toUpperCase()}</span>
                  </span>
                  {isActive ? (
                    <span
                      style={{
                        borderRadius: 999,
                        padding: '4px 8px',
                        border: '1px solid rgba(0,255,136,0.35)',
                        background: 'rgba(0,255,136,0.08)',
                        fontSize: 11,
                        fontWeight: 950,
                      }}
                    >
                      {t?.('language.active') || 'Active'}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 10, color: 'rgba(148,163,184,0.95)', fontSize: 12 }}>
            <span aria-hidden="true">⚙️</span> {t?.('language.tip') || 'Tip: You can change anytime'}
          </div>

          {loading ? (
            <div style={{ marginTop: 8, color: 'rgba(226,232,240,0.9)', fontWeight: 900, fontSize: 12 }}>
              {t?.('language.loading') || 'Switching language…'}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
