import {
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  StyleSheet,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  setGroupingMode,
  setRollingWindowMinutes,
  setWallColumns,
  setInferDateFromFirstImportedPhoto,
  setCaptureLocation,
} from "../store/settingsSlice";
import { SegmentedControl } from "../components/SegmentedControl";
import { theme } from "../theme/theme";
import { GroupingMode } from "../types/models";
import { formatDuration } from "../utils/dateFormat";
import { MergeWindowPreview } from "../components/settings/MergeWindowPreview";

type Nav = NativeStackNavigationProp<RootStackParamList, "Settings">;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const groupingMode = useAppSelector((state) => state.settings.groupingMode);
  const rollingWindowMinutes = useAppSelector(
    (state) => state.settings.rollingWindowMinutes,
  );
  const wallColumns = useAppSelector((state) => state.settings.wallColumns);
  const inferDateFromFirstImportedPhoto = useAppSelector(
    (state) => state.settings.inferDateFromFirstImportedPhoto,
  );
  const captureLocation = useAppSelector(
    (state) => state.settings.captureLocation,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>What counts as one meal</Text>
      <SegmentedControl
        value={groupingMode}
        options={[
          { value: "rolling", label: "Photos close in time" },
          { value: "day", label: "A whole day" },
        ]}
        onChange={(value) => dispatch(setGroupingMode(value as GroupingMode))}
      />

      {groupingMode === "rolling" ? (
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>
            Merge photos taken within: {formatDuration(rollingWindowMinutes)}
          </Text>
          <Slider
            minimumValue={30}
            maximumValue={240}
            step={15}
            value={rollingWindowMinutes}
            minimumTrackTintColor={theme.colors.accent}
            maximumTrackTintColor={theme.colors.graphite}
            onValueChange={(value) => dispatch(setRollingWindowMinutes(value))}
          />
          <MergeWindowPreview rollingWindowMinutes={rollingWindowMinutes} />
        </View>
      ) : null}

      <Text style={[styles.label, styles.secondLabel]}>
        Photos per row: {wallColumns}
      </Text>
      <Slider
        minimumValue={3}
        maximumValue={10}
        step={1}
        value={wallColumns}
        minimumTrackTintColor={theme.colors.accent}
        maximumTrackTintColor={theme.colors.graphite}
        onValueChange={(value) => dispatch(setWallColumns(value))}
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextGroup}>
          <Text style={styles.label}>Use the photo's own date</Text>
          <Text style={styles.toggleHint}>
            When importing from the gallery, set the entry's date from the first
            photo you pick — handy for backfilling old meals.
          </Text>
        </View>
        <Switch
          value={inferDateFromFirstImportedPhoto}
          onValueChange={(value) => {
            dispatch(setInferDateFromFirstImportedPhoto(value));
          }}
          trackColor={{ true: theme.colors.accent }}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextGroup}>
          <Text style={styles.label}>Save where you were</Text>
          <Text style={styles.toggleHint}>
            When off, new entries are saved without capturing your current
            location.
          </Text>
        </View>
        <Switch
          value={captureLocation}
          onValueChange={(value) => {
            dispatch(setCaptureLocation(value));
          }}
          trackColor={{ true: theme.colors.accent }}
        />
      </View>

      <Pressable
        style={styles.navRow}
        onPress={() => navigation.navigate("Tags")}
        accessibilityRole="button"
        accessibilityLabel="Edit tags"
      >
        <Text style={styles.navLabel}>Edit tags</Text>
        <Ionicons
          name="chevron-forward-outline"
          size={18}
          color={theme.colors.graphite}
        />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.daylight,
  },
  content: {
    padding: theme.spacing.md,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.graphite,
    marginBottom: theme.spacing.sm,
  },
  secondLabel: {
    marginTop: theme.spacing.lg,
  },
  sliderRow: {
    marginTop: theme.spacing.md,
  },
  sliderLabel: {
    ...theme.typography.body,
    color: theme.colors.ink,
    marginBottom: theme.spacing.xs,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  toggleTextGroup: {
    flex: 1,
  },
  toggleHint: {
    ...theme.typography.caption,
    color: theme.colors.graphite,
    marginTop: theme.spacing.xs,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
  },
  navLabel: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
});
