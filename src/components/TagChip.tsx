import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagIcon } from '../types/models';
import { theme } from '../theme/theme';

type Props = {
  icon: TagIcon;
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function TagChip({ icon, label, selected = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={selected ? theme.colors.textOnDark : theme.colors.text}
        style={styles.icon}
      />
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  labelSelected: {
    color: theme.colors.textOnDark,
    fontWeight: '700',
  },
});
