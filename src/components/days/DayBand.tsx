import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { DaySection } from "../../store/selectors/groupSelectors";
import { buildDayMarks } from "./dayMarks";
import { dayWashGradient } from "./dayWash";
import { dayFraction } from "../../utils/dateFormat";
import { DaySeam } from "../wall/DaySeam";
import { theme } from "../../theme/theme";

const TODAY_MARK_SIZE = 48;
const PAST_MARK_SIZE = 28;
const MARK_GAP = 4;

type Props = {
  section: DaySection;
  label: string;
  isToday: boolean;
  onPress: (dayKey: string) => void;
};

// One day: its name (DaySeam, matching the Wall's own day headers), a
// smooth astronomical wash, and a mark per photo at its true time. Tapping
// anywhere on the band opens the Wall scrolled to this day — there's no
// separate Day sheet, and no hero photo, since the Wall is one tap away.
export function DayBand({ section, label, isToday, onPress }: Props) {
  const marks = buildDayMarks(section);
  const markSize = isToday ? TODAY_MARK_SIZE : PAST_MARK_SIZE;
  const maxStack = marks.reduce((max, mark) => Math.max(max, mark.stack), 0);
  const bandHeight = MARK_GAP + (maxStack + 1) * (markSize + MARK_GAP);
  const wash = dayWashGradient();
  const nowX = isToday ? dayFraction(new Date().toISOString()) : null;

  return (
    <Pressable onPress={() => onPress(section.dayKey)}>
      <DaySeam label={label} />
      <View style={[styles.band, { height: bandHeight }]}>
        <LinearGradient
          colors={wash.colors}
          locations={wash.locations}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {marks.map((mark, index) => (
          <Image
            key={`${mark.uri}-${index}`}
            source={{ uri: mark.uri }}
            style={[
              styles.mark,
              {
                width: markSize,
                height: markSize,
                left: `${mark.x * 100}%`,
                marginLeft: -markSize / 2,
                bottom: MARK_GAP + mark.stack * (markSize + MARK_GAP),
              },
            ]}
            contentFit="cover"
          />
        ))}
        {nowX !== null ? (
          <View style={[styles.now, { left: `${nowX * 100}%` }]} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  band: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    overflow: "hidden",
  },
  mark: {
    position: "absolute",
    backgroundColor: theme.colors.seam,
  },
  now: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: theme.colors.bone,
  },
});
