import React from 'react';
import { FlatList, View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../store/hooks';
import { formatTime } from '../utils/dateFormat';
import { Card } from '../components/Card';
import { PhotoCarousel } from '../components/PhotoCarousel';
import { TagChip } from '../components/TagChip';
import { resolvePhotoUri } from '../storage/photoStorage';
import { useScrollTapGuard } from '../hooks/useScrollTapGuard';
import { Entry, Tag } from '../types/models';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'GroupDetails'>;
type Route = RouteProp<RootStackParamList, 'GroupDetails'>;

type EntryCardProps = {
  entry: Entry;
  tags: Tag[];
  onPress: () => void;
};

function EntryCard({ entry, tags, onPress }: EntryCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <PhotoCarousel photoUris={entry.photos.map((photo) => resolvePhotoUri(photo.uri))} />
        <Text style={styles.time}>{formatTime(entry.createdAt)}</Text>
        {entry.comment ? <Text style={styles.comment}>{entry.comment}</Text> : null}
        {tags.length > 0 ? (
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <TagChip key={tag.id} icon={tag.icon} label={tag.label} />
            ))}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

export function GroupDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryIds } = route.params;

  const entries = useAppSelector((state) =>
    entryIds.map((id) => state.entries[id]).filter((entry) => entry !== undefined)
  );
  const allTags = useAppSelector((state) => state.tags);
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
      renderItem={({ item }) => {
        const tags = (item.tagIds ?? [])
          .map((id) => allTags[id])
          .filter((tag): tag is Tag => Boolean(tag));

        return (
          <EntryCard
            entry={item}
            tags={tags}
            onPress={() =>
              guardedPress(() => navigation.navigate('EntryDetails', { entryId: item.id }))
            }
          />
        );
      }}
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
    padding: theme.spacing.sm,
    ...theme.shadows.card,
  },
  time: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
});
