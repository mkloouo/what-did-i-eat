import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { theme } from "../theme/theme";

type Props = {
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function CountBadge({ label, style }: Props) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.xs + 2,
    paddingVertical: 2,
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.bone,
    fontFamily: theme.fonts.semibold,
  },
});
