import React, { useState } from 'react';
import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setBundleByDay, setPhotoLayoutAlgorithm } from '../store/settingsSlice';
import { PhotoLayoutAlgorithm } from '../types/models';
import { theme } from '../theme/theme';
import { Card } from './Card';
import { IconButton } from './IconButton';

export function GroupingMenu() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const bundleByDay = useAppSelector((state) => state.settings.bundleByDay);
  const photoLayoutAlgorithm = useAppSelector((state) => state.settings.photoLayoutAlgorithm);
  const dispatch = useAppDispatch();

  function selectBundleByDay(value: boolean) {
    dispatch(setBundleByDay(value));
    setOpen(false);
  }

  function selectPhotoLayout(value: PhotoLayoutAlgorithm) {
    dispatch(setPhotoLayoutAlgorithm(value));
    setOpen(false);
  }

  return (
    <>
      <IconButton name="ellipsis-horizontal" onPress={() => setOpen(true)} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Card style={[styles.popover, { top: insets.top + 48 }]}>
            <Text style={styles.label}>Group by</Text>
            <SegmentedControl
              value={bundleByDay}
              options={[
                { value: false, label: 'Hour' },
                { value: true, label: 'Day' },
              ]}
              onChange={selectBundleByDay}
            />
            <Text style={[styles.label, styles.secondLabel]}>Photo layout</Text>
            <SegmentedControl
              value={photoLayoutAlgorithm}
              options={[
                { value: 'masonry', label: 'Columns' },
                { value: 'treemap', label: 'Mosaic' },
              ]}
              onChange={selectPhotoLayout}
            />
          </Card>
        </Pressable>
      </Modal>
    </>
  );
}

function SegmentedControl<T>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <Pressable
          key={option.label}
          onPress={() => onChange(option.value)}
          style={[styles.segment, value === option.value && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, value === option.value && styles.segmentTextActive]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  popover: {
    position: 'absolute',
    right: theme.spacing.md,
    width: 240,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  secondLabel: {
    marginTop: theme.spacing.md,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: theme.radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.muted,
  },
  segment: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  segmentTextActive: {
    color: theme.colors.textOnDark,
    fontWeight: '700',
  },
});
