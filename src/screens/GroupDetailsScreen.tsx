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

// The carousel is deliberately NOT inside the Pressable below — a nested
// horizontal ScrollView inside a Pressable can lose the swipe gesture to
// the Pressable's own touch handling. Instead each photo gets its own
// Pressable (via PhotoCarousel's onPress), which coexists with the
// ScrollView's pan responder fine since a tap-without-drag still fires.
function EntryCard({ entry, tags, onPress }: EntryCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.photoColumn}>
          <PhotoCarousel
            photoUris={entry.photos.map((photo) => resolvePhotoUri(photo.uri))}
            onPress={onPress}
          />
        </View>
        <Pressable onPress={onPress} style={styles.infoColumn}>
          <Text style={styles.time}>{formatTime(entry.createdAt)} Record</Text>
          {tags.length > 0 ? (
            <View style={styles.tagRow}>
              {tags.map((tag) => (
                <TagChip key={tag.id} icon={tag.icon} label={tag.label} />
              ))}
            </View>
          ) : null}
        </Pressable>
      </View>
      {entry.comment ? (
        <Pressable onPress={onPress}>
          <Text style={styles.comment}>{entry.comment}</Text>
        </Pressable>
      ) : null}
    </Card>
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
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  photoColumn: {
    width: 120,
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  time: {
    ...theme.typography.subtitle,
    fontWeight: '700',
    color: theme.colors.text,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
});
