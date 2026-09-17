import React from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { theme } from '../theme/theme';

export function photoStackLayout(count: number) {
  const primaryCount = Math.min(count, 2);
  const thumbnailCount = Math.max(0, count - primaryCount);
  return { primaryCount, thumbnailCount };
}

type Props = {
  photos: string[];
};

export function PhotoStack({ photos }: Props) {
  if (photos.length === 0) {
    return null;
  }

  const { primaryCount, thumbnailCount } = photoStackLayout(photos.length);
  const [firstPhoto, secondPhoto] = photos;
  const thumbnailPhotos = photos.slice(primaryCount);

  return (
    <View style={styles.stack}>
      <PhotoTile uri={firstPhoto} style={styles.fullTile} />
      {primaryCount > 1 ? (
        <View style={styles.secondRow}>
          <PhotoTile
            uri={secondPhoto}
            style={
              thumbnailCount > 0 ? styles.secondTileWithThumbnails : styles.fullTile
            }
          />
          {thumbnailCount > 0 ? (
            <View style={styles.thumbnailColumn}>
              {thumbnailPhotos.map((uri, index) => (
                <PhotoTile
                  key={uri + index}
                  uri={uri}
                  style={[
                    styles.thumbnailTile,
                    index > 0 && styles.thumbnailSpacing,
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function PhotoTile({ uri, style }: { uri: string; style: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.tile, style]}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
  },
  secondRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.xs,
    columnGap: theme.spacing.xs,
  },
  tile: {
    aspectRatio: 1,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.muted,
  },
  fullTile: {
    width: '100%',
  },
  secondTileWithThumbnails: {
    flex: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  thumbnailColumn: {
    flex: 1,
  },
  thumbnailTile: {
    width: '100%',
    borderRadius: theme.radii.sm,
  },
  thumbnailSpacing: {
    marginTop: theme.spacing.xs,
  },
});
