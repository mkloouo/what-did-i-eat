import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
};

export function IconButton({ name, onPress, color = theme.colors.textOnDark, size = 24 }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.hitArea}>
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    padding: theme.spacing.sm,
  },
});
