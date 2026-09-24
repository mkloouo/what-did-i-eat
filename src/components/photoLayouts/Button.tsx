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
    ? theme.colors.surface
    : variant === "danger"
      ? theme.colors.clay
      : theme.colors.ink;
  const textColor = disabled ? theme.colors.graphite : theme.colors.daylight;

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
