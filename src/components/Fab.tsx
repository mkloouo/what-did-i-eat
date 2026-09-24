import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/theme";

type FabVariant = "add" | "camera";

type Props = {
  variant: FabVariant;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Fab({ variant, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.fab, style]}
      accessibilityRole="button"
      accessibilityLabel={`New entry using ${variant} button`}
    >
      <Ionicons name={variant} size={28} color={theme.colors.textOnDark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
