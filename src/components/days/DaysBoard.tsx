import React from "react";
import { FlatList, StyleSheet } from "react-native";
import { DaySection } from "../../store/selectors/groupSelectors";
import { Entry } from "../../types/models";
import { dayKeyOf, dayLabel } from "../../utils/dateFormat";
import { DayBand } from "./DayBand";
import { DaysHero } from "./DaysHero";
import { theme } from "../../theme/theme";

type Props = {
  sections: DaySection[];
  latestEntry: Entry | null;
  onPressDay: (dayKey: string) => void;
  onPressEntry: (entryId: string) => void;
};

// The Days body: a hero for your latest meal, then one DayBand per day,
// newest first (sections already arrive sorted that way from
// selectFeedSections). A plain FlatList is enough — there are far fewer
// day-bands than Wall pieces, so FlashList's virtualization isn't needed
// here.
export function DaysBoard({
  sections,
  latestEntry,
  onPressDay,
  onPressEntry,
}: Props) {
  const todayKey = dayKeyOf(new Date().toISOString());

  return (
    <FlatList
      data={sections}
      keyExtractor={(section) => section.dayKey}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        latestEntry ? (
          <DaysHero
            entry={latestEntry}
            onPress={() => onPressEntry(latestEntry.id)}
          />
        ) : null
      }
      renderItem={({ item }) => (
        <DayBand
          section={item}
          label={dayLabel(item.dayKey)}
          isToday={item.dayKey === todayKey}
          onPress={onPressDay}
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
