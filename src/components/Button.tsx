import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger';
  style?: ViewStyle;
};

export function Button({ label, onPress, disabled, variant = 'primary', style }: Props) {
  const backgroundColor = disabled
    ? theme.colors.muted
    : variant === 'danger'
    ? theme.colors.danger
    : theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor }, style]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    color: theme.colors.textOnDark,
    ...theme.typography.subtitle,
    textAlign: 'center'
  },
});
