import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import esAR from './locales/es-AR.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'es-AR': {
        translation: esAR,
      },
    },
    lng: 'es-AR',
    fallbackLng: 'es-AR',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
