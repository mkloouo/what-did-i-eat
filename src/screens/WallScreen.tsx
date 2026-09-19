import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { selectFeedSections } from "../store/selectors/groupSelectors";
import { setTimelineView } from "../store/appMetaSlice";
import { buildWallItems } from "../utils/wallItems";
import { WallFeed } from "../components/wall/WallFeed";
import { TagFilterRail } from "../components/wall/TagFilterRail";
import { DaysBoard } from "../components/days/DaysBoard";
import { SegmentedControl } from "../components/SegmentedControl";
import { TimelineView } from "../types/models";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

export function WallScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [pendingScrollDayKey, setPendingScrollDayKey] = useState<
    string | null
  >(null);

  const sections = useAppSelector((state) =>
    selectFeedSections(state, activeTagId),
  );
  const tagsById = useAppSelector((state) => state.tags);
  const wallColumns = useAppSelector((state) => state.settings.wallColumns);
  // redux-persist replaces the whole appMeta object on load, so an existing
  // install without this key would read undefined — never trust it raw.
  const scrubberEnabled = useAppSelector(
    (state) => state.appMeta.scrubberEnabled ?? true,
  );
  const timelineView = useAppSelector(
    (state) => state.appMeta.timelineView ?? "wall",
  );

  const items = useMemo(() => buildWallItems(sections), [sections]);
  const dayKeys = useMemo(
    () => sections.map((section) => section.dayKey),
    [sections],
  );

  function goToWallDay(dayKey: string) {
    setPendingScrollDayKey(dayKey);
    dispatch(setTimelineView("wall"));
  }

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}
      >
        <Text style={styles.title} numberOfLines={1}>
          What did I eat
        </Text>
        <View style={styles.headerControls}>
          <View style={styles.toggleWrap}>
            <SegmentedControl
              value={timelineView}
              options={[
                { value: "wall", label: "Wall" },
                { value: "days", label: "Days" },
              ]}
              onChange={(value) =>
                dispatch(setTimelineView(value as TimelineView))
              }
            />
          </View>
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
      </View>

      <TagFilterRail activeTagId={activeTagId} onSelect={setActiveTagId} />

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Nothing {timelineView === "wall" ? "on the wall" : "here"} yet
          </Text>
          <Text style={styles.emptyBody}>
            Photograph the next thing you eat.
          </Text>
        </View>
      ) : timelineView === "wall" ? (
        <WallFeed
          items={items}
          dayKeys={dayKeys}
          tagsById={tagsById}
          wallColumns={wallColumns}
          scrubberEnabled={scrubberEnabled}
          onPressEntry={(entryId) =>
            navigation.navigate("EntryDetails", { entryId })
          }
          pendingScrollDayKey={pendingScrollDayKey}
          onScrolledToDay={() => setPendingScrollDayKey(null)}
        />
      ) : (
        <DaysBoard sections={sections} onPressDay={goToWallDay} />
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
    flexShrink: 1,
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  toggleWrap: {
    width: 140,
  },
  settingsButton: {
    padding: theme.spacing.xs,
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
