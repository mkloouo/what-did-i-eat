import React from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../theme/theme";

type Props = {
  count: number;
  activeIndex: number;
  dotColor?: string;
  activeDotColor?: string;
};

export function PaginationDots({
  count,
  activeIndex,
  dotColor = theme.colors.muted,
  activeDotColor = theme.colors.textOnDark,
}: Props) {
  if (count <= 1) {
    return null;
  }

  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                index === activeIndex ? activeDotColor : dotColor,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
