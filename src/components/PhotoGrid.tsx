import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

const GAP = theme.spacing.xs;

export function computeGridLayout(count: number, size: number) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / columns);
  const cellSize = (size - GAP * (columns - 1)) / columns;
  return { columns, rows, cellSize };
}

type Props = {
  photos: string[];
  size: number;
};

export function PhotoGrid({ photos, size }: Props) {
  if (photos.length === 0) {
    return null;
  }

  if (photos.length === 1) {
    return (
      <Image
        source={{ uri: photos[0] }}
        style={{ width: size, height: size, borderRadius: theme.radii.md }}
        resizeMode="cover"
      />
    );
  }

  const { columns, cellSize } = computeGridLayout(photos.length, size);

  return (
    <View style={[styles.grid, { width: size, height: size }]}>
      {photos.map((uri, index) => (
        <Image
          key={index}
          source={{ uri }}
          style={{
            width: cellSize,
            height: cellSize,
            marginRight: (index + 1) % columns === 0 ? 0 : GAP,
            marginBottom: GAP,
            borderRadius: theme.radii.sm,
          }}
          resizeMode="cover"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    overflow: 'hidden',
  },
});
