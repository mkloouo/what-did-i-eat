import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Settings } from '../types/models';

const initialState: Settings = {
  bundleByDay: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setBundleByDay(state, action: PayloadAction<boolean>) {
      state.bundleByDay = action.payload;
    },
  },
});

export const { setBundleByDay } = settingsSlice.actions;
export default settingsSlice.reducer;
