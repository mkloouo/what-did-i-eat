import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useAppSelector } from "../../store/hooks";
import { TagChip } from "../TagChip";
import { theme } from "../../theme/theme";

type Props = {
  activeTagId: string | null;
  onSelect: (tagId: string | null) => void;
};

// One tag is active at a time; tapping the active tag clears the filter.
export function TagFilterRail({ activeTagId, onSelect }: Props) {
  const tags = useAppSelector((state) => Object.values(state.tags));

  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {tags.map((tag) => {
        const selected = tag.id === activeTagId;
        return (
          <TagChip
            key={tag.id}
            icon={tag.icon}
            label={tag.label}
            selected={selected}
            iconOnly
            onPress={() => onSelect(selected ? null : tag.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
});
