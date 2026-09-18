import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

type Props = {
  label: string;
  railColumnWidth: number;
};

// The pill centers over the timeline's rail column, so it lands exactly on
// the continuous dashed line drawn behind the whole feed. Stays in normal
// flow (so it still contributes its own height), shifted into position via
// marginLeft + a translateX(-50%) transform — the pill's own width is
// content-dependent (unknown upfront), and a transform-shift sidesteps
// flexbox forcing a fixed-width column's width onto it.
export function DayDivider({ label, railColumnWidth }: Props) {
  return (
    <View style={styles.container}>
      <View style={{ marginLeft: theme.spacing.md + railColumnWidth / 2 }}>
        <View style={[styles.pill, styles.pillShift]}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.card,
  },
  pillShift: {
    transform: [{ translateX: '-50%' }],
  },
  label: {
    ...theme.typography.subtitle,
    color: theme.colors.muted,
  },
});
