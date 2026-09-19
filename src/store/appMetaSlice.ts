import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TimelineView } from "../types/models";

export type AppMetaState = {
  hasSeededDefaultTags: boolean;
  // Wall's day scrubber. Not a Settings row (the spec keeps Settings at
  // exactly five), so it lives here like other persisted UI state that
  // isn't a real user-facing setting.
  scrubberEnabled: boolean;
  // Home's Wall/Days toggle — same reasoning as scrubberEnabled above.
  timelineView: TimelineView;
};

const initialState: AppMetaState = {
  hasSeededDefaultTags: false,
  scrubberEnabled: true,
  timelineView: "wall",
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
    setTimelineView(state, action: PayloadAction<TimelineView>) {
      state.timelineView = action.payload;
    },
  },
});

export const { markDefaultTagsSeeded, setScrubberEnabled, setTimelineView } =
  appMetaSlice.actions;
export default appMetaSlice.reducer;
