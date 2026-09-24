import { FlatList, StyleSheet } from "react-native";
import { DaySection } from "../../store/selectors/groupSelectors";
import { Entry } from "../../types/models";
import { dayLabelShort } from "../../utils/dateFormat";
import { DayGridRow } from "./DayGridRow";
import { SlotHeaderRow } from "./SlotHeaderRow";
import { DaysHero } from "./DaysHero";
import { theme } from "../../theme/theme";

type Row =
  | { type: "hero"; entry: Entry }
  | { type: "header" }
  | { type: "day"; section: DaySection };

type Props = {
  sections: DaySection[];
  latestEntry: Entry | null;
  onPressCell: (groupId: string) => void;
  onPressEntry: (entryId: string) => void;
};

// The Days body: an optional hero for your latest meal, a pinned row naming
// the five slot columns, then one fixed-height DayGridRow per day, newest
// first (sections already arrive sorted that way from selectFeedSections).
export function DaysBoard({
  sections,
  latestEntry,
  onPressCell,
  onPressEntry,
}: Props) {
  const rows: Row[] = [];
  if (latestEntry) rows.push({ type: "hero", entry: latestEntry });
  rows.push({ type: "header" });
  for (const section of sections) rows.push({ type: "day", section });

  const headerIndex = rows.findIndex((row) => row.type === "header");

  return (
    <FlatList
      data={rows}
      keyExtractor={(row, index) =>
        row.type === "day" ? row.section.dayKey : `${row.type}-${index}`
      }
      stickyHeaderIndices={[headerIndex]}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => {
        if (item.type === "hero") {
          return (
            <DaysHero
              entry={item.entry}
              onPress={() => onPressEntry(item.entry.id)}
            />
          );
        }
        if (item.type === "header") {
          return <SlotHeaderRow />;
        }
        return (
          <DayGridRow
            section={item.section}
            label={dayLabelShort(item.section.dayKey)}
            onPressCell={onPressCell}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
});
