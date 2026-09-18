import React from "react";
import { Image, View, StyleSheet } from "react-native";
import { theme } from "../theme/theme";
import { CountBadge } from "./CountBadge";

type Props = {
  uri: string;
  size?: number;
  badgeCount?: number;
};

export function PhotoThumbnail({ uri, size = 96, badgeCount }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="cover"
      />
      {badgeCount && badgeCount > 1 ? (
        <CountBadge label={`+${badgeCount - 1}`} style={styles.badge} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.muted,
  },
  badge: {
    position: "absolute",
    bottom: theme.spacing.xs,
    right: theme.spacing.xs,
  },
});
