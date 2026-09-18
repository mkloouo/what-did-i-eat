import React, { useState } from "react";
import { SectionList, View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { RootStackParamList, TabParamList } from "../navigation/types";
import { useAppSelector } from "../store/hooks";
import {
  selectFeedSections,
  EntryGroup,
} from "../store/selectors/groupSelectors";
import { dayLabel, formatTime } from "../utils/dateFormat";
import { Card } from "../components/Card";
import { CountBadge } from "../components/CountBadge";
import { PhotoStack } from "../components/PhotoStack";
import { Fab } from "../components/Fab";
import { DayDivider } from "../components/DayDivider";
import { useScrollTapGuard } from "../hooks/useScrollTapGuard";
import { PhotoLayoutAlgorithm } from "../types/models";
import { theme } from "../theme/theme";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Feed">,
  NativeStackNavigationProp<RootStackParamList>
>;

type FeedCardProps = {
  item: EntryGroup;
  photoLayoutAlgorithm: PhotoLayoutAlgorithm;
  onPress: () => void;
};

// The timeline rail's dashed line needs to span exactly as tall as the
// photo stack beside it. Flexbox's alignItems:'stretch' doesn't reliably
// resolve that against a sibling sized by PhotoStack's aspectRatio (the
// dash was observed stopping partway down), so the photo stack's height is
// measured directly and applied to the rail explicitly instead.
function FeedCard({ item, photoLayoutAlgorithm, onPress }: FeedCardProps) {
  const [photoStackHeight, setPhotoStackHeight] = useState<number | null>(null);
  const timeFrom = formatTime(item.timeFrom);
  const timeTo = formatTime(item.timeTo);
  const isRange = timeFrom !== timeTo;

  return (
    <Pressable onPress={onPress} style={styles.itemWrapper}>
      <Card style={[styles.card]}>
        <View style={[styles.cardRow, styles.horizontalMdSpacer]}>
          {item.entries.length > 1 ? (
            <CountBadge label={String(item.entries.length)} />
          ) : null}
          <Text style={styles.cardComment} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        <View style={styles.bodyRow}>
          <View
            style={[
              styles.timelineRail,
              photoStackHeight !== null ? { height: photoStackHeight } : null,
            ]}
          >
            <Text style={styles.timeLabel}>{timeTo}</Text>
            {isRange ? (
              <>
                <View style={styles.timelineDash} />
                <Text style={styles.timeLabel}>{timeFrom}</Text>
              </>
            ) : null}
          </View>
          <View
            style={styles.photoStackWrapper}
            onLayout={(event) => setPhotoStackHeight(event.nativeEvent.layout.height)}
          >
            <PhotoStack
              photosByEntry={item.photosByEntry}
              algorithm={photoLayoutAlgorithm}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const sections = useAppSelector(selectFeedSections);
  const photoLayoutAlgorithm = useAppSelector((state) => state.settings.photoLayoutAlgorithm);
  const { onScrollBeginDrag, onScrollEndDrag, guardedPress } = useScrollTapGuard();

  function openGroup(group: EntryGroup) {
    if (group.entries.length === 1) {
      navigation.navigate("EntryDetails", {
        entryId: group.entries[0].id,
      });
    } else {
      navigation.navigate("GroupDetails", {
        entryIds: group.entries.map((e) => e.id),
      });
    }
  }

  return (
    <View style={styles.container}>
      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Nothing logged yet</Text>
          <Text style={styles.emptyBody}>
            Tap the + to log your first photo.
          </Text>
        </View>
      ) : (
        <SectionList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          overScrollMode="always"
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          sections={sections.map((section) => ({
            title: dayLabel(section.dayKey),
            data: section.groups,
            key: section.dayKey,
          }))}
          keyExtractor={(group) => group.id}
          renderSectionHeader={({ section }) => (
            <DayDivider label={section.title} />
          )}
          renderItem={({ item }) => (
            <FeedCard
              item={item}
              photoLayoutAlgorithm={photoLayoutAlgorithm}
              onPress={() => guardedPress(() => openGroup(item))}
            />
          )}
        />
      )}
      <Fab onPress={() => navigation.navigate("NewEntry")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 56 + theme.spacing.lg + theme.spacing.md,
  },
  itemWrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  card: {},
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: theme.spacing.md,
  },
  timelineRail: {
    width: 40,
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  timelineDash: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.muted,
    borderStyle: "dashed",
    marginVertical: theme.spacing.xs,
  },
  timeLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  photoStackWrapper: {
    flex: 1,
  },
  horizontalMdSpacer: {
    columnGap: theme.spacing.md,
  },
  cardComment: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    flex: 1,
    flexShrink: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.title,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyBody: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
  },
});
