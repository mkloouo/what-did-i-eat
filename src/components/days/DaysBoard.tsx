import React from "react";
import { FlatList, StyleSheet } from "react-native";
import { DaySection } from "../../store/selectors/groupSelectors";
import { dayKeyOf, dayLabel } from "../../utils/dateFormat";
import { DayBand } from "./DayBand";
import { theme } from "../../theme/theme";

type Props = {
  sections: DaySection[];
  onPressDay: (dayKey: string) => void;
};

// The Days body: one DayBand per day, newest first (sections already arrive
// sorted that way from selectFeedSections). A plain FlatList is enough —
// there are far fewer day-bands than Wall pieces, so FlashList's
// virtualization isn't needed here.
export function DaysBoard({ sections, onPressDay }: Props) {
  const todayKey = dayKeyOf(new Date().toISOString());

  return (
    <FlatList
      data={sections}
      keyExtractor={(section) => section.dayKey}
      contentContainerStyle={styles.content}
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
