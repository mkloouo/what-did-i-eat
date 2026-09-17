import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';
import { PhotoLayoutAlgorithm } from '../types/models';
import { masonryLayout } from './photoLayouts/masonryLayout';
import { squarifiedLayout } from './photoLayouts/squarifiedLayout';

const TILE_INSET = 2;

type Props = {
  photosByEntry: string[][];
  algorithm: PhotoLayoutAlgorithm;
};

export function PhotoStack({ photosByEntry, algorithm }: Props) {
  const photos = photosByEntry.flat();
  if (photos.length === 0) {
    return null;
  }

  const layout = algorithm === 'masonry' ? masonryLayout(photosByEntry) : squarifiedLayout(photosByEntry);

  return (
    <View style={[styles.stack, { aspectRatio: layout.unitWidth / layout.unitHeight }]}>
      {photos.map((uri, index) => {
        const rect = layout.rects[index];
        return (
          <View
            key={uri + index}
            style={{
              position: 'absolute',
              left: `${(rect.x / layout.unitWidth) * 100}%`,
              top: `${(rect.y / layout.unitHeight) * 100}%`,
              width: `${(rect.width / layout.unitWidth) * 100}%`,
              height: `${(rect.height / layout.unitHeight) * 100}%`,
              padding: TILE_INSET,
            }}
          >
            <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.muted,
  },
});
