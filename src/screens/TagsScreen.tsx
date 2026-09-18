import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { addTag, updateTag, deleteTag } from '../store/tagsSlice';
import { generateId } from '../utils/id';
import { isValidTagLabel } from '../utils/tagLabel';
import { Tag, TagIcon, TAG_ICON_OPTIONS } from '../types/models';
import { Card } from '../components/Card';
import { IconButton } from '../components/IconButton';
import { Button } from '../components/photoLayouts/Button';
import { theme } from '../theme/theme';

export function TagsScreen() {
  const dispatch = useAppDispatch();
  const tags = useAppSelector((state) => Object.values(state.tags));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftIcon, setDraftIcon] = useState<TagIcon | null>(null);
  const [draftLabel, setDraftLabel] = useState('');

  function startAdd() {
    setEditingId('new');
    setDraftIcon(null);
    setDraftLabel('');
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setDraftIcon(tag.icon);
    setDraftLabel(tag.label);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftIcon(null);
    setDraftLabel('');
  }

  function saveDraft() {
    if (!draftIcon || !isValidTagLabel(draftLabel)) return;
    const label = draftLabel.trim();
    if (editingId === 'new') {
      dispatch(addTag({ id: generateId(), icon: draftIcon, label }));
    } else if (editingId) {
      dispatch(updateTag({ id: editingId, icon: draftIcon, label }));
    }
    cancelEdit();
  }

  function confirmDelete(tag: Tag) {
    Alert.alert('Delete tag?', `"${tag.label}" will be removed from the tag list.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteTag({ id: tag.id })) },
    ]);
  }

  const isEditingForm = editingId !== null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        contentContainerStyle={styles.content}
        data={tags}
        keyExtractor={(tag) => tag.id}
        ListHeaderComponent={
          <Card style={styles.formCard}>
            <Text style={styles.label}>
              {editingId === 'new' ? 'Add a tag' : editingId ? 'Edit tag' : 'Tags'}
            </Text>
            {isEditingForm ? (
              <>
                <View style={styles.iconRow}>
                  {TAG_ICON_OPTIONS.map((icon) => (
                    <Pressable key={icon} onPress={() => setDraftIcon(icon)} style={styles.iconOption}>
                      <Ionicons
                        name={icon}
                        size={22}
                        color={draftIcon === icon ? theme.colors.primary : theme.colors.muted}
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
        }
        renderItem={({ item }) => (
          <Card style={styles.tagRow}>
            <Ionicons name={item.icon} size={20} color={theme.colors.text} />
            <Text style={styles.tagRowLabel}>{item.label}</Text>
            <IconButton
              name="pencil-outline"
              onPress={() => startEdit(item)}
              accessibilityLabel={`Edit ${item.label}`}
              color={theme.colors.muted}
              size={18}
            />
            <IconButton
              name="trash-outline"
              onPress={() => confirmDelete(item)}
              accessibilityLabel={`Delete ${item.label}`}
              color={theme.colors.danger}
              size={18}
            />
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No tags yet — add your first one above.</Text>}
      />
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
    gap: theme.spacing.sm,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tagRowLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  empty: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});
