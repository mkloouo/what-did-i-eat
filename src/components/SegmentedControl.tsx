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
    borderRadius: theme.radii.pill,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.muted,
  },
  segment: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  segmentTextActive: {
    color: theme.colors.textOnDark,
    fontWeight: "700",
  },
});
