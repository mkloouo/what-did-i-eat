import { createSlice } from "@reduxjs/toolkit";

export type AppMetaState = {
  hasSeededDefaultTags: boolean;
};

const initialState: AppMetaState = {
  hasSeededDefaultTags: false,
};

const appMetaSlice = createSlice({
  name: "appMeta",
  initialState,
  reducers: {
    markDefaultTagsSeeded(state) {
      state.hasSeededDefaultTags = true;
    },
  },
});

export const { markDefaultTagsSeeded } = appMetaSlice.actions;
export default appMetaSlice.reducer;
