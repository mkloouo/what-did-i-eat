import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

type Props = {
  label: string;
  railColumnWidth: number;
};

// The pill centers over the timeline's rail column, so it lands exactly on
// the continuous dashed line drawn behind the whole feed.
export function DayDivider({ label, railColumnWidth }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.railColumn, { width: railColumnWidth }]}>
        <View style={styles.pill}>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  railColumn: {
    alignItems: 'center',
  },
  pill: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.card,
  },
  label: {
    ...theme.typography.subtitle,
    color: theme.colors.muted,
  },
});
