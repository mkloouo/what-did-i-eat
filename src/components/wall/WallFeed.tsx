import { useEffect, useRef, useState } from "react";
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
  firstItemIndexForGroup,
  currentDayFromViewableItems,
} from "../../utils/wallItems";
// firstItemIndexForDay above still backs scrollToDay (the Scrubber's drag
// target); the mount-time day jump it used to also serve was removed below —
// the Days view's whole-row tap no longer exists, only its per-cell tap.
import { Tag } from "../../types/models";
import { theme } from "../../theme/theme";

type Props = {
  items: WallItem[];
  dayKeys: string[];
  tagsById: Record<string, Tag>;
  wallColumns: number;
  onPressEntry: (entryId: string) => void;
  // Set by a Days-view cell tap asking to jump to one specific meal;
  // cleared via onScrolledToGroup once this feed has scrolled there.
  pendingScrollGroupId: string | null;
  onScrolledToGroup: () => void;
};

export function WallFeed({
  items,
  dayKeys,
  tagsById,
  wallColumns,
  onPressEntry,
  pendingScrollGroupId,
  onScrolledToGroup,
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

  // A Days-view cell tap always mounts this feed fresh, so the jump is
  // handled by FlashList's initial layout rather than an imperative scroll:
  // a scrollToIndex fired on mount lands before FlashList has measured
  // anything, and it never renders the rows at the new offset — the screen
  // stays blank until the user scrolls. Read once, at mount, so clearing
  // pendingScrollGroupId below doesn't change what FlashList got.
  const [initialScrollIndex] = useState(() => {
    if (!pendingScrollGroupId) return undefined;
    const index = firstItemIndexForGroup(items, pendingScrollGroupId);
    return index >= 0 ? index : undefined;
  });

  useEffect(() => {
    if (pendingScrollGroupId) onScrolledToGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        initialScrollIndex={initialScrollIndex}
        style={styles.list}
        data={items}
        // The custom Scrubber is the Wall's scroll indicator; the native
        // one would just double up on the same edge.
        showsVerticalScrollIndicator={false}
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
      <Scrubber
        dayKeys={dayKeys}
        activeDayKey={activeDayKey}
        onSelectDay={scrollToDay}
      />
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
