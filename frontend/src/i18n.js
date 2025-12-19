// frontend/src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';
import trTranslations from './locales/tr.json';
import ruTranslations from './locales/ru.json';
import zhTranslations from './locales/zh.json';

const SUPPORTED_LANGS = ['ar', 'en', 'tr', 'ru', 'zh'];

const LANG_DIR = {
  ar: 'rtl',
  en: 'ltr',
  tr: 'ltr',
  ru: 'ltr',
  zh: 'ltr',
};

function safeDocument() {
  if (typeof document === 'undefined') return null;
  return document;
}

function normalizeLang(code) {
  const c = String(code || '').trim();
  if (!c) return '';
  return c.split('-')[0].toLowerCase();
}

function pickInitialLanguage() {
  // الافتراضي (حسب سلوكك الحالي)
  let initial = 'ar';

  // 1) localStorage qa_lang
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage?.getItem('qa_lang');
      const storedNorm = normalizeLang(stored);
      if (SUPPORTED_LANGS.includes(storedNorm)) {
        initial = storedNorm;
        return initial;
      }
    } catch {
      // ignore
    }

    // 2) navigator.language (اختياري)
    try {
      const nav = normalizeLang(window.navigator?.language);
      if (SUPPORTED_LANGS.includes(nav)) {
        initial = nav;
        return initial;
      }
    } catch {
      // ignore
    }
  }

  return initial;
}

function applyHtmlLangDir(langCode) {
  const d = safeDocument();
  if (!d) return;

  const code = normalizeLang(langCode) || 'en';
  const dir = LANG_DIR[code] || 'ltr';

  const html = d.documentElement;
  html.setAttribute('lang', code);
  html.setAttribute('dir', dir);
  html.setAttribute('data-lang', code);
}

const initialLanguage = pickInitialLanguage();

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: arTranslations },
    en: { translation: enTranslations },
    tr: { translation: trTranslations },
    ru: { translation: ruTranslations },
    zh: { translation: zhTranslations },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGS,
  nonExplicitSupportedLngs: true,
  interpolation: {
    escapeValue: false, // React يحمي من XSS افتراضياً
  },
  react: {
    useSuspense: false,
  },
  returnNull: false,
});

// مزامنة lang/dir + حفظ qa_lang عند أي تغيير لغة (Guarded)
try {
  applyHtmlLangDir(initialLanguage);

  i18n.on('languageChanged', (lng) => {
    const code = normalizeLang(lng) || 'en';
    applyHtmlLangDir(code);

    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem('qa_lang', code);
      } catch {
        // ignore
      }
    }
  });
} catch {
  // ignore
}

export default i18n;
