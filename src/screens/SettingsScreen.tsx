import React from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  setGroupingMode,
  setRollingWindowMinutes,
  setPhotoLayoutAlgorithm,
  setInferDateFromFirstImportedPhoto,
} from '../store/settingsSlice';
import { SegmentedControl } from '../components/SegmentedControl';
import { theme } from '../theme/theme';
import { GroupingMode, PhotoLayoutAlgorithm } from '../types/models';

export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const groupingMode = useAppSelector((state) => state.settings.groupingMode);
  const rollingWindowMinutes = useAppSelector((state) => state.settings.rollingWindowMinutes);
  const photoLayoutAlgorithm = useAppSelector((state) => state.settings.photoLayoutAlgorithm);
  const inferDateFromFirstImportedPhoto = useAppSelector(
    (state) => state.settings.inferDateFromFirstImportedPhoto
  );

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

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextGroup}>
          <Text style={styles.label}>Infer date from imported photo</Text>
          <Text style={styles.toggleHint}>
            When importing from the gallery, set the entry's date from the first photo you pick —
            handy for backfilling old meals.
          </Text>
        </View>
        <Switch
          value={inferDateFromFirstImportedPhoto}
          onValueChange={(value) => {
            dispatch(setInferDateFromFirstImportedPhoto(value));
          }}
          trackColor={{ true: theme.colors.primary }}
        />
      </View>
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  toggleTextGroup: {
    flex: 1,
  },
  toggleHint: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
  },
});
