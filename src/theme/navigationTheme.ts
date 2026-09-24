import { DefaultTheme, Theme } from "@react-navigation/native";
import { colors, fonts } from "./theme";

// React Navigation reads header titles, tab labels and screen backgrounds from
// this. Every fontWeight is "400" because the weight lives in the family name.
export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.daylight,
    card: colors.daylight,
    text: colors.ink,
    border: colors.hairline,
    notification: colors.accent,
  },
  fonts: {
    regular: { fontFamily: fonts.regular, fontWeight: "400" },
    medium: { fontFamily: fonts.medium, fontWeight: "400" },
    bold: { fontFamily: fonts.semibold, fontWeight: "400" },
    heavy: { fontFamily: fonts.bold, fontWeight: "400" },
  },
};
