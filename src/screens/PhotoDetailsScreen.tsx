import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector } from "../store/hooks";
import { resolvePhotoUri } from "../storage/photoStorage";
import { formatFullDateTime } from "../utils/dateFormat";
import { Button } from "../components/photoLayouts/Button";
import { PaginationDots } from "../components/PaginationDots";
import { PhotoViewer } from "../components/PhotoViewer";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "PhotoDetails">;
type Route = RouteProp<RootStackParamList, "PhotoDetails">;

export function PhotoDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryId, photoIndex } = route.params;

  const entry = useAppSelector((state) => state.entries[entryId]);
  const insets = useSafeAreaInsets();

  if (!entry) {
    return (
      <View
        style={[
          styles.missing,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Text style={styles.missingText}>This entry no longer exists.</Text>
        <Button label="Back" onPress={() => navigation.navigate("Home")} />
      </View>
    );
  }

  return (
    <PhotoViewer
      photos={entry.photos.map((photo) => ({
        uri: resolvePhotoUri(photo.uri),
      }))}
      initialIndex={photoIndex}
      onRequestClose={() => navigation.goBack()}
      renderHeader={() => (
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.topBarButton}
          >
            <Text style={styles.topBarButtonText}>Close</Text>
          </Pressable>
        </View>
      )}
      renderFooter={(imageIndex) => (
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + theme.spacing.md },
          ]}
        >
          {entry.photos.length > 1 ? (
            <View style={styles.dotsWrapper}>
              <PaginationDots
                count={entry.photos.length}
                activeIndex={imageIndex}
              />
            </View>
          ) : null}
          <Text style={styles.footerMeta}>
            {formatFullDateTime(entry.createdAt)}
          </Text>
          {entry.location?.placeName ? (
            <Text style={styles.footerMeta}>{entry.location.placeName}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
  },
  // The viewer overlay always sits on a black backdrop (photo legibility, the
  // universal viewer convention), so it keeps a dark bar / light text pairing
  // regardless of the app's own light theme.
  topBarButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.ink,
  },
  topBarButtonText: {
    color: theme.colors.daylight,
    ...theme.typography.subtitle,
  },
  footer: {
    backgroundColor: theme.colors.ink,
    padding: theme.spacing.md,
  },
  dotsWrapper: {
    marginBottom: theme.spacing.sm,
  },
  footerMeta: {
    ...theme.typography.caption,
    color: theme.colors.daylight,
  },
  missing: {
    flex: 1,
    backgroundColor: theme.colors.daylight,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  missingText: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
});
