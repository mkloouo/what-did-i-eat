import React, { useState } from 'react';
import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setBundleByDay } from '../store/settingsSlice';
import { theme } from '../theme/theme';
import { Card } from './Card';
import { IconButton } from './IconButton';

export function GroupingMenu() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const bundleByDay = useAppSelector((state) => state.settings.bundleByDay);
  const dispatch = useAppDispatch();

  function select(value: boolean) {
    dispatch(setBundleByDay(value));
    setOpen(false);
  }

  return (
    <>
      <IconButton name="ellipsis-horizontal" onPress={() => setOpen(true)} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Card style={[styles.popover, { top: insets.top + 48 }]}>
            <Text style={styles.label}>Group by</Text>
            <View style={styles.segmented}>
              <Pressable
                onPress={() => select(false)}
                style={[styles.segment, !bundleByDay && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, !bundleByDay && styles.segmentTextActive]}>Hour</Text>
              </Pressable>
              <Pressable
                onPress={() => select(true)}
                style={[styles.segment, bundleByDay && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, bundleByDay && styles.segmentTextActive]}>Day</Text>
              </Pressable>
            </View>
          </Card>
        </Pressable>
      </Modal>
    </>
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
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: theme.radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.muted,
  },
  segment: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
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
