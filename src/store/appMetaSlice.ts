import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AppMetaState = {
  hasSeededDefaultTags: boolean;
  // Wall's day scrubber. Off by default — snapping to the nearest day tick
  // feels jumpy with only a handful of days logged. Not a Settings row (the
  // spec keeps Settings at exactly six), so it lives here like other
  // persisted UI state that isn't a real user-facing setting.
  scrubberEnabled: boolean;
};

const initialState: AppMetaState = {
  hasSeededDefaultTags: false,
  scrubberEnabled: false,
};

const appMetaSlice = createSlice({
  name: "appMeta",
  initialState,
  reducers: {
    markDefaultTagsSeeded(state) {
      state.hasSeededDefaultTags = true;
    },
    setScrubberEnabled(state, action: PayloadAction<boolean>) {
      state.scrubberEnabled = action.payload;
    },
  },
});

export const { markDefaultTagsSeeded, setScrubberEnabled } =
  appMetaSlice.actions;
export default appMetaSlice.reducer;
