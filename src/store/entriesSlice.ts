import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Entry } from '../types/models';

export type EntriesState = Record<string, Entry>;

const initialState: EntriesState = {};

const entriesSlice = createSlice({
  name: 'entries',
  initialState,
  reducers: {
    addEntry(state, action: PayloadAction<Entry>) {
      state[action.payload.id] = action.payload;
    },
    updateEntryComment(state, action: PayloadAction<{ id: string; comment: string }>) {
      const entry = state[action.payload.id];
      if (entry) {
        entry.comment = action.payload.comment;
      }
    },
    deleteEntry(state, action: PayloadAction<{ id: string }>) {
      delete state[action.payload.id];
    },
  },
});

export const { addEntry, updateEntryComment, deleteEntry } = entriesSlice.actions;
export default entriesSlice.reducer;
