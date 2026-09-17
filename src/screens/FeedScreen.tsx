import React from "react";
import { SectionList, View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector } from "../store/hooks";
import {
  selectFeedSections,
  EntryGroup,
} from "../store/selectors/groupSelectors";
import { dayLabel, formatTime } from "../utils/dateFormat";
import { Card } from "../components/Card";
import { PhotoStack } from "../components/PhotoStack";
import { Fab } from "../components/Fab";
import { DayDivider } from "../components/DayDivider";
import { useScrollTapGuard } from "../hooks/useScrollTapGuard";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Feed">;

export function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const sections = useAppSelector(selectFeedSections);
  const photoLayoutAlgorithm = useAppSelector((state) => state.settings.photoLayoutAlgorithm);
  const { onScrollBeginDrag, onScrollEndDrag, guardedPress } = useScrollTapGuard();

  function openGroup(group: EntryGroup) {
    if (group.entries.length === 1) {
      navigation.navigate("PhotoDetails", {
        entryId: group.entries[0].id,
        photoIndex: 0,
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
          renderItem={({ item }) => {
            const timeFrom = formatTime(item.timeFrom);
            const timeTo = formatTime(item.timeTo);
            const isRange = timeFrom !== timeTo;

            return (
              <Pressable
                onPress={() => guardedPress(() => openGroup(item))}
                style={styles.itemWrapper}
              >
                <Card style={[styles.card]}>
                  <View style={[styles.cardRow, styles.horizontalMdSpacer]}>
                    {item.entries.length > 1 ? (
                      <View style={styles.entryBadge}>
                        <Text style={styles.entryBadgeText}>
                          {item.entries.length}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={styles.cardComment} numberOfLines={2}>
                      {item.entries[0].comment || "No comment"}
                    </Text>
                  </View>
                  <View style={styles.bodyRow}>
                    <View style={styles.timelineRail}>
                      <Text style={styles.timeLabel}>{timeFrom}</Text>
                      {isRange ? (
                        <>
                          <View style={styles.timelineDash} />
                          <Text style={styles.timeLabel}>{timeTo}</Text>
                        </>
                      ) : null}
                    </View>
                    <View style={styles.photoStackWrapper}>
                      <PhotoStack
                        photosByEntry={item.photosByEntry}
                        algorithm={photoLayoutAlgorithm}
                      />
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }}
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
  entryBadge: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.xs + 2,
    paddingVertical: 2,
  },
  entryBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: "700",
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
