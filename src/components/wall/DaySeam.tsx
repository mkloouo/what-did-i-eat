import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../theme/theme";

type Props = {
  label: string;
};

// A day's own name and a hairline — nothing else. No count: the Wall never
// tells you how many meals you logged, only which day you're looking at.
export function DaySeam({ label }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  label: {
    ...theme.typography.subtitle,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.bone,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.hairline,
  },
});
