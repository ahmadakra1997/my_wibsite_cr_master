// frontend/src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';

// محاولة قراءة اللغة المحفوظة (إن وُجدت)
// مع الحفاظ على السلوك الحالي: الافتراضي = "ar"
let initialLanguage = 'ar';

if (typeof window !== 'undefined') {
  try {
    const stored = window.localStorage.getItem('qa_lang');
    if (stored) {
      initialLanguage = stored;
    }
  } catch {
    // في حال منع الـ localStorage لا نفعل شيء
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: arTranslations },
      en: { translation: enTranslations },
    },
    lng: initialLanguage, // اللغة الافتراضية / المحفوظة
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React يتكفّل بالحماية
    },
  });

export default i18n;
