import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "./locales/en/translation.json";
import ukTranslation from "./locales/uk/translation.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    uk: { translation: ukTranslation },
  },
  lng: "en", // мова за замовчуванням
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React сам екранує
  },
});

export default i18n;
