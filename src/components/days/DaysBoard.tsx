import { FlatList, StyleSheet } from "react-native";
import { DaySection } from "../../store/selectors/feedSelectors";
import { dayLabelShort } from "../../utils/dateFormat";
import { DayGridRow } from "./DayGridRow";
import { SlotHeaderRow } from "./SlotHeaderRow";
import { theme } from "../../theme/theme";

type Props = {
  sections: DaySection[];
  onPressCell: (entryId: string) => void;
};

// The Days body: a pinned row naming the five slot columns, then one
// fixed-height DayGridRow per day, newest first (sections already arrive
// sorted that way from selectFeedSections).
export function DaysBoard({ sections, onPressCell }: Props) {
  return (
    <FlatList
      data={sections}
      keyExtractor={(section) => section.dayKey}
      ListHeaderComponent={SlotHeaderRow}
      stickyHeaderIndices={[0]}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <DayGridRow
          section={item}
          label={dayLabelShort(item.dayKey)}
          onPressCell={onPressCell}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
  },
});
