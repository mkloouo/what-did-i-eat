import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

// Asks for camera permission, opens the camera, and hands the captured photo
// URIs to `onPhotos`. Denied permission shows an alert; a cancelled capture
// never calls `onPhotos`.
export async function takePhoto(
  onPhotos: (uris: string[]) => void | Promise<void>,
): Promise<void> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Camera unavailable", "Camera permission was denied.");
    return;
  }
  const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
  if (!result.canceled) {
    await onPhotos(result.assets.map((a) => a.uri));
  }
}
