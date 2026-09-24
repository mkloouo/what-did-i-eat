import { Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TagIcon } from "../types/models";
import { theme } from "../theme/theme";

type Props = {
  icon: TagIcon;
  label: string;
  selected?: boolean;
  // When true and not selected, renders as a small icon-only circle with no
  // label — the tag filter rail's collapsed state. Selecting it (or setting
  // `selected` directly) always shows the icon and label together.
  iconOnly?: boolean;
  onPress?: () => void;
};

export function TagChip({
  icon,
  label,
  selected = false,
  iconOnly = false,
  onPress,
}: Props) {
  const collapsed = iconOnly && !selected;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.chip,
        collapsed && styles.chipCollapsed,
        selected && styles.chipSelected,
      ]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={selected ? theme.colors.chipText : theme.colors.graphite}
        style={collapsed ? undefined : styles.icon}
      />
      {collapsed ? null : (
        <Text style={[styles.label, selected && styles.labelSelected]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  chipCollapsed: {
    width: 30,
    height: 30,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: theme.colors.chip,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.ink,
  },
  labelSelected: {
    color: theme.colors.chipText,
    fontFamily: theme.fonts.semibold,
  },
});
