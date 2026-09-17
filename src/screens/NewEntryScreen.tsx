import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../store/hooks';
import { addEntry } from '../store/entriesSlice';
import { generateId } from '../utils/id';
import { savePickedPhoto, deletePhotoFile, resolvePhotoUri } from '../storage/photoStorage';
import { captureCurrentLocation } from '../location/locationService';
import { Photo } from '../types/models';
import { Button } from '../components/photoLayouts/Button';
import { PhotoThumbnail } from '../components/PhotoThumbnail';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'NewEntry'>;

export function NewEntryScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  // Tracks whether the entry was actually saved, so the unmount cleanup below
  // knows whether the picked-and-copied photo files are now legitimately
  // referenced by a saved entry (skip cleanup) or were orphaned by backing
  // out of this screen (delete them).
  const savedRef = useRef(false);
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      if (!savedRef.current) {
        photosRef.current.forEach((photo) => {
          deletePhotoFile(photo.uri).catch(() => {
            // Best-effort cleanup of an orphaned photo file; nothing to do if it fails.
          });
        });
      }
    };
  }, []);

  async function addPickedAssets(assetUris: string[]) {
    try {
      const results = await Promise.allSettled(
        assetUris.map(async (uri) => {
          const id = generateId();
          const destUri = await savePickedPhoto(uri, id);
          return { id, uri: destUri };
        })
      );

      const saved = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => (result as PromiseFulfilledResult<{ id: string; uri: string }>).value);

      if (saved.length > 0) {
        setPhotos((current) => [...current, ...saved]);
      }

      if (results.some((result) => result.status === 'rejected')) {
        Alert.alert('Some photos could not be saved', 'Some photos failed to save, but the successful ones have been added.');
      }
    } catch {
      Alert.alert('Could not save photo', 'Something went wrong saving that photo. Please try again.');
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera unavailable', 'Camera permission was denied.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      await addPickedAssets(result.assets.map((a) => a.uri));
    }
  }

  async function handlePickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo library unavailable', 'Photo library permission was denied.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      await addPickedAssets(result.assets.map((a) => a.uri));
    }
  }

  function removePhoto(id: string) {
    const photo = photos.find((p) => p.id === id);
    if (photo) {
      deletePhotoFile(photo.uri).catch(() => {
        // Best-effort cleanup of an orphaned photo file; nothing to do if it fails.
      });
    }
    setPhotos((current) => current.filter((p) => p.id !== id));
  }

  async function handleAdd() {
    if (photos.length === 0) return;
    setSaving(true);
    try {
      const location = await captureCurrentLocation();
      dispatch(
        addEntry({
          id: generateId(),
          createdAt: new Date().toISOString(),
          comment,
          location,
          photos,
        })
      );
      savedRef.current = true;
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.pickerRow}>
        <Button label="Take photo" onPress={handleTakePhoto} style={styles.pickerButton} />
        <Button label="Choose from library" onPress={handlePickFromLibrary} style={styles.pickerButton} />
      </View>

      {photos.length > 0 ? (
        <View style={styles.thumbnailRow}>
          {photos.map((photo) => (
            <Pressable key={photo.id} onLongPress={() => removePhoto(photo.id)} style={styles.thumbnailWrapper}>
              <PhotoThumbnail uri={resolvePhotoUri(photo.uri)} size={80} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>Add at least one photo. Long-press a thumbnail to remove it.</Text>
      )}

      <TextInput
        style={styles.commentInput}
        placeholder="What did you eat?"
        placeholderTextColor={theme.colors.muted}
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <Button
        label="Add"
        onPress={handleAdd}
        disabled={photos.length === 0 || saving}
        loading={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  pickerButton: {
    flex: 1,
  },
  thumbnailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  thumbnailWrapper: {},
  hint: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
  },
  commentInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    minHeight: 96,
    textAlignVertical: 'top',
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
});
