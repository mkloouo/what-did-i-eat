import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { EntryGroup } from "../../store/selectors/groupSelectors";
import { entryForPhotoIndex } from "../../utils/entryForPhotoIndex";
import { PhotoStack } from "../PhotoStack";
import { formatTime } from "../../utils/dateFormat";
import { Tag } from "../../types/models";
import { theme } from "../../theme/theme";

const VISIBLE_ENTRY_COUNT = 3;

type Props = {
  group: EntryGroup;
  tagsById: Record<string, Tag>;
  wallColumns: number;
  onPressEntry: (entryId: string) => void;
};

export function WallPiece({
  group,
  tagsById,
  wallColumns,
  onPressEntry,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const visibleEntries = expanded
    ? group.entries
    : group.entries.slice(0, VISIBLE_ENTRY_COUNT);
  const hiddenCount = group.entries.length - visibleEntries.length;

  return (
    <View>
      <PhotoStack
        photosByEntry={group.photosByEntry}
        columns={wallColumns}
        cornerRadius={0}
        onPhotoPress={(index) => {
          const entry = entryForPhotoIndex(
            group.photosByEntry,
            group.entries,
            index,
          );
          if (entry) onPressEntry(entry.id);
        }}
      />
      <View style={styles.labels}>
        {visibleEntries.map((entry) => {
          const tagLabels = (entry.tagIds ?? [])
            .map((id) => tagsById[id]?.label)
            .filter((label): label is string => Boolean(label));
          return (
            <Pressable
              key={entry.id}
              style={styles.row}
              onPress={() => onPressEntry(entry.id)}
            >
              <Text style={styles.time}>{formatTime(entry.createdAt)}</Text>
              {entry.comment ? (
                <Text style={styles.comment} numberOfLines={2}>
                  {entry.comment}
                </Text>
              ) : null}
              {tagLabels.length > 0 ? (
                <Text style={styles.tags}>{tagLabels.join(", ")}</Text>
              ) : null}
            </Pressable>
          );
        })}
        {hiddenCount > 0 ? (
          <Pressable onPress={() => setExpanded(true)}>
            <Text style={styles.more}>+{hiddenCount} more</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  row: {
    gap: 2,
  },
  time: {
    ...theme.typography.time,
    color: theme.colors.bone,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.bone,
  },
  tags: {
    ...theme.typography.caption,
    color: theme.colors.brass,
  },
  more: {
    ...theme.typography.caption,
    color: theme.colors.chalk,
  },
});
