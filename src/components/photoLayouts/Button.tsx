import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { theme } from "../../theme/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "danger";
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  style,
}: Props) {
  const backgroundColor = disabled
    ? theme.colors.seam
    : variant === "danger"
      ? theme.colors.clay
      : theme.colors.bone;
  const textColor = disabled ? theme.colors.chalk : theme.colors.wall;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor }, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...theme.typography.subtitle,
    textAlign: "center",
  },
});
