import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

export function TagsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tags</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
