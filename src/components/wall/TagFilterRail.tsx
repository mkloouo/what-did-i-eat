import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useAppSelector } from "../../store/hooks";
import { TagChip } from "../TagChip";
import { theme } from "../../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

type Props = {
  activeTagId: string | null;
  onSelect: (tagId: string | null) => void;
};

// One tag is active at a time; tapping the active tag clears the filter.
// The trailing Edit button always shows, even with no tags yet, since it's
// how a first-time user reaches the Tags screen to create one.
export function TagFilterRail({ activeTagId, onSelect }: Props) {
  const navigation = useNavigation<Nav>();
  const tags = useAppSelector((state) => Object.values(state.tags));

  return (
    <View>
      <ScrollView
        horizontal
        style={styles.scroll}
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
        <Pressable
          onPress={() => navigation.navigate("Tags")}
          accessibilityRole="button"
          accessibilityLabel="Edit tags"
          style={styles.editButton}
        >
          <Ionicons
            name="pencil-outline"
            size={14}
            color={theme.colors.graphite}
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Left unstyled, a ScrollView doesn't size itself to content in a flex
  // column the way a plain View does — it expands to claim the remaining
  // vertical space like a flex:1 sibling would. flexGrow: 0 pins the rail
  // to its content's own height (the chip row).
  scroll: {
    flexGrow: 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    // A touch of top breathing room: without it, a selected chip's taller
    // label row (versus the collapsed icon-only ones) can read as clipped
    // against whatever sits directly above the rail.
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
});
