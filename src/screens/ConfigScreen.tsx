import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setBundleByDay } from '../store/settingsSlice';
import { theme } from '../theme/theme';

export function ConfigScreen() {
  const bundleByDay = useAppSelector((state) => state.settings.bundleByDay);
  const dispatch = useAppDispatch();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.label}>Bundle by day</Text>
          <Text style={styles.description}>
            Group every photo from the same day together, instead of the default 1-hour grouping.
          </Text>
        </View>
        <Switch
          value={bundleByDay}
          onValueChange={(value) => {
            dispatch(setBundleByDay(value));
          }}
          trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
          thumbColor={theme.colors.surface}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
  },
  textBlock: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  label: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
  },
  description: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
  },
});
