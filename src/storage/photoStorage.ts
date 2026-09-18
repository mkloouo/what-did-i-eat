import * as FileSystem from "expo-file-system/legacy";

const PHOTOS_SUBDIR = "photos/";

function photosDirUri(): string {
  return `${FileSystem.documentDirectory}${PHOTOS_SUBDIR}`;
}

async function ensurePhotosDir(): Promise<void> {
  const dir = photosDirUri();
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

/**
 * Resolves a relative photo path (as stored in Redux) to an absolute URI
 * usable by <Image>/ImageViewing. Computed fresh from the current
 * documentDirectory so it survives the app's container path changing
 * across reinstalls/updates. Entries saved before paths became relative
 * still hold a full URI (with a scheme, e.g. "file://") — pass those
 * through unchanged instead of double-prefixing them.
 */
export function resolvePhotoUri(path: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) {
    return path;
  }
  return `${FileSystem.documentDirectory}${path}`;
}

export async function savePickedPhoto(
  sourceUri: string,
  id: string,
): Promise<string> {
  await ensurePhotosDir();
  const relativePath = `${PHOTOS_SUBDIR}${id}.jpg`;
  await FileSystem.copyAsync({
    from: sourceUri,
    to: resolvePhotoUri(relativePath),
  });
  return relativePath;
}

export async function deletePhotoFile(relativePath: string): Promise<void> {
  const absoluteUri = resolvePhotoUri(relativePath);
  const info = await FileSystem.getInfoAsync(absoluteUri);
  if (info.exists) {
    await FileSystem.deleteAsync(absoluteUri, { idempotent: true });
  }
}
