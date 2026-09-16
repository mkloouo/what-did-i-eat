import * as Location from 'expo-location';
import { captureCurrentLocation } from './locationService';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

describe('captureCurrentLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when permission is denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const result = await captureCurrentLocation();

    expect(result).toBeNull();
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('returns coordinates and a place name on success', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 50.06, longitude: 19.94 },
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
      { street: 'Main St', city: 'Krakow' },
    ]);

    const result = await captureCurrentLocation();

    expect(result).toEqual({
      latitude: 50.06,
      longitude: 19.94,
      placeName: 'Main St, Krakow',
    });
  });

  it('falls back to a null place name when reverse geocoding fails', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 50.06, longitude: 19.94 },
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockRejectedValue(new Error('offline'));

    const result = await captureCurrentLocation();

    expect(result).toEqual({ latitude: 50.06, longitude: 19.94, placeName: null });
  });

  it('returns null if getting the position throws', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error('gps off'));

    const result = await captureCurrentLocation();

    expect(result).toBeNull();
  });
});
