import * as ImagePicker from "expo-image-picker";
import type { AppDispatch } from "../store/store";
import type { RootState } from "../store/rootState";
import { addEntry, clearEntries } from "../store/entriesSlice";
import { deletePhotoFile, savePickedPhoto } from "../storage/photoStorage";
import { generateId } from "../utils/id";
import { buildDemoScenario } from "./demoScenario";

// Dev-only helpers behind the hidden menu on the empty Home screen.

async function deleteAllPhotoFiles(state: RootState): Promise<void> {
  const uris = Object.values(state.entries).flatMap((entry) =>
    entry.photos.map((photo) => photo.uri),
  );
  await Promise.allSettled(uris.map(deletePhotoFile));
}

export function clearAllEntries() {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    await deleteAllPhotoFiles(getState());
    dispatch(clearEntries());
  };
}

/**
 * Asks for sample photos, then replaces every entry with a few days of
 * demo entries built from them. Resolves to the number of entries created
 * (0 when the picker is cancelled).
 */
export function loadDemoData() {
  return async (
    dispatch: AppDispatch,
    getState: () => RootState,
  ): Promise<number> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 0,
      orderedSelection: true,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return 0;

    const photos = await Promise.all(
      result.assets.map(async (asset) => {
        const id = generateId();
        return { id, uri: await savePickedPhoto(asset.uri, id) };
      }),
    );
    const plans = buildDemoScenario(
      result.assets.map((asset) => asset.fileName ?? null),
      new Date(),
    );

    await deleteAllPhotoFiles(getState());
    dispatch(clearEntries());

    const tagIdByLabel = new Map(
      Object.values(getState().tags).map((tag) => [tag.label, tag.id]),
    );
    plans.forEach((plan) =>
      dispatch(
        addEntry({
          id: generateId(),
          createdAt: plan.createdAt.toISOString(),
          comment: plan.comment,
          location: plan.location,
          photos: plan.photoIndexes.map((index) => photos[index]),
          tagIds: plan.tagLabels.flatMap((label) => {
            const id = tagIdByLabel.get(label);
            return id ? [id] : [];
          }),
        }),
      ),
    );
    return plans.length;
  };
}
