import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setGroupingMode, setRollingWindowMinutes, setPhotoLayoutAlgorithm } from '../store/settingsSlice';
import { SegmentedControl } from '../components/SegmentedControl';
import { theme } from '../theme/theme';
import { GroupingMode, PhotoLayoutAlgorithm } from '../types/models';

export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const groupingMode = useAppSelector((state) => state.settings.groupingMode);
  const rollingWindowMinutes = useAppSelector((state) => state.settings.rollingWindowMinutes);
  const photoLayoutAlgorithm = useAppSelector((state) => state.settings.photoLayoutAlgorithm);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Grouping</Text>
      <SegmentedControl
        value={groupingMode}
        options={[
          { value: 'rolling', label: 'Rolling window' },
          { value: 'day', label: 'Single day' },
        ]}
        onChange={(value) => dispatch(setGroupingMode(value as GroupingMode))}
      />

      {groupingMode === 'rolling' ? (
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Window: {rollingWindowMinutes} min</Text>
          <Slider
            minimumValue={30}
            maximumValue={240}
            step={15}
            value={rollingWindowMinutes}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.muted}
            onSlidingComplete={(value) => dispatch(setRollingWindowMinutes(value))}
          />
        </View>
      ) : null}

      <Text style={[styles.label, styles.secondLabel]}>Photo layout</Text>
      <SegmentedControl
        value={photoLayoutAlgorithm}
        options={[
          { value: 'masonry', label: 'Columns' },
          { value: 'treemap', label: 'Mosaic' },
        ]}
        onChange={(value) => dispatch(setPhotoLayoutAlgorithm(value as PhotoLayoutAlgorithm))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  secondLabel: {
    marginTop: theme.spacing.lg,
  },
  sliderRow: {
    marginTop: theme.spacing.md,
  },
  sliderLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
});
