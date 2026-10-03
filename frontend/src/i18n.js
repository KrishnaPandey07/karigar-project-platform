import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

const savedLang = localStorage.getItem('karigar_lang') || 'hi';

i18n.use(initReactI18next).init({
  resources: {
    hi: {
      translation: hi,
    },
    en: {
      translation: en,
    },
  },
  lng: savedLang,
  fallbackLng: 'hi',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export const changeLanguage = (lang) => {
  localStorage.setItem('karigar_lang', lang);
  i18n.changeLanguage(lang);
};

export default i18n;
