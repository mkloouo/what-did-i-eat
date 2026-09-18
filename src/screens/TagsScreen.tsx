import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { addTag, updateTag, deleteTag } from "../store/tagsSlice";
import { generateId } from "../utils/id";
import { isValidTagLabel } from "../utils/tagLabel";
import { Tag, TagIcon, TAG_ICON_OPTIONS } from "../types/models";
import { Card } from "../components/Card";
import { TagChip } from "../components/TagChip";
import { Button } from "../components/photoLayouts/Button";
import { theme } from "../theme/theme";

export function TagsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const tags = useAppSelector((state) => Object.values(state.tags));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftIcon, setDraftIcon] = useState<TagIcon | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function startAdd() {
    setEditingId("new");
    setDraftIcon(null);
    setDraftLabel("");
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setDraftIcon(tag.icon);
    setDraftLabel(tag.label);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftIcon(null);
    setDraftLabel("");
  }

  function saveDraft() {
    if (!draftIcon || !isValidTagLabel(draftLabel)) return;
    const label = draftLabel.trim();
    if (editingId === "new") {
      dispatch(addTag({ id: generateId(), icon: draftIcon, label }));
    } else if (editingId) {
      dispatch(updateTag({ id: editingId, icon: draftIcon, label }));
    }
    cancelEdit();
  }

  function startSelecting() {
    setIsSelecting(true);
    setSelectedIds([]);
  }

  function cancelSelecting() {
    setIsSelecting(false);
    setSelectedIds([]);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((tagId) => tagId !== id)
        : [...current, id],
    );
  }

  function confirmDeleteSelected() {
    Alert.alert(
      "Delete tags?",
      `${selectedIds.length} tag${selectedIds.length === 1 ? "" : "s"} will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            selectedIds.forEach((id) => dispatch(deleteTag({ id })));
            cancelSelecting();
          },
        },
      ],
    );
  }

  function handleTagPress(tag: Tag) {
    if (isSelecting) {
      toggleSelected(tag.id);
    } else {
      startEdit(tag);
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isSelecting ? (
          <View style={styles.headerButtonRow}>
            <Pressable onPress={cancelSelecting} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirmDeleteSelected}
              disabled={selectedIds.length === 0}
              style={styles.headerButton}
            >
              <Text
                style={[
                  styles.headerButtonText,
                  selectedIds.length === 0 && styles.headerButtonTextDisabled,
                ]}
              >
                Delete{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={startSelecting} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Select</Text>
          </Pressable>
        ),
    });
  }, [navigation, isSelecting, selectedIds]);

  const isEditingForm = editingId !== null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.formCard}>
          <Text style={styles.label}>
            {editingId === "new"
              ? "Add a tag"
              : editingId
                ? "Edit tag"
                : "Tags"}
          </Text>
          {isEditingForm ? (
            <>
              <View style={styles.iconRow}>
                {TAG_ICON_OPTIONS.map((icon) => (
                  <Pressable
                    key={icon}
                    onPress={() => setDraftIcon(icon)}
                    style={styles.iconOption}
                  >
                    <Ionicons
                      name={icon}
                      size={22}
                      color={
                        draftIcon === icon
                          ? theme.colors.primary
                          : theme.colors.muted
                      }
                    />
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. Home cooked"
                placeholderTextColor={theme.colors.muted}
                value={draftLabel}
                onChangeText={setDraftLabel}
              />
              <View style={styles.formButtons}>
                <Button label="Cancel" variant="danger" onPress={cancelEdit} />
                <Button
                  label="Save"
                  onPress={saveDraft}
                  disabled={!draftIcon || !isValidTagLabel(draftLabel)}
                />
              </View>
            </>
          ) : (
            <Button label="Add tag" onPress={startAdd} />
          )}
        </Card>

        {tags.length === 0 ? (
          <Text style={styles.empty}>
            No tags yet — add your first one above.
          </Text>
        ) : (
          <View style={styles.chipsWrap}>
            {tags.map((tag) => (
              <TagChip
                key={tag.id}
                icon={tag.icon}
                label={tag.label}
                selected={isSelecting && selectedIds.includes(tag.id)}
                onPress={() => handleTagPress(tag)}
              />
            ))}
          </View>
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
  content: {
    padding: theme.spacing.md,
  },
  headerButtonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  headerButtonText: {
    color: theme.colors.textOnDark,
    ...theme.typography.subtitle,
  },
  headerButtonTextDisabled: {
    opacity: 0.5,
  },
  formCard: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  iconOption: {
    padding: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  empty: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    marginTop: theme.spacing.lg,
  },
});
