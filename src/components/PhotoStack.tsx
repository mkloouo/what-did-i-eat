import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { theme } from "../theme/theme";
import { squareGridLayout } from "./photoLayouts/squareGridLayout";
import { tileCornerRadius } from "./photoLayouts/tileCornerRadius";
import { tileInsets } from "./photoLayouts/tileInsets";

const DEFAULT_SEAM = 2;

type Props = {
  photosByEntry: string[][];
  // How many photos wide the grid runs before wrapping to a new row.
  columns: number;
  onPhotoPress?: (index: number) => void;
  // Gap between tiles in px. The collage's outer edge stays flush.
  seam?: number;
  // Rounds the collage's outer corners only; interior corners stay square.
  cornerRadius?: number;
};

export function PhotoStack({
  photosByEntry,
  columns,
  onPhotoPress,
  seam = DEFAULT_SEAM,
  cornerRadius = 0,
}: Props) {
  const photos = photosByEntry.flat();
  if (photos.length === 0) {
    return null;
  }

  const layout = squareGridLayout(photosByEntry, columns);

  return (
    <View
      style={[
        styles.stack,
        { aspectRatio: layout.unitWidth / layout.unitHeight },
      ]}
    >
      {photos.map((uri, index) => {
        const rect = layout.rects[index];
        const Tile = onPhotoPress ? Pressable : View;
        const tileProps = onPhotoPress
          ? { onPress: () => onPhotoPress(index) }
          : {};
        const corners = tileCornerRadius(
          rect,
          layout.unitWidth,
          layout.unitHeight,
          cornerRadius,
          0,
        );
        return (
          <Tile
            key={uri + index}
            {...tileProps}
            style={{
              position: "absolute",
              left: `${(rect.x / layout.unitWidth) * 100}%`,
              top: `${(rect.y / layout.unitHeight) * 100}%`,
              width: `${(rect.width / layout.unitWidth) * 100}%`,
              height: `${(rect.height / layout.unitHeight) * 100}%`,
              ...tileInsets(rect, layout.unitWidth, layout.unitHeight, seam),
            }}
          >
            <Image
              source={{ uri }}
              style={[styles.image, corners]}
              contentFit="cover"
            />
          </Tile>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.surface,
  },
});
