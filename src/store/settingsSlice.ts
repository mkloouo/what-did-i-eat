import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GroupingMode, PhotoLayoutAlgorithm, Settings } from '../types/models';

const initialState: Settings = {
  groupingMode: 'rolling',
  rollingWindowMinutes: 60,
  photoLayoutAlgorithm: 'treemap',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setGroupingMode(state, action: PayloadAction<GroupingMode>) {
      state.groupingMode = action.payload;
    },
    setRollingWindowMinutes(state, action: PayloadAction<number>) {
      state.rollingWindowMinutes = action.payload;
    },
    setPhotoLayoutAlgorithm(state, action: PayloadAction<PhotoLayoutAlgorithm>) {
      state.photoLayoutAlgorithm = action.payload;
    },
  },
});

export const { setGroupingMode, setRollingWindowMinutes, setPhotoLayoutAlgorithm } =
  settingsSlice.actions;
export default settingsSlice.reducer;
