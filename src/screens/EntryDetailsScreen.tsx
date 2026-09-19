import React, { useRef, useState } from "react";
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
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  updateEntryComment,
  updateEntryTags,
  deleteEntry,
} from "../store/entriesSlice";
import { deletePhotoFile, resolvePhotoUri } from "../storage/photoStorage";
import {
  formatFullDateTime,
  formatTime,
  dayLabel,
  dayKeyOf,
} from "../utils/dateFormat";
import { TagChip } from "../components/TagChip";
import { IconButton } from "../components/IconButton";
import { Button } from "../components/photoLayouts/Button";
import { Tag } from "../types/models";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "EntryDetails">;
type Route = RouteProp<RootStackParamList, "EntryDetails">;

export function EntryDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryId } = route.params;
  const insets = useSafeAreaInsets();

  const dispatch = useAppDispatch();
  const entry = useAppSelector((state) => state.entries[entryId]);
  const allTags = useAppSelector((state) => state.tags);

  const [isEditing, setIsEditing] = useState(false);
  const [draftComment, setDraftComment] = useState(entry?.comment ?? "");
  const [draftTagIds, setDraftTagIds] = useState<string[]>(
    entry?.tagIds ?? [],
  );
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // The built-in "scroll focused input into view" behavior doesn't
  // reliably reveal this input (last in a long, variable-height scroll
  // above it: photos + tags). It's the last thing in the content, so
  // scrolling all the way to the end always reveals it regardless of what
  // sits above. The delay lets KeyboardAvoidingView's resize settle first.
  function handleCommentFocus() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function startEdit() {
    if (!entry) return;
    setDraftComment(entry.comment);
    setDraftTagIds(entry.tagIds ?? []);
    setShowTagPicker(false);
    setIsEditing(true);
  }

  function cancelEdit() {
    setShowTagPicker(false);
    setIsEditing(false);
  }

  function saveEdits() {
    if (!entry) return;
    dispatch(updateEntryComment({ id: entry.id, comment: draftComment }));
    dispatch(updateEntryTags({ id: entry.id, tagIds: draftTagIds }));
    setShowTagPicker(false);
    setIsEditing(false);
  }

  function toggleDraftTag(id: string) {
    setDraftTagIds((current) =>
      current.includes(id)
        ? current.filter((tagId) => tagId !== id)
        : [...current, id],
    );
  }

  function confirmDelete() {
    if (!entry) return;
    Alert.alert(
      "Delete entry?",
      "This removes the photo(s) and comment permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await Promise.allSettled(
              entry.photos.map((photo) => deletePhotoFile(photo.uri)),
            );
            dispatch(deleteEntry({ id: entry.id }));
            navigation.goBack();
          },
        },
      ],
    );
  }

  if (!entry) {
    return (
      <View
        style={[
          styles.missing,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Text style={styles.missingText}>This entry no longer exists.</Text>
        <Button label="Back" onPress={() => navigation.navigate("Home")} />
      </View>
    );
  }

  const resolvedTags = (entry.tagIds ?? [])
    .map((id) => allTags[id])
    .filter((tag): tag is Tag => Boolean(tag));
  const draftTags = draftTagIds
    .map((id) => allTags[id])
    .filter((tag): tag is Tag => Boolean(tag));
  const unselectedTags = Object.values(allTags).filter(
    (tag) => !draftTagIds.includes(tag.id),
  );
  const photoUris = entry.photos.map((photo) => resolvePhotoUri(photo.uri));
  const heroIndex = Math.min(activePhotoIndex, photoUris.length - 1);
  const heroUri = photoUris[heroIndex];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + theme.spacing.sm },
        ]}
      >
        {isEditing ? (
          <Pressable onPress={cancelEdit} style={styles.headerSideButton}>
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
        ) : (
          <IconButton
            name="chevron-back-outline"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          />
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {dayLabel(dayKeyOf(entry.createdAt))} · {formatTime(entry.createdAt)}
        </Text>
        <Pressable
          onPress={isEditing ? saveEdits : startEdit}
          style={styles.headerSideButton}
        >
          <Text style={styles.headerAction}>
            {isEditing ? "Save" : "Edit"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <Pressable
          onPress={() =>
            navigation.navigate("PhotoDetails", {
              entryId: entry.id,
              photoIndex: heroIndex,
            })
          }
        >
          <Image
            source={{ uri: heroUri }}
            style={styles.hero}
            contentFit="cover"
          />
        </Pressable>

        {photoUris.length > 1 ? (
          <View style={styles.thumbSection}>
            <Text style={styles.photoCount}>
              {heroIndex + 1} of {photoUris.length}
            </Text>
            <ScrollView
              horizontal
              style={styles.thumbScroll}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbRow}
            >
              {photoUris.map((uri, index) => (
                <Pressable
                  key={uri + index}
                  onPress={() => setActivePhotoIndex(index)}
                >
                  <Image
                    source={{ uri }}
                    style={[
                      styles.thumb,
                      index === heroIndex
                        ? styles.thumbActive
                        : styles.thumbDimmed,
                    ]}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {isEditing ? (
          <TextInput
            style={styles.commentInput}
            value={draftComment}
            onChangeText={setDraftComment}
            onFocus={handleCommentFocus}
            multiline
            placeholder="Comment"
            placeholderTextColor={theme.colors.chalk}
          />
        ) : (
          <Text style={styles.comment}>{entry.comment || "No comment"}</Text>
        )}

        {isEditing ? (
          <View style={styles.tagRow}>
            {draftTags.map((tag) => (
              <TagChip
                key={tag.id}
                icon={tag.icon}
                label={tag.label}
                selected
                onPress={() => toggleDraftTag(tag.id)}
              />
            ))}
            {unselectedTags.length > 0 ? (
              <Pressable
                onPress={() => setShowTagPicker((current) => !current)}
                style={styles.addTagChip}
              >
                <Ionicons
                  name="add-outline"
                  size={14}
                  color={theme.colors.chalk}
                />
                <Text style={styles.addTagLabel}>Add tag</Text>
              </Pressable>
            ) : null}
          </View>
        ) : resolvedTags.length > 0 ? (
          <View style={styles.tagRow}>
            {resolvedTags.map((tag) => (
              <TagChip key={tag.id} icon={tag.icon} label={tag.label} />
            ))}
          </View>
        ) : null}

        {isEditing && showTagPicker && unselectedTags.length > 0 ? (
          <View style={styles.tagRow}>
            {unselectedTags.map((tag) => (
              <TagChip
                key={tag.id}
                icon={tag.icon}
                label={tag.label}
                onPress={() => toggleDraftTag(tag.id)}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.detailList}>
          <DetailRow
            label="Taken"
            value={formatFullDateTime(entry.createdAt)}
          />
          {entry.location?.placeName ? (
            <DetailRow label="Place" value={entry.location.placeName} />
          ) : null}
          <DetailRow
            label="Photos"
            value={`${entry.photos.length} photo${
              entry.photos.length === 1 ? "" : "s"
            }`}
          />
        </View>

        <Pressable onPress={confirmDelete} style={styles.deleteRow}>
          <Text style={styles.deleteLabel}>Delete entry</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type DetailRowProps = { label: string; value: string };

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.wall,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  headerSideButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    minWidth: 60,
  },
  headerAction: {
    ...theme.typography.subtitle,
    color: theme.colors.brass,
  },
  headerTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.bone,
    flex: 1,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  hero: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: theme.colors.seam,
  },
  thumbSection: {
    gap: theme.spacing.xs,
  },
  photoCount: {
    ...theme.typography.caption,
    color: theme.colors.chalk,
    paddingHorizontal: theme.spacing.md,
  },
  thumbScroll: {
    flexGrow: 0,
  },
  thumbRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    backgroundColor: theme.colors.seam,
  },
  thumbActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: theme.colors.hairline,
  },
  thumbDimmed: {
    opacity: 0.5,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.bone,
    paddingHorizontal: theme.spacing.md,
  },
  commentInput: {
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.seam,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    minHeight: 96,
    textAlignVertical: "top",
    color: theme.colors.bone,
    ...theme.typography.body,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  addTagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.seam,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  addTagLabel: {
    ...theme.typography.caption,
    color: theme.colors.chalk,
  },
  detailList: {
    marginHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  detailLabel: {
    ...theme.typography.body,
    color: theme.colors.chalk,
  },
  detailValue: {
    ...theme.typography.body,
    color: theme.colors.bone,
  },
  deleteRow: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  deleteLabel: {
    ...theme.typography.subtitle,
    color: theme.colors.clay,
  },
  missing: {
    flex: 1,
    backgroundColor: theme.colors.wall,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  missingText: {
    ...theme.typography.body,
    color: theme.colors.bone,
  },
});
