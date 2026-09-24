import { Pressable, View, StyleSheet, Text } from "react-native";
import { theme } from "../theme/theme";

export function SegmentedControl<T>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <Pressable
          key={option.label}
          onPress={() => onChange(option.value)}
          style={[
            styles.segment,
            value === option.value && styles.segmentActive,
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              value === option.value && styles.segmentTextActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: "row",
    gap: 2,
    padding: 2,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
  },
  segment: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.radii.sm,
  },
  segmentActive: {
    backgroundColor: theme.colors.chip,
  },
  segmentText: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  segmentTextActive: {
    color: theme.colors.chipText,
    fontFamily: theme.fonts.semibold,
  },
});
