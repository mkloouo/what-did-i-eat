import React, { useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

const RAIL_COLUMN_WIDTH = 48;

type FeedCardProps = {
  item: EntryGroup;
  photoLayoutAlgorithm: PhotoLayoutAlgorithm;
  onPress: () => void;
};

// The rail column's own height is measured from the photo stack beside it
// (flexbox stretch doesn't reliably resolve against a sibling sized by
// PhotoStack's aspectRatio), so the top/bottom time labels land exactly at
// the photo stack's top/bottom edges. The continuous dashed line itself is
// drawn once, behind the whole feed — this column only positions labels.
function FeedCard({ item, photoLayoutAlgorithm, onPress }: FeedCardProps) {
  const [titleRowHeight, setTitleRowHeight] = useState<number | null>(null);
  const [photoStackHeight, setPhotoStackHeight] = useState<number | null>(null);
  const timeFrom = formatTime(item.timeFrom);
  const timeTo = formatTime(item.timeTo);
  const isRange = timeFrom !== timeTo;

  // The rail is a sibling of Card, but its labels must align to the photo
  // stack specifically, not to Card's own top (which also has the title
  // row above the photo). Card's own top padding + the measured title
  // row's height + the photo's own top margin gives the photo's true
  // offset from Card's top, without needing measureLayout.
  const railStyle =
    titleRowHeight !== null && photoStackHeight !== null
      ? {
          marginTop: theme.spacing.md + titleRowHeight + theme.spacing.md,
          height: photoStackHeight,
        }
      : null;

  return (
    <Pressable onPress={onPress} style={styles.itemWrapper}>
      <View style={styles.bodyRow}>
        <View style={[styles.timelineRail, railStyle]}>
          <Text style={styles.timeLabel} numberOfLines={1}>
            {timeTo}
          </Text>
          {isRange ? (
            <Text style={styles.timeLabel} numberOfLines={1}>
              {timeFrom}
            </Text>
          ) : null}
        </View>
        <Card style={styles.card}>
          <View
            style={[styles.cardRow, styles.horizontalMdSpacer]}
            onLayout={(event) =>
              setTitleRowHeight(event.nativeEvent.layout.height)
            }
          >
            {item.entries.length > 1 ? (
              <CountBadge label={String(item.entries.length)} />
            ) : null}
            <Text style={styles.cardComment} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <View
            style={styles.photoStackWrapper}
            onLayout={(event) =>
              setPhotoStackHeight(event.nativeEvent.layout.height)
            }
          >
            <PhotoStack
              photosByEntry={item.photosByEntry}
              algorithm={photoLayoutAlgorithm}
            />
          </View>
        </Card>
      </View>
    </Pressable>
  );
}

function NoticeBanner() {
  return (
    <View style={styles.bannerWrapper}>
      <View style={styles.banner}>
        <Ionicons name="heart" size={16} color={theme.colors.primary} />
        <Text style={styles.bannerText}>No rules. Just notice.</Text>
      </View>
    </View>
  );
}

export function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const sections = useAppSelector(selectFeedSections);
  const photoLayoutAlgorithm = useAppSelector(
    (state) => state.settings.photoLayoutAlgorithm,
  );
  const { onScrollBeginDrag, onScrollEndDrag, guardedPress } =
    useScrollTapGuard();

  function openGroup(group: EntryGroup) {
    if (group.entries.length === 1) {
      navigation.navigate("EntryDetails", {
        entryId: group.entries[0].id,
      });
    } else {
      navigation.navigate("GroupDetails", {
        entryIds: group.entries.map((e) => e.id),
        title: group.title,
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
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          overScrollMode="always"
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
        >
          <View style={styles.timeline}>
            <View style={styles.timelineLine} />
            {sections.map((section, sectionIndex) => (
              <View key={section.dayKey}>
                <DayDivider label={dayLabel(section.dayKey)} />
                {section.groups.map((group) => (
                  <FeedCard
                    key={group.id}
                    item={group}
                    photoLayoutAlgorithm={photoLayoutAlgorithm}
                    onPress={() => guardedPress(() => openGroup(group))}
                  />
                ))}
                {sectionIndex === 0 ? <NoticeBanner /> : null}
              </View>
            ))}
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
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
    flexGrow: 1,
  },
  timeline: {
    position: "relative",
    flexGrow: 1,
    paddingTop: theme.spacing.sm,
  },
  bottomSpacer: {
    height: 56 + theme.spacing.lg + theme.spacing.md,
  },
  timelineLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: theme.spacing.md + RAIL_COLUMN_WIDTH / 2,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.muted,
    borderStyle: "dashed",
  },
  itemWrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  card: {
    flex: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineRail: {
    width: RAIL_COLUMN_WIDTH,
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: theme.spacing.sm,
  },
  timeLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xs,
    flexShrink: 0,
  },
  photoStackWrapper: {
    flex: 1,
    marginTop: theme.spacing.md,
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
  bannerWrapper: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  banner: {
    flex: 1,
    marginLeft: RAIL_COLUMN_WIDTH + theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.card,
  },
  bannerText: {
    ...theme.typography.body,
    color: theme.colors.text,
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
