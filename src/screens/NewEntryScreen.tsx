import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectAllTags } from "../store/selectors/tagSelectors";
import { TagChip } from "../components/TagChip";
import { addEntry } from "../store/entriesSlice";
import { generateId } from "../utils/id";
import {
  savePickedPhoto,
  deletePhotoFile,
  resolvePhotoUri,
} from "../storage/photoStorage";
import { captureCurrentLocation } from "../location/locationService";
import { takePhoto } from "../camera/cameraService";
import { Photo } from "../types/models";
import { Button } from "../components/photoLayouts/Button";
import { PhotoThumbnail } from "../components/PhotoThumbnail";
import { PaginationDots } from "../components/PaginationDots";
import { PhotoViewer } from "../components/PhotoViewer";
import { formatFullDateTime } from "../utils/dateFormat";
import { parseExifDateTime } from "../utils/exifDate";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "NewEntry">;
type Route = RouteProp<RootStackParamList, "NewEntry">;

export function NewEntryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  useEffect(() => {
    const initialPhotoUris = route.params?.initialPhotoUris;
    if (initialPhotoUris?.length) {
      addPickedAssets(initialPhotoUris);
      navigation.setParams(undefined);
    }
  }, [route.params?.initialPhotoUris]);

  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdAt, setCreatedAt] = useState(() => new Date());
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [androidStep, setAndroidStep] = useState<"date" | "time" | null>(null);
  const [androidTempDate, setAndroidTempDate] = useState<Date | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const tags = useAppSelector(selectAllTags);
  const inferDateFromFirstImportedPhoto = useAppSelector(
    (state) => state.settings.inferDateFromFirstImportedPhoto,
  );
  const captureLocation = useAppSelector(
    (state) => state.settings.captureLocation,
  );

  function toggleTag(id: string) {
    setSelectedTagIds((current) =>
      current.includes(id)
        ? current.filter((tagId) => tagId !== id)
        : [...current, id],
    );
  }

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
        }),
      );

      const saved = results
        .filter((result) => result.status === "fulfilled")
        .map(
          (result) =>
            (result as PromiseFulfilledResult<{ id: string; uri: string }>)
              .value,
        );

      if (saved.length > 0) {
        setPhotos((current) => [...current, ...saved]);
      }

      if (results.some((result) => result.status === "rejected")) {
        Alert.alert(
          "Some photos could not be saved",
          "Some photos failed to save, but the successful ones have been added.",
        );
      }
    } catch {
      Alert.alert(
        "Could not save photo",
        "Something went wrong saving that photo. Please try again.",
      );
    }
  }

  // The built-in "scroll focused input into view" behavior doesn't
  // reliably reveal this input once several photos are attached. The
  // delay lets KeyboardAvoidingView's resize settle first.
  function handleCommentFocus() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function handleTakePhoto() {
    return takePhoto(addPickedAssets);
  }

  async function handlePickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo library unavailable",
        "Photo library permission was denied.",
      );
      return;
    }
    const shouldInferDate =
      inferDateFromFirstImportedPhoto && photos.length === 0;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
      exif: shouldInferDate,
    });
    if (!result.canceled) {
      if (shouldInferDate) {
        const inferredDate = parseExifDateTime(
          result.assets[0]?.exif?.DateTimeOriginal ??
            result.assets[0]?.exif?.DateTimeDigitized ??
            result.assets[0]?.exif?.DateTime,
        );
        if (inferredDate) {
          setCreatedAt(clampToNow(inferredDate));
        }
      }
      await addPickedAssets(result.assets.map((a) => a.uri));
    }
  }

  function clampToNow(date: Date): Date {
    const now = new Date();
    return date > now ? now : date;
  }

  function handleOpenDateTimePicker() {
    if (Platform.OS === "android") {
      setAndroidStep("date");
    } else {
      setShowIOSPicker((visible) => !visible);
    }
  }

  function handleAndroidDateTimeChange(
    event: DateTimePickerEvent,
    selected?: Date,
  ) {
    if (androidStep === "date") {
      if (event.type === "set" && selected) {
        setAndroidTempDate(selected);
        setAndroidStep("time");
      } else {
        setAndroidStep(null);
      }
    } else if (androidStep === "time") {
      if (event.type === "set" && selected && androidTempDate) {
        const combined = new Date(androidTempDate);
        combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setCreatedAt(clampToNow(combined));
      }
      setAndroidStep(null);
      setAndroidTempDate(null);
    }
  }

  function handleIOSDateTimeChange(
    event: DateTimePickerEvent,
    selected?: Date,
  ) {
    if (selected) {
      setCreatedAt(clampToNow(selected));
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

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const closeViewer = () => setViewerIndex(null);

  async function handleAdd() {
    if (photos.length === 0) return;
    setSaving(true);
    try {
      const location = captureLocation ? await captureCurrentLocation() : null;
      dispatch(
        addEntry({
          id: generateId(),
          createdAt: createdAt.toISOString(),
          comment,
          location,
          photos,
          tagIds: selectedTagIds,
        }),
      );
      savedRef.current = true;
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <View style={styles.pickerRow}>
          <Button
            label="Take photo"
            onPress={handleTakePhoto}
            style={styles.pickerButton}
          />
          <Button
            label="Choose from library"
            onPress={handlePickFromLibrary}
            style={styles.pickerButton}
          />
        </View>

        {photos.length > 0 ? (
          <View style={styles.thumbnailRow}>
            {photos.map((photo, index) => (
              <Pressable
                key={photo.id}
                onPress={() => setViewerIndex(index)}
                onLongPress={() => removePhoto(photo.id)}
                style={styles.thumbnailWrapper}
              >
                <PhotoThumbnail uri={resolvePhotoUri(photo.uri)} size={80} />
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.hint}>
            Add at least one photo. Tap a thumbnail to preview it, long-press to
            remove it.
          </Text>
        )}

        <Pressable
          onPress={handleOpenDateTimePicker}
          style={styles.dateTimeRow}
        >
          <Text style={styles.dateTimeLabel}>
            {formatFullDateTime(createdAt.toISOString())}
          </Text>
        </Pressable>

        {Platform.OS === "android" && androidStep ? (
          <DateTimePicker
            value={
              androidStep === "date"
                ? createdAt
                : (androidTempDate ?? createdAt)
            }
            mode={androidStep}
            display="default"
            maximumDate={new Date()}
            onChange={handleAndroidDateTimeChange}
          />
        ) : null}

        {Platform.OS === "ios" && showIOSPicker ? (
          <DateTimePicker
            value={createdAt}
            mode="datetime"
            display="inline"
            maximumDate={new Date()}
            onChange={handleIOSDateTimeChange}
            style={styles.iosPicker}
          />
        ) : null}

        {tags.length > 0 ? (
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <TagChip
                key={tag.id}
                icon={tag.icon}
                label={tag.label}
                selected={selectedTagIds.includes(tag.id)}
                onPress={() => toggleTag(tag.id)}
              />
            ))}
          </View>
        ) : null}

        <TextInput
          style={styles.commentInput}
          placeholder="What did you eat?"
          placeholderTextColor={theme.colors.graphite}
          value={comment}
          onChangeText={setComment}
          onFocus={handleCommentFocus}
          multiline
        />

        <Button
          label="Add"
          onPress={handleAdd}
          disabled={photos.length === 0 || saving}
          loading={saving}
        />

      </ScrollView>
      {viewerIndex !== null ? (
        <Modal
          visible
          animationType="fade"
          onRequestClose={closeViewer}
          statusBarTranslucent
        >
          <PhotoViewer
            photos={photos.map((photo) => ({
              uri: resolvePhotoUri(photo.uri),
            }))}
            initialIndex={viewerIndex}
            onRequestClose={closeViewer}
            onIndexChange={setViewerIndex}
            renderHeader={(imageIndex) => {
              const photo = photos[imageIndex];
              return (
                <View
                  style={[styles.viewerTopBar, { paddingTop: insets.top }]}
                >
                  <Pressable
                    onPress={closeViewer}
                    style={styles.viewerTopBarButton}
                  >
                    <Text style={styles.viewerTopBarButtonText}>Close</Text>
                  </Pressable>
                  {photo ? (
                    <Pressable
                      onPress={() => {
                        removePhoto(photo.id);
                        closeViewer();
                      }}
                      style={styles.viewerTopBarButton}
                    >
                      <Text
                        style={[
                          styles.viewerTopBarButtonText,
                          styles.viewerRemoveText,
                        ]}
                      >
                        Remove
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            }}
            renderFooter={(imageIndex) => (
              <View
                style={[
                  styles.viewerFooter,
                  { paddingBottom: insets.bottom + theme.spacing.md },
                ]}
              >
                <View style={styles.dotsWrapper}>
                  <PaginationDots
                    count={photos.length}
                    activeIndex={imageIndex}
                  />
                </View>
                {tags.length > 0 ? (
                  <View style={styles.tagRow}>
                    {tags.map((tag) => (
                      <TagChip
                        key={tag.id}
                        icon={tag.icon}
                        label={tag.label}
                        selected={selectedTagIds.includes(tag.id)}
                        onPress={() => toggleTag(tag.id)}
                      />
                    ))}
                  </View>
                ) : null}
                <TextInput
                  style={styles.viewerCommentInput}
                  placeholder="What did you eat?"
                  placeholderTextColor={theme.colors.graphite}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                />
              </View>
            )}
          />
        </Modal>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.daylight,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  pickerRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  pickerButton: {
    flex: 1,
  },
  thumbnailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  thumbnailWrapper: {},
  hint: {
    ...theme.typography.caption,
    color: theme.colors.graphite,
    marginBottom: theme.spacing.md,
  },
  dateTimeRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dateTimeLabel: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  iosPicker: {
    marginBottom: theme.spacing.md,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  commentInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    minHeight: 96,
    textAlignVertical: "top",
    ...theme.typography.voice,
    color: theme.colors.ink,
    marginBottom: theme.spacing.md,
  },
  viewerTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
  },
  viewerTopBarButton: {
    padding: theme.spacing.sm,
  },
  // The viewer overlay always sits on a black backdrop (photo legibility, the
  // universal viewer convention), so it keeps a dark bar / light text pairing
  // regardless of the app's own light theme.
  viewerTopBarButtonText: {
    color: theme.colors.daylight,
    ...theme.typography.subtitle,
  },
  viewerRemoveText: {
    color: theme.colors.clayOnDark,
  },
  viewerFooter: {
    backgroundColor: theme.colors.ink,
    padding: theme.spacing.md,
  },
  dotsWrapper: {
    marginBottom: theme.spacing.sm,
  },
  viewerCommentInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    minHeight: 64,
    textAlignVertical: "top",
    ...theme.typography.voice,
    color: theme.colors.ink,
  },
});
