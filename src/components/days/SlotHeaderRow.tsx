import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { SLOT_LABELS, SLOT_SHORT_LABELS } from "./timeSlots";
import { computeCellSize, GUTTER, LABEL_WIDTH } from "./gridLayout";
import { theme } from "../../theme/theme";

// The pinned header above every day row, naming the five time-of-day slot
// columns so they stay legible while the board scrolls (DaysBoard makes
// this row sticky via FlatList's stickyHeaderIndices). Uses the same
// computeCellSize call as DayGridRow, with the same window width, so its
// columns line up with every row's cells.
export function SlotHeaderRow() {
  const { width } = useWindowDimensions();
  const cellSize = computeCellSize(width, theme.spacing.md);

  return (
    <View style={styles.row}>
      <View style={styles.labelCol} />
      <View style={styles.cells}>
        {SLOT_SHORT_LABELS.map((shortLabel, index) => (
          <Text
            key={shortLabel}
            style={[styles.slot, { width: cellSize }]}
            numberOfLines={1}
            accessibilityLabel={SLOT_LABELS[index]}
          >
            {shortLabel}
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
    textAlign: "center",
  },
});
