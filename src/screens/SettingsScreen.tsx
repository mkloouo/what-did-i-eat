import {
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  StyleSheet,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  setWallColumns,
  setInferDateFromFirstImportedPhoto,
  setCaptureLocation,
} from "../store/settingsSlice";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Settings">;

export function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const wallColumns = useAppSelector((state) => state.settings.wallColumns);
  const inferDateFromFirstImportedPhoto = useAppSelector(
    (state) => state.settings.inferDateFromFirstImportedPhoto,
  );
  const captureLocation = useAppSelector(
    (state) => state.settings.captureLocation,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>
        {t("settings.photosPerRow", { count: wallColumns })}
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
          <Text style={styles.label}>{t("settings.useOwnDateLabel")}</Text>
          <Text style={styles.toggleHint}>{t("settings.useOwnDateHint")}</Text>
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
          <Text style={styles.label}>{t("settings.saveLocationLabel")}</Text>
          <Text style={styles.toggleHint}>{t("settings.saveLocationHint")}</Text>
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
        accessibilityLabel={t("settings.editTagsAccessibilityLabel")}
      >
        <Text style={styles.navLabel}>{t("settings.editTags")}</Text>
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
