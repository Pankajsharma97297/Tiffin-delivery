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
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    );
    const data = await response.json();
    return (
      data.display_name ||
      `Live location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    );
  } catch {
    return `Live location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}
