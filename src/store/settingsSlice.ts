import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PhotoLayoutAlgorithm, Settings } from '../types/models';

const initialState: Settings = {
  bundleByDay: false,
  photoLayoutAlgorithm: 'treemap',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setBundleByDay(state, action: PayloadAction<boolean>) {
      state.bundleByDay = action.payload;
    },
    setPhotoLayoutAlgorithm(state, action: PayloadAction<PhotoLayoutAlgorithm>) {
      state.photoLayoutAlgorithm = action.payload;
    },
  },
});

export const { setBundleByDay, setPhotoLayoutAlgorithm } = settingsSlice.actions;
export default settingsSlice.reducer;
