import * as Location from 'expo-location';
import { EntryLocation } from '../types/models';

export async function captureCurrentLocation(): Promise<EntryLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = position.coords;

    let placeName: string | null = null;
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = results[0];
      if (place) {
        placeName = [place.street, place.city].filter(Boolean).join(', ') || null;
      }
    } catch {
      placeName = null;
    }

    return { latitude, longitude, placeName };
  } catch {
    return null;
  }
}
