import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Entry, Photo } from "../types/models";

export type EntriesState = Record<string, Entry>;

const initialState: EntriesState = {};

const entriesSlice = createSlice({
  name: "entries",
  initialState,
  reducers: {
    addEntry(state, action: PayloadAction<Entry>) {
      state[action.payload.id] = action.payload;
    },
    updateEntryComment(
      state,
      action: PayloadAction<{ id: string; comment: string }>,
    ) {
      const entry = state[action.payload.id];
      if (entry) {
        entry.comment = action.payload.comment;
      }
    },
    updateEntryTags(
      state,
      action: PayloadAction<{ id: string; tagIds: string[] }>,
    ) {
      const entry = state[action.payload.id];
      if (entry) {
        entry.tagIds = action.payload.tagIds;
      }
    },
    replaceEntryPhoto(
      state,
      action: PayloadAction<{ entryId: string; photoId: string; photo: Photo }>,
    ) {
      const photos = state[action.payload.entryId]?.photos;
      const index =
        photos?.findIndex((photo) => photo.id === action.payload.photoId) ?? -1;
      if (photos && index !== -1) {
        photos[index] = action.payload.photo;
      }
    },
    deleteEntry(state, action: PayloadAction<{ id: string }>) {
      delete state[action.payload.id];
    },
  },
});

export const {
  addEntry,
  updateEntryComment,
  updateEntryTags,
  replaceEntryPhoto,
  deleteEntry,
} = entriesSlice.actions;
export default entriesSlice.reducer;
