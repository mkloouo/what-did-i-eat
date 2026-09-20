import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppSelector } from "../../store/hooks";
import { selectEntriesSortedByDate } from "../../store/selectors/groupSelectors";
import { previewGroups } from "./previewGroups";
import { theme } from "../../theme/theme";

const PREVIEW_COUNT = 10;

type Props = {
  rollingWindowMinutes: number;
};

// A live preview of the merge window: the user's most recent entries as
// dots, clustered into the pills they'd actually merge into at the
// current slider value. Updates on every drag, since rollingWindowMinutes
// is passed straight from Settings' own live state.
export function MergeWindowPreview({ rollingWindowMinutes }: Props) {
  const sorted = useAppSelector(selectEntriesSortedByDate);
  const recent = sorted.slice(-PREVIEW_COUNT);

  if (recent.length < 2) {
    return <Text style={styles.hint}>Log a few meals to preview this.</Text>;
  }

  const groups = previewGroups(recent, rollingWindowMinutes);

  return (
    <View style={styles.row}>
      {groups.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.group}>
          {group.map((entry) => (
            <View key={entry.id} style={styles.dot} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.seam,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.brass,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.chalk,
    marginTop: theme.spacing.sm,
  },
});
