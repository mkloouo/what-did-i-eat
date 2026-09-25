import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Settings } from "../types/models";

const MIN_WALL_COLUMNS = 3;
const MAX_WALL_COLUMNS = 10;

function clampWallColumns(value: number): number {
  return Math.min(MAX_WALL_COLUMNS, Math.max(MIN_WALL_COLUMNS, value));
}

const initialState: Settings = {
  wallColumns: 4,
  inferDateFromFirstImportedPhoto: false,
  captureLocation: true,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setWallColumns(state, action: PayloadAction<number>) {
      state.wallColumns = clampWallColumns(action.payload);
    },
    setInferDateFromFirstImportedPhoto(state, action: PayloadAction<boolean>) {
      state.inferDateFromFirstImportedPhoto = action.payload;
    },
    setCaptureLocation(state, action: PayloadAction<boolean>) {
      state.captureLocation = action.payload;
    },
  },
});

export const {
  setWallColumns,
  setInferDateFromFirstImportedPhoto,
  setCaptureLocation,
} = settingsSlice.actions;
export default settingsSlice.reducer;
