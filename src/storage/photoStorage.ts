import * as FileSystem from 'expo-file-system/legacy';

const PHOTOS_SUBDIR = 'photos/';

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
 * across reinstalls/updates.
 */
export function resolvePhotoUri(relativePath: string): string {
  return `${FileSystem.documentDirectory}${relativePath}`;
}

export async function savePickedPhoto(sourceUri: string, id: string): Promise<string> {
  await ensurePhotosDir();
  const relativePath = `${PHOTOS_SUBDIR}${id}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: resolvePhotoUri(relativePath) });
  return relativePath;
}

export async function deletePhotoFile(relativePath: string): Promise<void> {
  const absoluteUri = resolvePhotoUri(relativePath);
  const info = await FileSystem.getInfoAsync(absoluteUri);
  if (info.exists) {
    await FileSystem.deleteAsync(absoluteUri, { idempotent: true });
  }
}
