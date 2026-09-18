import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ImageViewing from "react-native-image-viewing";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector } from "../store/hooks";
import { resolvePhotoUri } from "../storage/photoStorage";
import { formatFullDateTime } from "../utils/dateFormat";
import { Button } from "../components/photoLayouts/Button";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "PhotoDetails">;
type Route = RouteProp<RootStackParamList, "PhotoDetails">;

type PhotoDetailsHeaderProps = {
  navigation: Nav;
};

// Rendered by ImageViewing's HeaderComponent. Kept as its own component so
// the value passed as HeaderComponent can have a stable identity across
// parent re-renders.
function PhotoDetailsHeader({ navigation }: PhotoDetailsHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.topBar, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.topBarButton}
      >
        <Text style={styles.topBarButtonText}>Close</Text>
      </Pressable>
    </View>
  );
}

type PhotoDetailsFooterProps = {
  entryId: string;
  imageIndex: number;
};

// Rendered by ImageViewing's FooterComponent. Keyed only by entryId, so it
// has a stable identity across parent re-renders.
function PhotoDetailsFooter({ entryId, imageIndex }: PhotoDetailsFooterProps) {
  const entry = useAppSelector((state) => state.entries[entryId]);
  const insets = useSafeAreaInsets();

  if (!entry) {
    return null;
  }

  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: insets.bottom + theme.spacing.md },
      ]}
    >
      {entry.photos.length > 1 ? (
        <View style={styles.dots}>
          {entry.photos.map((photo, index) => (
            <View
              key={photo.id}
              style={[styles.dot, index === imageIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
      <Text style={styles.footerMeta}>
        {formatFullDateTime(entry.createdAt)}
      </Text>
      {entry.location?.placeName ? (
        <Text style={styles.footerMeta}>{entry.location.placeName}</Text>
      ) : null}
    </View>
  );
}

export function PhotoDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryId, photoIndex } = route.params;

  const entry = useAppSelector((state) => state.entries[entryId]);
  const insets = useSafeAreaInsets();

  const HeaderComponent = useCallback(
    () => <PhotoDetailsHeader navigation={navigation} />,
    [navigation],
  );
  const FooterComponent = useCallback(
    ({ imageIndex }: { imageIndex: number }) => (
      <PhotoDetailsFooter entryId={entryId} imageIndex={imageIndex} />
    ),
    [entryId],
  );

  if (!entry) {
    return (
      <View
        style={[
          styles.missing,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Text style={styles.missingText}>This entry no longer exists.</Text>
        <Button label="Back" onPress={() => navigation.navigate("Tabs")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageViewing
        images={entry.photos.map((photo) => ({
          uri: resolvePhotoUri(photo.uri),
        }))}
        imageIndex={photoIndex}
        visible
        onRequestClose={() => navigation.goBack()}
        HeaderComponent={HeaderComponent}
        FooterComponent={FooterComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
  },
  topBarButton: {
    padding: theme.spacing.sm,
  },
  topBarButtonText: {
    color: theme.colors.textOnDark,
    ...theme.typography.subtitle,
  },
  footer: {
    backgroundColor: theme.colors.accentDark,
    padding: theme.spacing.md,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.muted,
  },
  dotActive: {
    backgroundColor: theme.colors.textOnDark,
  },
  footerMeta: {
    ...theme.typography.caption,
    color: theme.colors.textOnDark,
  },
  missing: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  missingText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
