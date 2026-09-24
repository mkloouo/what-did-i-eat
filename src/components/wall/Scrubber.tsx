import { useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from "react-native-gesture-handler";
import { buildScrubberTicks, nearestDayForY } from "./scrubberGeometry";
import { dayLabel } from "../../utils/dateFormat";
import { theme } from "../../theme/theme";

const RAIL_WIDTH = 6;

type Props = {
  dayKeys: string[];
  activeDayKey: string | null;
  onSelectDay: (dayKey: string) => void;
};

export function Scrubber({ dayKeys, activeDayKey, onSelectDay }: Props) {
  const [railHeight, setRailHeight] = useState(0);
  const [dragY, setDragY] = useState<number | null>(null);
  // Tracks the last day actually reported to onSelectDay, so a gesture
  // frame that lands on the same nearest tick as the last one doesn't
  // re-trigger a scroll. With only a few widely-spaced ticks, tiny finger
  // jitter near the midpoint between two of them can flip the nearest
  // pick back and forth — deduping here is what stops each flip from
  // firing its own competing scroll.
  const lastReportedDay = useRef<string | null>(null);

  const ticks = buildScrubberTicks(dayKeys, railHeight);

  function handleGesture(event: PanGestureHandlerGestureEvent) {
    const y = event.nativeEvent.y;
    setDragY(y);
    const day = nearestDayForY(ticks, y);
    if (day && day !== lastReportedDay.current) {
      lastReportedDay.current = day;
      onSelectDay(day);
    }
  }

  function handleStateChange(event: PanGestureHandlerGestureEvent) {
    const { state } = event.nativeEvent;
    if (
      state === State.END ||
      state === State.CANCELLED ||
      state === State.FAILED
    ) {
      setDragY(null);
    }
  }

  const draggedDayKey = dragY !== null ? nearestDayForY(ticks, dragY) : null;

  return (
    <PanGestureHandler
      onGestureEvent={handleGesture}
      onHandlerStateChange={handleStateChange}
      // The visual rail is a deliberately thin 6px — nowhere near a usable
      // touch target on its own. hitSlop widens what actually catches the
      // gesture without changing how anything looks; nativeEvent.y stays
      // relative to the rail View itself, unaffected by this.
      hitSlop={{ left: 32 }}
    >
      <View
        style={styles.rail}
        onLayout={(event) => setRailHeight(event.nativeEvent.layout.height)}
      >
        {ticks.map((tick) => (
          <View
            key={tick.dayKey}
            style={[
              styles.tick,
              { top: tick.y },
              tick.dayKey === activeDayKey && styles.tickActive,
            ]}
          />
        ))}
        {draggedDayKey && dragY !== null ? (
          <View style={[styles.labelBubble, { top: dragY }]}>
            <Text style={styles.labelText}>{dayLabel(draggedDayKey)}</Text>
          </View>
        ) : null}
      </View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: RAIL_WIDTH,
    alignSelf: "stretch",
    position: "relative",
  },
  tick: {
    position: "absolute",
    left: 0,
    width: RAIL_WIDTH,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.hairline,
  },
  tickActive: {
    height: 12,
    borderRadius: 1.5,
    backgroundColor: theme.colors.pine,
  },
  labelBubble: {
    position: "absolute",
    right: RAIL_WIDTH + theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    transform: [{ translateY: -12 }],
  },
  labelText: {
    ...theme.typography.caption,
    color: theme.colors.ink,
  },
});
