import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Tag } from '../types/models';

export type TagsState = Record<string, Tag>;

const initialState: TagsState = {};

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    addTag(state, action: PayloadAction<Tag>) {
      state[action.payload.id] = action.payload;
    },
    updateTag(state, action: PayloadAction<Tag>) {
      if (state[action.payload.id]) {
        state[action.payload.id] = action.payload;
      }
    },
    deleteTag(state, action: PayloadAction<{ id: string }>) {
      delete state[action.payload.id];
    },
  },
});

export const { addTag, updateTag, deleteTag } = tagsSlice.actions;
export default tagsSlice.reducer;
