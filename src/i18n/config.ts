import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from '../locales/es.json' with { type: 'json' };
import en from '../locales/en.json' with { type: 'json' };

const resources = {
  es: { translation: es },
  en: { translation: en },
};

function doInit(lng: string): void {
  i18next.use(initReactI18next).init({
    lng,
    fallbackLng: 'es',
    resources,
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

if (!i18next.isInitialized) {
  doInit('es');
}

export function initializeI18n(locale = 'es'): typeof i18next {
  if (i18next.isInitialized) {
    i18next.changeLanguage(locale);
  } else {
    doInit(locale);
  }
  return i18next;
}

export default i18next;
