import React, { useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  FlashList,
  FlashListRef,
  ListRenderItemInfo,
  ViewToken,
} from "@shopify/flash-list";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector } from "../store/hooks";
import { selectFeedSections } from "../store/selectors/groupSelectors";
import {
  buildWallItems,
  firstItemIndexForDay,
  currentDayFromViewableItems,
  WallItem,
} from "../utils/wallItems";
import { WallPiece } from "../components/wall/WallPiece";
import { DaySeam } from "../components/wall/DaySeam";
import { TagFilterRail } from "../components/wall/TagFilterRail";
import { Scrubber } from "../components/wall/Scrubber";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

export function WallScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const listRef = useRef<FlashListRef<WallItem>>(null);

  const sections = useAppSelector((state) =>
    selectFeedSections(state, activeTagId),
  );
  const tagsById = useAppSelector((state) => state.tags);
  const photoLayoutAlgorithm = useAppSelector(
    (state) => state.settings.photoLayoutAlgorithm,
  );
  // redux-persist replaces the whole appMeta object on load, so an existing
  // install without this key would read undefined — never trust it raw.
  const scrubberEnabled = useAppSelector(
    (state) => state.appMeta.scrubberEnabled ?? true,
  );

  const items = useMemo(() => buildWallItems(sections), [sections]);
  const dayKeys = useMemo(
    () => sections.map((section) => section.dayKey),
    [sections],
  );

  function scrollToDay(dayKey: string) {
    const index = firstItemIndexForDay(items, dayKey);
    if (index < 0) return;
    listRef.current?.scrollToIndex({ index, animated: true }).catch(() => {
      // The row may not have a measured position yet on the first attempt —
      // one retry after a frame is enough for FlashList to have settled.
      requestAnimationFrame(() => {
        listRef.current
          ?.scrollToIndex({ index, animated: true })
          .catch(() => {});
      });
    });
  }

  function handleViewableItemsChanged({
    viewableItems,
  }: {
    viewableItems: ViewToken<WallItem>[];
  }) {
    const indices = viewableItems
      .map((token) => token.index)
      .filter((index): index is number => index !== null);
    setActiveDayKey(currentDayFromViewableItems(items, indices));
  }

  function renderItem({ item }: ListRenderItemInfo<WallItem>) {
    if (item.type === "day") {
      return <DaySeam label={item.label} />;
    }
    return (
      <WallPiece
        group={item.group}
        tagsById={tagsById}
        photoLayoutAlgorithm={photoLayoutAlgorithm}
        onPressEntry={(entryId) =>
          navigation.navigate("EntryDetails", { entryId })
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <Text style={styles.title}>What did I eat</Text>
        <Pressable
          onPress={() => navigation.navigate("Settings")}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={styles.settingsButton}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={theme.colors.chalk}
          />
        </Pressable>
      </View>

      <TagFilterRail activeTagId={activeTagId} onSelect={setActiveTagId} />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing on the wall yet</Text>
          <Text style={styles.emptyBody}>
            Photograph the next thing you eat.
          </Text>
        </View>
      ) : (
        <View style={styles.body}>
          <FlashList
            ref={listRef}
            style={styles.list}
            data={items}
            keyExtractor={(item) =>
              item.type === "day" ? `day-${item.dayKey}` : item.group.id
            }
            getItemType={(item) => item.type}
            renderItem={renderItem}
            onViewableItemsChanged={handleViewableItemsChanged}
            contentContainerStyle={styles.listContent}
            // Off: it's meant for chat-like screens where content is
            // prepended above/below an anchor. Enabled (FlashList's
            // default), it reacts to redux-persist's entries hydrating
            // just after mount — data going empty-to-populated reads as
            // "content added above" — by reserving blank leading space
            // meant to hold scroll position for a scroll that never
            // happened.
            maintainVisibleContentPosition={{ disabled: true }}
          />
          {scrubberEnabled ? (
            <Scrubber
              dayKeys={dayKeys}
              activeDayKey={activeDayKey}
              onSelectDay={scrollToDay}
            />
          ) : null}
        </View>
      )}

      <Pressable
        onPress={() => navigation.navigate("NewEntry")}
        style={[
          styles.captureButton,
          { marginBottom: insets.bottom + theme.spacing.md },
        ]}
      >
        <Ionicons name="camera" size={17} color={theme.colors.wall} />
        <Text style={styles.captureLabel}>Hang a new one</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.wall,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.subtitle,
    color: theme.colors.bone,
  },
  settingsButton: {
    padding: theme.spacing.xs,
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.bone,
  },
  emptyBody: {
    ...theme.typography.body,
    color: theme.colors.chalk,
    textAlign: "center",
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    height: 48,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.bone,
  },
  captureLabel: {
    ...theme.typography.subtitle,
    color: theme.colors.wall,
  },
});
