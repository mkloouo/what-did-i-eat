import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  FlashList,
  FlashListRef,
  ListRenderItemInfo,
  ViewToken,
} from "@shopify/flash-list";
import { WallPiece } from "./WallPiece";
import { DaySeam } from "./DaySeam";
import { Scrubber } from "./Scrubber";
import {
  WallItem,
  firstItemIndexForDay,
  currentDayFromViewableItems,
} from "../../utils/wallItems";
import { Tag } from "../../types/models";
import { theme } from "../../theme/theme";

type Props = {
  items: WallItem[];
  dayKeys: string[];
  tagsById: Record<string, Tag>;
  wallColumns: number;
  scrubberEnabled: boolean;
  onPressEntry: (entryId: string) => void;
  // Set by a Days-view tap asking to jump to a day; cleared via
  // onScrolledToDay once this feed has scrolled there.
  pendingScrollDayKey: string | null;
  onScrolledToDay: () => void;
};

export function WallFeed({
  items,
  dayKeys,
  tagsById,
  wallColumns,
  scrubberEnabled,
  onPressEntry,
  pendingScrollDayKey,
  onScrolledToDay,
}: Props) {
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const listRef = useRef<FlashListRef<WallItem>>(null);

  function scrollToDay(dayKey: string) {
    const index = firstItemIndexForDay(items, dayKey);
    if (index < 0) return;
    // Not animated: the Scrubber calls this to track a drag in progress,
    // so the list should jump to each new target immediately. An animated
    // scroll interpolates over time, and a drag can re-target this well
    // before the previous animation finishes — repeatedly interrupting and
    // re-easing is what made the scrubber visibly fight itself.
    listRef.current?.scrollToIndex({ index, animated: false }).catch(() => {
      // The row may not have a measured position yet on the first attempt —
      // one retry after a frame is enough for FlashList to have settled.
      requestAnimationFrame(() => {
        listRef.current
          ?.scrollToIndex({ index, animated: false })
          .catch(() => {});
      });
    });
  }

  useEffect(() => {
    if (!pendingScrollDayKey) return;
    scrollToDay(pendingScrollDayKey);
    onScrolledToDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingScrollDayKey, items]);

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
        wallColumns={wallColumns}
        onPressEntry={onPressEntry}
      />
    );
  }

  return (
    <View style={styles.body}>
      <FlashList
        ref={listRef}
        style={styles.list}
        data={items}
        // The custom Scrubber is the Wall's scroll indicator when it's
        // on; the native one would just double up on the same edge.
        // Falls back to the native one if the Scrubber's ever off.
        showsVerticalScrollIndicator={!scrubberEnabled}
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
  );
}

const styles = StyleSheet.create({
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
});
