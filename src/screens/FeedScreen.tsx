import React from 'react';
import { SectionList, View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector } from '../store/hooks';
import { selectFeedSections, EntryGroup } from '../store/selectors/groupSelectors';
import { dayLabel, formatTime } from '../utils/dateFormat';
import { Card } from '../components/Card';
import { PhotoThumbnail } from '../components/PhotoThumbnail';
import { DayDivider } from '../components/DayDivider';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Feed'>;

export function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const sections = useAppSelector(selectFeedSections);

  function openGroup(group: EntryGroup) {
    if (group.entries.length === 1) {
      navigation.navigate('PhotoDetails', { entryId: group.entries[0].id, photoIndex: 0 });
    } else {
      navigation.navigate('GroupDetails', { entryIds: group.entries.map((e) => e.id) });
    }
  }

  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Nothing logged yet</Text>
        <Text style={styles.emptyBody}>Tap the + above to log your first photo.</Text>
      </View>
    );
  }

  return (
    <SectionList
      style={styles.list}
      sections={sections.map((section) => ({
        title: dayLabel(section.dayKey),
        data: section.groups,
        key: section.dayKey,
      }))}
      keyExtractor={(group) => group.id}
      renderSectionHeader={({ section }) => <DayDivider label={section.title} />}
      renderItem={({ item }) => (
        <Pressable onPress={() => openGroup(item)} style={styles.itemWrapper}>
          <Card style={styles.card}>
            <View style={styles.cardRow}>
              <PhotoThumbnail uri={item.coverPhotoUri} size={72} badgeCount={item.entries.length} />
              <View style={styles.cardText}>
                <Text style={styles.cardTime}>{formatTime(item.groupTime)}</Text>
                <Text style={styles.cardComment} numberOfLines={2}>
                  {item.entries[item.entries.length - 1].comment || 'No comment'}
                </Text>
              </View>
            </View>
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
  itemWrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  card: {},
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  cardTime: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  cardComment: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.title,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyBody: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
  },
});
