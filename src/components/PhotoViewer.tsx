import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Gallery,
  type VerticalPullOptions,
} from "react-native-zoom-toolkit";
import { theme } from "../theme/theme";

type Photo = { uri: string };

type Props = {
  photos: Photo[];
  initialIndex: number;
  onRequestClose: () => void;
  onIndexChange?: (index: number) => void;
  renderHeader?: (index: number) => React.ReactNode;
  renderFooter?: (index: number) => React.ReactNode;
};

// A swipe-down-to-dismiss distance past which releasing actually closes the
// viewer, rather than snapping back — matches the flick most people use.
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

// Pinch-zoom, swipe between photos, and swipe-down-to-dismiss, built on
// react-native-zoom-toolkit's Gallery — replacing react-native-image-viewing,
// whose pinch gesture could stick a few millimetres into a pinch and
// sometimes never release. Header/footer are plain overlays rendered outside
// the Gallery's own gesture area, so they can hold ordinary interactive
// controls (a TextInput, buttons) without fighting its gestures for touches.
export function PhotoViewer({
  photos,
  initialIndex,
  onRequestClose,
  onIndexChange,
  renderHeader,
  renderFooter,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const dismissProgress = useSharedValue(0);

  // Gallery centers each item with alignItems: "center" rather than
  // stretching it, so a percentage-sized <Image> has no definite width to
  // resolve against and measures 0 (confirmed via logging on Android).
  // Sizing the image from the viewer's own measured layout instead sidesteps
  // that ambiguity.
  const renderItem = useCallback(
    (photo: Photo) => (
      <Image
        source={{ uri: photo.uri }}
        style={[styles.image, containerSize]}
        contentFit="contain"
      />
    ),
    [containerSize],
  );

  const keyExtractor = useCallback(
    (photo: Photo, i: number) => `${photo.uri}-${i}`,
    [],
  );

  function handleIndexChange(nextIndex: number) {
    setIndex(nextIndex);
    onIndexChange?.(nextIndex);
  }

  function handleVerticalPull(options: VerticalPullOptions) {
    "worklet";
    const { translateY, released, velocityY } = options;
    dismissProgress.value = Math.min(Math.abs(translateY) / 200, 1);
    if (!released) return;
    if (
      Math.abs(translateY) > DISMISS_DISTANCE ||
      Math.abs(velocityY) > DISMISS_VELOCITY
    ) {
      runOnJS(onRequestClose)();
    } else {
      dismissProgress.value = withTiming(0);
    }
  }

  const chromeStyle = useAnimatedStyle(() => ({
    opacity: 1 - dismissProgress.value,
  }));

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
      }}
    >
      <Gallery
        data={photos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialIndex={initialIndex}
        onIndexChange={handleIndexChange}
        onVerticalPull={handleVerticalPull}
      />
      {renderHeader ? (
        <Animated.View
          style={[styles.overlayTop, chromeStyle]}
          pointerEvents="box-none"
        >
          {renderHeader(index)}
        </Animated.View>
      ) : null}
      {renderFooter ? (
        <Animated.View
          style={[styles.overlayBottom, chromeStyle]}
          pointerEvents="box-none"
        >
          {renderFooter(index)}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.ink,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
