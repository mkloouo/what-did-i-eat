import Constants from "expo-constants";

// APP_VARIANT from the build's environment, baked in by app.config.js.
// Production builds (no APP_VARIANT) report "production".
export const isDevelopmentVariant =
  Constants.expoConfig?.extra?.appVariant === "development";
