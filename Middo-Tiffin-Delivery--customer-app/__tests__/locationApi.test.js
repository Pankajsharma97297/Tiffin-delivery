import Geolocation from 'react-native-geolocation-service';
import { NativeModules } from 'react-native';
import {
  getCurrentCoordinates,
  reverseGeocode,
} from '../src/services/locationApi';

describe('getCurrentCoordinates', () => {
  const originalLocationModule = NativeModules.RNFusedLocation;

  beforeEach(() => {
    Geolocation.getCurrentPosition.mockReset();
    Geolocation.requestAuthorization.mockResolvedValue('granted');
    NativeModules.RNFusedLocation = {};
  });

  describe('reverseGeocode', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('returns the human-readable location name from the geocoder', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            display_name: 'Connaught Place, New Delhi, Delhi, India',
          }),
      });

      await expect(reverseGeocode(28.6315, 77.2167)).resolves.toBe(
        'Connaught Place, New Delhi, Delhi, India',
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('addressdetails=1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'MIDDO-Customer-App/1.0',
          }),
        }),
      );
    });

    test('does not return coordinates when the geocoder has no readable name', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(reverseGeocode(28.6315, 77.2167)).rejects.toThrow(
        'Could not find a location name',
      );
    });

    test('reports geocoding request failures', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 503,
      });

      await expect(reverseGeocode(28.6315, 77.2167)).rejects.toThrow(
        'HTTP 503',
      );
    });
  });

  afterAll(() => {
    if (originalLocationModule === undefined) {
      delete NativeModules.RNFusedLocation;
    } else {
      NativeModules.RNFusedLocation = originalLocationModule;
    }
  });

  test('returns coordinates from the native location provider', async () => {
    Geolocation.getCurrentPosition.mockImplementation(success =>
      success({ coords: { latitude: 28.6, longitude: 77.2 } }),
    );

    await expect(getCurrentCoordinates()).resolves.toEqual({
      latitude: 28.6,
      longitude: 77.2,
    });
    expect(Geolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({
        enableHighAccuracy: true,
        showLocationDialog: true,
      }),
    );
  });

  test('rejects when the native provider cannot get a location', async () => {
    Geolocation.getCurrentPosition.mockImplementation(
      (success, failure) => failure({ message: 'Location is unavailable' }),
    );

    await expect(getCurrentCoordinates()).rejects.toThrow(
      'Location is unavailable',
    );
  });

  test('does not request coordinates when iOS location permission is denied', async () => {
    Geolocation.requestAuthorization.mockResolvedValue('denied');

    await expect(getCurrentCoordinates()).resolves.toEqual({
      permissionDenied: true,
    });
    expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  test('explains when the installed app build has no native location module', async () => {
    delete NativeModules.RNFusedLocation;

    await expect(getCurrentCoordinates()).rejects.toThrow(
      'Location support is missing from this app build.',
    );
    expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });
});
