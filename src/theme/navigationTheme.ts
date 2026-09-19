import { DarkTheme, Theme } from "@react-navigation/native";
import { colors, fonts } from "./theme";

// React Navigation reads header titles, tab labels and screen backgrounds from
// this. Every fontWeight is "400" because the weight lives in the family name.
export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.brass,
    background: colors.wall,
    card: colors.wall,
    text: colors.bone,
    border: colors.hairline,
    notification: colors.brass,
  },
  fonts: {
    regular: { fontFamily: fonts.regular, fontWeight: "400" },
    medium: { fontFamily: fonts.medium, fontWeight: "400" },
    bold: { fontFamily: fonts.semibold, fontWeight: "400" },
    heavy: { fontFamily: fonts.bold, fontWeight: "400" },
  },
};
