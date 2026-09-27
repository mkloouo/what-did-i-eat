import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./locales/en.json";
import ukUA from "./locales/uk-UA.json";

const resources = {
  en: { translation: en },
  ["uk-UA"]: { translation: ukUA },
} as const;

export const SUPPORTED_LANGUAGES = Object.keys(resources);

// expo-localization returns the device's preferred locales, most-preferred
// first. Resource keys may be a bare language code ("en") or a full tag
// ("uk-UA"), so match each device locale against both its languageTag and
// languageCode before falling back to "en".
const supportedByLowerCase = new Map(
  SUPPORTED_LANGUAGES.map((lang) => [lang.toLowerCase(), lang]),
);

export function resolveDeviceLanguage(): string {
  return (
    Localization.getLocales()
      .flatMap((locale) => [locale.languageTag, locale.languageCode])
      .map((tag) => tag && supportedByLowerCase.get(tag.toLowerCase()))
      .find((lang): lang is string => lang != null) ?? "en"
  );
}

i18n.use(initReactI18next).init({
  resources,
  lng: resolveDeviceLanguage(),
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
