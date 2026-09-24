import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SLOT_LABELS } from "./timeSlots";
import { CELL_SIZE, GUTTER, LABEL_WIDTH } from "./DayGridRow";
import { theme } from "../../theme/theme";

// The pinned header above every day row, naming the five time-of-day slot
// columns so they stay legible while the board scrolls (DaysBoard makes
// this row sticky via FlatList's stickyHeaderIndices).
export function SlotHeaderRow() {
  return (
    <View style={styles.row}>
      <View style={styles.labelCol} />
      <View style={styles.cells}>
        {SLOT_LABELS.map((slotLabel) => (
          <Text key={slotLabel} style={styles.slot} numberOfLines={1}>
            {slotLabel}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.daylight,
    gap: GUTTER,
  },
  labelCol: {
    width: LABEL_WIDTH,
  },
  cells: {
    flexDirection: "row",
    gap: GUTTER,
  },
  slot: {
    ...theme.typography.caption,
    color: theme.colors.graphite,
    width: CELL_SIZE,
    textAlign: "center",
  },
});
