import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, SafeAreaView } from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateEntryComment, deleteEntry } from '../store/entriesSlice';
import { deletePhotoFile } from '../storage/photoStorage';
import { formatFullDateTime } from '../utils/dateFormat';
import { Button } from '../components/Button';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PhotoDetails'>;
type Route = RouteProp<RootStackParamList, 'PhotoDetails'>;

export function PhotoDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryId, photoIndex } = route.params;
  const dispatch = useAppDispatch();

  const entry = useAppSelector((state) => state.entries[entryId]);

  const [isEditing, setIsEditing] = useState(false);
  const [draftComment, setDraftComment] = useState(entry?.comment ?? '');

  if (!entry) {
    return (
      <SafeAreaView style={styles.missing}>
        <Text style={styles.missingText}>This entry no longer exists.</Text>
        <Button label="Back" onPress={() => navigation.navigate('Feed')} />
      </SafeAreaView>
    );
  }

  function saveComment() {
    dispatch(updateEntryComment({ id: entry.id, comment: draftComment }));
    setIsEditing(false);
  }

  function confirmDelete() {
    Alert.alert('Delete entry?', 'This removes the photo(s) and comment permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Promise.all(entry.photos.map((photo) => deletePhotoFile(photo.uri)));
          dispatch(deleteEntry({ id: entry.id }));
          navigation.navigate('Feed');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ImageViewing
        images={entry.photos.map((photo) => ({ uri: photo.uri }))}
        imageIndex={photoIndex}
        visible
        onRequestClose={() => navigation.goBack()}
        FooterComponent={(_props) => (
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
        )}
      />

      <SafeAreaView style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.topBarButton}>
          <Text style={styles.topBarButtonText}>Close</Text>
        </Pressable>
        <Pressable onPress={confirmDelete} style={styles.topBarButton}>
          <Text style={[styles.topBarButtonText, styles.deleteText]}>Delete</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
