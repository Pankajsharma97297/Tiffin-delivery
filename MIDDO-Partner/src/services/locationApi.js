import { PermissionsAndroid, Platform } from 'react-native';
import { getNativeModule } from './nativeModules';

const currentLocation = getNativeModule('CurrentLocation');

async function requestLocationPermission() {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission, {
    title: 'Allow location access',
    message: 'MIDDO Partner needs your location to save your current service address.',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getCurrentCoordinates() {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    return { permissionDenied: true };
  }

  try {
    if (currentLocation?.getCurrentLocation) {
      const coords = await currentLocation.getCurrentLocation();
      return {
        accuracy: coords.accuracy,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to fetch current location',
    };
  }

  return {};
}

export async function reverseGeocode(latitude, longitude) {
  if (latitude == null || longitude == null) {
    return '';
  }

  try {
    const query = new URLSearchParams({
      format: 'jsonv2',
      lat: String(latitude),
      lon: String(longitude),
      addressdetails: '1',
      'accept-language': 'en',
    }).toString();
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${query}`,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en',
          'User-Agent': 'MIDDO-Partner/1.0 (location lookup)',
        },
      },
    );
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status ${response.status}`);
    }
    const data = await response.json();
    return (
      data.display_name ||
      [data.address?.road, data.address?.suburb, data.address?.city || data.address?.town || data.address?.village]
        .filter(Boolean)
        .join(', ') ||
      `Live location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    );
  } catch {
    return `Live location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}
