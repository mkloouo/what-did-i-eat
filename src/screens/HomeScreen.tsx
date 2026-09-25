import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { selectFeedSections } from "../store/selectors/feedSelectors";
import { setTimelineView } from "../store/appMetaSlice";
import { buildLineItems } from "../utils/lineItems";
import { LineFeed } from "../components/line/LineFeed";
import { TagFilterRail } from "../components/line/TagFilterRail";
import { DaysBoard } from "../components/days/DaysBoard";
import { SegmentedControl } from "../components/SegmentedControl";
import { TimelineView } from "../types/models";
import { takePhoto } from "../camera/cameraService";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [pendingScrollEntryId, setPendingScrollEntryId] = useState<
    string | null
  >(null);

  const sections = useAppSelector((state) =>
    selectFeedSections(state, activeTagId),
  );
  const tagsById = useAppSelector((state) => state.tags);
  const wallColumns = useAppSelector((state) => state.settings.wallColumns);
  // Anything but "days" is the Line — including "wall", which versions
  // before the Line replaced the Wall persisted here.
  const timelineView: TimelineView = useAppSelector((state) =>
    state.appMeta.timelineView === "days" ? "days" : "line",
  );

  const items = useMemo(() => buildLineItems(sections), [sections]);
  const dayKeys = useMemo(
    () => sections.map((section) => section.dayKey),
    [sections],
  );

  function goToLineEntry(entryId: string) {
    setPendingScrollEntryId(entryId);
    dispatch(setTimelineView("line"));
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
                { value: "line", label: "Line" },
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
              color={theme.colors.graphite}
            />
          </Pressable>
        </View>
      </View>

      <TagFilterRail activeTagId={activeTagId} onSelect={setActiveTagId} />

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyBody}>
            Photograph the next thing you eat.
          </Text>
        </View>
      ) : timelineView === "line" ? (
        <LineFeed
          items={items}
          dayKeys={dayKeys}
          tagsById={tagsById}
          wallColumns={wallColumns}
          onPressEntry={(entryId) =>
            navigation.navigate("EntryDetails", { entryId })
          }
          pendingScrollEntryId={pendingScrollEntryId}
          onScrolledToEntry={() => setPendingScrollEntryId(null)}
        />
      ) : (
        <DaysBoard sections={sections} onPressCell={goToLineEntry} />
      )}

      <View
        style={[
          styles.captureRow,
          { marginBottom: insets.bottom + theme.spacing.md },
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate("NewEntry")}
          style={styles.captureButton}
        >
          <Ionicons
            name="image-outline"
            size={17}
            color={theme.colors.daylight}
          />
          <Text style={styles.captureLabel}>Add a new one</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            takePhoto((uris) =>
              navigation.navigate("NewEntry", { initialPhotoUris: uris }),
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Take a photo now"
          style={styles.cameraButton}
        >
          <Ionicons name="camera" size={20} color={theme.colors.daylight} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.daylight,
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
    color: theme.colors.ink,
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
    color: theme.colors.ink,
  },
  emptyBody: {
    ...theme.typography.body,
    color: theme.colors.graphite,
    textAlign: "center",
  },
  captureRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  captureButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    height: 48,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary,
  },
  captureLabel: {
    ...theme.typography.subtitle,
    color: theme.colors.daylight,
  },
  cameraButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary,
  },
});
