import React, { useState } from 'react';
import { View, Image, ScrollView, NativeSyntheticEvent, NativeScrollEvent, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';
import { PaginationDots } from './PaginationDots';

type Props = {
  photoUris: string[];
};

export function PhotoCarousel({ photoUris }: Props) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width === 0) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  }

  return (
    <View
      style={styles.container}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {photoUris.map((uri) => (
            <Image
              key={uri}
              source={{ uri }}
              style={{ width, height: width }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : null}
      <View style={styles.dotsOverlay}>
        <PaginationDots
          count={photoUris.length}
          activeIndex={activeIndex}
          dotColor="rgba(255,255,255,0.5)"
          activeDotColor={theme.colors.textOnDark}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.muted,
  },
  dotsOverlay: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: 0,
    right: 0,
  },
});
