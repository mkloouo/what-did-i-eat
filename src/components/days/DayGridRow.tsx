import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { DaySection } from "../../store/selectors/feedSelectors";
import { buildDayGrid, cellTargetEntryId } from "./dayGrid";
import { DayGridCell } from "./DayGridCell";
import { computeCellSize, GUTTER, LABEL_WIDTH } from "./gridLayout";
import { theme } from "../../theme/theme";

type Props = {
  section: DaySection;
  label: string;
  onPressCell: (entryId: string) => void;
};

// One day, one row, fixed height — it never grows for a busier day. Each of
// the five slot cells shows its entries as a density mosaic (DayGridCell);
// tapping a cell jumps the Line to that slot (cellTargetEntryId). Cell
// size comes from computeCellSize (gridLayout.ts) rather than a fixed
// constant, so the row always fits the screen width instead of running
// five fixed-~52dp cells off the right edge on a narrower phone.
export function DayGridRow({ section, label, onPressCell }: Props) {
  const cells = buildDayGrid(section);
  const { width } = useWindowDimensions();
  const cellSize = computeCellSize(width, theme.spacing.md);

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
            size={cellSize}
            onPress={() => {
              const target = cellTargetEntryId(cell);
              if (target) onPressCell(target);
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
