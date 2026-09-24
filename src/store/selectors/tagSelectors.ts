import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../rootState";

const selectTagsById = (state: RootState) => state.tags;

export const selectAllTags = createSelector([selectTagsById], (tagsById) =>
  Object.values(tagsById),
);
