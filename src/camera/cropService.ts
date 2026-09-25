import ImageCropPicker from "react-native-image-crop-picker";
import { savePickedPhoto, resolvePhotoUri } from "../storage/photoStorage";
import { generateId } from "../utils/id";
import { Photo } from "../types/models";
import { theme } from "../theme/theme";

const CROP_SIZE = 1440;

// Opens the native square cropper on `photo` and saves the result as a new
// photo file (a new id, so the image cache never shows the uncropped version
// under the same path). Returns null if the user cancelled. The caller owns
// swapping the new photo in and deleting the old file.
export async function cropPhotoSquare(photo: Photo): Promise<Photo | null> {
  let croppedPath: string;
  try {
    const result = await ImageCropPicker.openCropper({
      path: resolvePhotoUri(photo.uri),
      width: CROP_SIZE,
      height: CROP_SIZE,
      mediaType: "photo",
      compressImageQuality: 0.8,
      cropperToolbarTitle: "Crop photo",
      cropperToolbarColor: theme.colors.ink,
      cropperToolbarWidgetColor: theme.colors.daylight,
      cropperActiveWidgetColor: theme.colors.pine,
      cropperStatusBarLight: false,
      cropperChooseText: "Done",
      cropperChooseColor: theme.colors.pine,
    });
    croppedPath = result.path;
  } catch (error) {
    if ((error as { code?: string }).code === "E_PICKER_CANCELLED") {
      return null;
    }
    throw error;
  }

  // The cropper returns a bare filesystem path on iOS; FileSystem needs a URI.
  const croppedUri = croppedPath.includes("://")
    ? croppedPath
    : `file://${croppedPath}`;
  const id = generateId();
  const uri = await savePickedPhoto(croppedUri, id);
  ImageCropPicker.cleanSingle(croppedPath).catch(() => {
    // Best-effort cleanup of the cropper's temp file; the OS clears tmp anyway.
  });
  return { id, uri };
}
