import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Entry } from "../../types/models";
import { resolvePhotoUri } from "../../storage/photoStorage";
import { formatTime } from "../../utils/dateFormat";
import { theme } from "../../theme/theme";

type Props = {
  entry: Entry;
  onPress: () => void;
};

// Your single most recent meal, full width above the day bands — the one
// piece of the Wall's own language the Days view keeps, since it otherwise
// has no hero photo of its own.
export function DaysHero({ entry, onPress }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Image
        source={{ uri: resolvePhotoUri(entry.photos[0].uri) }}
        style={styles.photo}
        contentFit="cover"
      />
      <View style={styles.meta}>
        <Text style={styles.time}>{formatTime(entry.createdAt)}</Text>
        <Text style={styles.comment} numberOfLines={2}>
          {entry.comment || "No comment"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: theme.colors.surface,
  },
  meta: {
    gap: 2,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  time: {
    ...theme.typography.time,
    color: theme.colors.ink,
  },
  comment: {
    ...theme.typography.voice,
    color: theme.colors.ink,
  },
});
