import * as Location from 'expo-location';
import { EntryLocation } from '../types/models';

const POSITION_TIMEOUT_MS = 8000;

export async function captureCurrentLocation(): Promise<EntryLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    // A cold GPS fix can hang indefinitely; race it against a timeout so a
    // slow/unavailable fix never blocks saving an entry. The timeout is
    // cleared as soon as the race settles so it never outlives this call.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => resolve(null), POSITION_TIMEOUT_MS);
    });

    let position: Location.LocationObject | null;
    try {
      position = await Promise.race([Location.getCurrentPositionAsync({}), timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!position) {
      return null;
    }

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
