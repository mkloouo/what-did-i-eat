import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme/theme";

type Props = {
  label: string;
};

export function DayDivider({ label }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.pill}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.md,
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  label: {
    ...theme.typography.subtitle,
    color: theme.colors.muted,
  },
});
