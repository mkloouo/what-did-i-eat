import { useState } from "react";
import { Modal, Pressable, View, Text, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "../theme/theme";

// A single-choice picker: a row showing the current value that opens a
// sheet listing every option, with a check on the selected one. Plain JS
// (no native picker module), so it looks and works the same on both
// platforms.
export function OptionPicker<T>({
  value,
  options,
  onChange,
  accessibilityLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        style={styles.field}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: selected?.label }}
      >
        <Text style={styles.fieldText}>{selected?.label}</Text>
        <Ionicons
          name="chevron-down-outline"
          size={18}
          color={theme.colors.graphite}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={option.label}
                  style={[styles.option, index > 0 && styles.optionDivider]}
                  onPress={() => {
                    setOpen(false);
                    if (!isSelected) onChange(option.value);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={theme.colors.accent}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
  },
  fieldText: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
    backgroundColor: "rgba(42, 36, 23, 0.4)",
  },
  sheet: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.daylight,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  optionDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
  },
  optionText: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  optionTextSelected: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.semibold,
  },
});
