import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, SafeAreaView } from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateEntryComment, deleteEntry } from '../store/entriesSlice';
import { deletePhotoFile, resolvePhotoUri } from '../storage/photoStorage';
import { formatFullDateTime } from '../utils/dateFormat';
import { Button } from '../components/Button';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PhotoDetails'>;
type Route = RouteProp<RootStackParamList, 'PhotoDetails'>;

type PhotoDetailsHeaderProps = {
  entryId: string;
  navigation: Nav;
};

// Rendered by ImageViewing's HeaderComponent. Kept as its own component (with
// its own selector/dispatch, keyed only by entryId) so the value passed as
// HeaderComponent can have a stable identity across parent re-renders.
function PhotoDetailsHeader({ entryId, navigation }: PhotoDetailsHeaderProps) {
  const dispatch = useAppDispatch();
  const entry = useAppSelector((state) => state.entries[entryId]);

  function confirmDelete() {
    if (!entry) return;
    Alert.alert('Delete entry?', 'This removes the photo(s) and comment permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // Use allSettled so a single failed file delete never blocks
          // removing the entry itself.
          await Promise.allSettled(entry.photos.map((photo) => deletePhotoFile(photo.uri)));
          dispatch(deleteEntry({ id: entry.id }));
          navigation.navigate('Feed');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.topBar}>
      <Pressable onPress={() => navigation.goBack()} style={styles.topBarButton}>
        <Text style={styles.topBarButtonText}>Close</Text>
      </Pressable>
      <Pressable onPress={confirmDelete} style={styles.topBarButton}>
        <Text style={[styles.topBarButtonText, styles.deleteText]}>Delete</Text>
      </Pressable>
    </SafeAreaView>
  );
}

type PhotoDetailsFooterProps = {
  entryId: string;
};

// Rendered by ImageViewing's FooterComponent. Owns the comment-editing state
// itself, keyed only by entryId, so typing in the TextInput never changes the
// identity of the FooterComponent value passed down from the parent screen
// (which would otherwise remount this whole subtree on every keystroke).
function PhotoDetailsFooter({ entryId }: PhotoDetailsFooterProps) {
  const dispatch = useAppDispatch();
  const entry = useAppSelector((state) => state.entries[entryId]);
  const [isEditing, setIsEditing] = useState(false);
  const [draftComment, setDraftComment] = useState(entry?.comment ?? '');

  if (!entry) {
    return null;
  }

  function saveComment() {
    dispatch(updateEntryComment({ id: entry.id, comment: draftComment }));
    setIsEditing(false);
  }

  return (
    <SafeAreaView style={styles.footer}>
      <Text style={styles.footerMeta}>{formatFullDateTime(entry.createdAt)}</Text>
      {entry.location?.placeName ? (
        <Text style={styles.footerMeta}>{entry.location.placeName}</Text>
      ) : null}

      {isEditing ? (
        <View style={styles.editRow}>
          <TextInput
            style={styles.editInput}
            value={draftComment}
            onChangeText={setDraftComment}
            multiline
            placeholder="Comment"
            placeholderTextColor={theme.colors.muted}
          />
          <View style={styles.editButtons}>
            <Button label="Cancel" variant="danger" onPress={() => setIsEditing(false)} />
            <Button label="Save" onPress={saveComment} />
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setIsEditing(true)}>
          <Text style={styles.comment}>{entry.comment || 'No comment — tap to add one'}</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

export function PhotoDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryId, photoIndex } = route.params;

  const entry = useAppSelector((state) => state.entries[entryId]);

  // These callbacks only depend on entryId/navigation, so their identity is
  // stable across re-renders caused by comment-editing keystrokes (which live
  // entirely inside PhotoDetailsFooter's own state).
  const HeaderComponent = useCallback(
    () => <PhotoDetailsHeader entryId={entryId} navigation={navigation} />,
    [entryId, navigation]
  );
  const FooterComponent = useCallback(
    () => <PhotoDetailsFooter entryId={entryId} />,
    [entryId]
  );

  if (!entry) {
    return (
      <SafeAreaView style={styles.missing}>
        <Text style={styles.missingText}>This entry no longer exists.</Text>
        <Button label="Back" onPress={() => navigation.navigate('Feed')} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ImageViewing
        images={entry.photos.map((photo) => ({ uri: resolvePhotoUri(photo.uri) }))}
        imageIndex={photoIndex}
        visible
        onRequestClose={() => navigation.goBack()}
        HeaderComponent={HeaderComponent}
        FooterComponent={FooterComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  topBarButton: {
    padding: theme.spacing.sm,
  },
  topBarButtonText: {
    color: theme.colors.textOnDark,
    ...theme.typography.subtitle,
  },
  deleteText: {
    color: theme.colors.danger,
  },
  footer: {
    backgroundColor: theme.colors.accentDark,
    padding: theme.spacing.md,
  },
  footerMeta: {
    ...theme.typography.caption,
    color: theme.colors.textOnDark,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.textOnDark,
    marginTop: theme.spacing.sm,
  },
  editRow: {
    marginTop: theme.spacing.sm,
  },
  editInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    minHeight: 64,
    textAlignVertical: 'top',
    color: theme.colors.text,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
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
