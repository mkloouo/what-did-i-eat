import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DaySection } from "../../store/selectors/groupSelectors";
import { buildDayGrid } from "./dayGrid";
import { DayGridCell } from "./DayGridCell";
import { theme } from "../../theme/theme";

export const CELL_SIZE = 52;
export const GUTTER = 8;
export const LABEL_WIDTH = 64;

type Props = {
  section: DaySection;
  label: string;
  onPressCell: (groupId: string) => void;
};

// One day, one row, fixed height — it never grows for a busier day. Each of
// the five slot cells shows its meal(s) as a density mosaic (DayGridCell);
// tapping a cell jumps the Wall to that specific meal, since a cell always
// maps to exactly one meal (or an ordered few, oldest tapped first).
export function DayGridRow({ section, label, onPressCell }: Props) {
  const cells = buildDayGrid(section);

  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.cells}>
        {cells.map((cell) => (
          <DayGridCell
            key={cell.slotIndex}
            cell={cell}
            size={CELL_SIZE}
            onPress={() => {
              const target = cell.meals[0];
              if (target) onPressCell(target.id);
            }}
          />
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
    marginBottom: GUTTER,
    gap: GUTTER,
  },
  labelCol: {
    width: LABEL_WIDTH,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.graphite,
  },
  cells: {
    flexDirection: "row",
    gap: GUTTER,
  },
});
