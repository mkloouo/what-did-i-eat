import { EntriesState } from "./entriesSlice";
import { TagsState } from "./tagsSlice";
import { AppMetaState } from "./appMetaSlice";
import { Settings } from "../types/models";

export type RootState = {
  entries: EntriesState;
  settings: Settings;
  tags: TagsState;
  appMeta: AppMetaState;
};
