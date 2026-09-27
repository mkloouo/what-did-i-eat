import { useEffect } from "react";
import i18n, { resolveDeviceLanguage } from ".";
import { useAppSelector } from "../store/hooks";

// Applies the user's manual language choice from Settings, or follows the
// device language when they've left it on "system". Rendered once, inside
// the Redux Provider, so it can react to changes made on the Settings screen
// and to the persisted value once redux-persist rehydrates.
export function LocaleSync() {
  const locale = useAppSelector((state) => state.settings.locale ?? "system");

  useEffect(() => {
    const target = locale === "system" ? resolveDeviceLanguage() : locale;
    if (i18n.language !== target) i18n.changeLanguage(target);
  }, [locale]);

  return null;
}
