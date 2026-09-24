import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TimelineView } from "../types/models";

export type AppMetaState = {
  hasSeededDefaultTags: boolean;
  // Home's Wall/Days toggle. Not a Settings row (the spec keeps Settings at
  // exactly five), so it lives here like other persisted UI state that
  // isn't a real user-facing setting.
  timelineView: TimelineView;
};

const initialState: AppMetaState = {
  hasSeededDefaultTags: false,
  timelineView: "wall",
};

const appMetaSlice = createSlice({
  name: "appMeta",
  initialState,
  reducers: {
    markDefaultTagsSeeded(state) {
      state.hasSeededDefaultTags = true;
    },
    setTimelineView(state, action: PayloadAction<TimelineView>) {
      state.timelineView = action.payload;
    },
  },
});

export const { markDefaultTagsSeeded, setTimelineView } =
  appMetaSlice.actions;
export default appMetaSlice.reducer;
