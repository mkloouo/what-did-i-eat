import React from 'react';
import { FlatList, View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../store/hooks';
import { formatTime } from '../utils/dateFormat';
import { Card } from '../components/Card';
import { PhotoThumbnail } from '../components/PhotoThumbnail';
import { resolvePhotoUri } from '../storage/photoStorage';
import { useScrollTapGuard } from '../hooks/useScrollTapGuard';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GroupDetails'>;
type Route = RouteProp<RootStackParamList, 'GroupDetails'>;

export function GroupDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryIds } = route.params;

  const entries = useAppSelector((state) =>
    entryIds.map((id) => state.entries[id]).filter((entry) => entry !== undefined)
  );
  const { onScrollBeginDrag, onScrollEndDrag, guardedPress } = useScrollTapGuard();

  return (
    <FlatList
      style={styles.list}
      data={entries}
      keyExtractor={(entry) => entry.id}
      contentContainerStyle={styles.content}
      overScrollMode="always"
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            guardedPress(() => navigation.navigate('EntryDetails', { entryId: item.id }))
          }
        >
          <Card style={styles.card}>
            <PhotoThumbnail uri={resolvePhotoUri(item.photos[0].uri)} size={220} badgeCount={item.photos.length} />
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            <Text style={styles.comment}>{item.comment || 'No comment'}</Text>
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  card: {
    alignItems: 'center',
  },
  time: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
