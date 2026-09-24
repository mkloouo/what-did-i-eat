import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { SlotCell, cellPhotos } from "./dayGrid";
import { densityColumns, sampleSpread } from "./mosaicSample";
import { squareGridLayout } from "../photoLayouts/squareGridLayout";
import { tileInsets } from "../photoLayouts/tileInsets";
import { theme } from "../../theme/theme";

const MAX_TILES = 16;
const SEAM = 2;

type Props = {
  cell: SlotCell;
  size: number;
  onPress: () => void;
};

// One slot's mosaic: density shown purely as texture — how finely the
// fixed-size cell subdivides — never a count, a badge, or a color that
// judges a time. `size` is always the same square; a busy meal never grows
// the cell, it only makes the grid inside it finer (up to 4x4, capped at 16
// photos via a spread sample rather than "first 16").
export function DayGridCell({ cell, size, onPress }: Props) {
  const columns = densityColumns(cell.photoCount);
  const hasMeal = cell.meals.length > 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={!hasMeal}
      accessibilityRole="button"
      accessibilityLabel={
        hasMeal ? "Open this meal on the Wall" : "No meal in this slot"
      }
      style={[styles.cell, { width: size, height: size }]}
    >
      {columns > 0 ? (
        <MosaicTiles
          photos={sampleSpread(cellPhotos(cell), MAX_TILES)}
          columns={columns}
          size={size}
        />
      ) : null}
      {cell.hasSpillover ? <View style={styles.spillDot} /> : null}
    </Pressable>
  );
}

function MosaicTiles({
  photos,
  columns,
  size,
}: {
  photos: string[];
  columns: number;
  size: number;
}) {
  // squareGridLayout is fed a fixed `columns` and a photo count that never
  // exceeds columns*columns (sampleSpread already capped it), so its rects
  // never spill past `columns` rows — safe to treat the grid as a fixed
  // columns x columns square rather than squareGridLayout's own
  // (variable-height) unitHeight.
  const layout = squareGridLayout([photos], columns);
  const tileSize = size / columns;

  return (
    <>
      {photos.map((uri, index) => {
        const rect = layout.rects[index];
        const insets = tileInsets(rect, columns, columns, SEAM);
        return (
          <View
            key={uri + index}
            style={[
              styles.tile,
              {
                left: (rect.x / columns) * size,
                top: (rect.y / columns) * size,
                width: tileSize,
                height: tileSize,
                ...insets,
              },
            ]}
          >
            <Image source={{ uri }} style={styles.image} contentFit="cover" />
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  tile: {
    position: "absolute",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  spillDot: {
    position: "absolute",
    right: 3,
    top: "50%",
    marginTop: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.pine,
  },
});
