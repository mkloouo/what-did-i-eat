import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./locales/en.json";
import ukUA from "./locales/uk-UA.json";

const resources = {
  en: { translation: en },
  ["uk-UA"]: { translation: ukUA },
} as const;

// expo-localization returns the device's preferred locales, most-preferred
// first. We only ship "en" and "ua-UA" so far, so pick the first one we
// actually have a resource bundle for and fall back to "en" otherwise.
const supportedLanguages = Object.keys(resources);
const deviceLanguageTag = Localization.getLocales()[0]?.languageCode ?? "en";
const initialLanguage = supportedLanguages.includes(deviceLanguageTag)
  ? deviceLanguageTag
  : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  // Locale files (like uk-UA.json, filled in by the translation-management service) start out with empty
  // string values as placeholders for missing translations. Without this,
  // i18next treats "" as a real (blank) translation and renders nothing;
  // with it, an empty value is treated as missing and falls back to "en".
  returnEmptyString: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
