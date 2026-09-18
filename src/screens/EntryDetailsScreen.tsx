import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateEntryComment, updateEntryTags, deleteEntry } from '../store/entriesSlice';
import { deletePhotoFile, resolvePhotoUri } from '../storage/photoStorage';
import { formatFullDateTime } from '../utils/dateFormat';
import { PhotoStack } from '../components/PhotoStack';
import { TagChip } from '../components/TagChip';
import { IconButton } from '../components/IconButton';
import { Button } from '../components/photoLayouts/Button';
import { Tag } from '../types/models';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EntryDetails'>;
type Route = RouteProp<RootStackParamList, 'EntryDetails'>;

export function EntryDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryId } = route.params;

  const dispatch = useAppDispatch();
  const entry = useAppSelector((state) => state.entries[entryId]);
  const allTags = useAppSelector((state) => state.tags);
  const photoLayoutAlgorithm = useAppSelector((state) => state.settings.photoLayoutAlgorithm);

  const [isEditing, setIsEditing] = useState(false);
  const [draftComment, setDraftComment] = useState(entry?.comment ?? '');
  const [draftTagIds, setDraftTagIds] = useState<string[]>(entry?.tagIds ?? []);

  function startEdit() {
    if (!entry) return;
    setDraftComment(entry.comment);
    setDraftTagIds(entry.tagIds ?? []);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  function saveEdits() {
    if (!entry) return;
    dispatch(updateEntryComment({ id: entry.id, comment: draftComment }));
    dispatch(updateEntryTags({ id: entry.id, tagIds: draftTagIds }));
    setIsEditing(false);
  }

  function toggleDraftTag(id: string) {
    setDraftTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id]
    );
  }

  function confirmDelete() {
    if (!entry) return;
    Alert.alert(
      'Delete entry?',
      'This removes the photo(s) and comment permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Promise.allSettled(entry.photos.map((photo) => deletePhotoFile(photo.uri)));
            dispatch(deleteEntry({ id: entry.id }));
            navigation.goBack();
          },
        },
      ]
    );
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: !entry
        ? undefined
        : isEditing
        ? () => (
            <View style={styles.headerButtonRow}>
              <Pressable onPress={cancelEdit} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveEdits} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Save</Text>
              </Pressable>
            </View>
          )
        : () => (
            <View style={styles.headerButtonRow}>
              <IconButton name="pencil-outline" onPress={startEdit} accessibilityLabel="Edit entry" />
              <IconButton name="trash-outline" onPress={confirmDelete} accessibilityLabel="Delete entry" />
            </View>
          ),
    });
  }, [navigation, isEditing, entry, draftComment, draftTagIds]);

  if (!entry) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This entry no longer exists.</Text>
        <Button label="Back" onPress={() => navigation.navigate('Tabs')} />
      </View>
    );
  }

  const resolvedTags = (entry.tagIds ?? [])
    .map((id) => allTags[id])
    .filter((tag): tag is Tag => Boolean(tag));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <PhotoStack
        photosByEntry={[entry.photos.map((photo) => resolvePhotoUri(photo.uri))]}
        algorithm={photoLayoutAlgorithm}
        onPhotoPress={(index) =>
          navigation.navigate('PhotoDetails', { entryId: entry.id, photoIndex: index })
        }
      />
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={theme.colors.muted} />
          <Text style={styles.meta}>{formatFullDateTime(entry.createdAt)}</Text>
        </View>
        {entry.location?.placeName ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.meta}>{entry.location.placeName}</Text>
          </View>
        ) : null}
      </View>

      {isEditing ? (
        <>
          {Object.values(allTags).length > 0 ? (
            <View style={styles.tagRow}>
              {Object.values(allTags).map((tag) => (
                <TagChip
                  key={tag.id}
                  icon={tag.icon}
                  label={tag.label}
                  selected={draftTagIds.includes(tag.id)}
                  onPress={() => toggleDraftTag(tag.id)}
                />
              ))}
            </View>
          ) : null}
          <TextInput
            style={styles.commentInput}
            value={draftComment}
            onChangeText={setDraftComment}
            multiline
            placeholder="Comment"
            placeholderTextColor={theme.colors.muted}
          />
        </>
      ) : (
        <>
          {resolvedTags.length > 0 ? (
            <View style={styles.tagRow}>
              {resolvedTags.map((tag) => (
                <TagChip key={tag.id} icon={tag.icon} label={tag.label} />
              ))}
            </View>
          ) : null}
          <Text style={styles.comment}>{entry.comment || 'No comment'}</Text>
        </>
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  headerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  headerButtonText: {
    color: theme.colors.textOnDark,
    ...theme.typography.subtitle,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  commentInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    minHeight: 96,
    textAlignVertical: 'top',
    color: theme.colors.text,
    ...theme.typography.body,
  },
  missing: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  missingText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
