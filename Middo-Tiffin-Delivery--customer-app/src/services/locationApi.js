import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { API_BASE_URL } from '../config/api';
import { authFetch } from './authSession';

function ensureLocationModuleAvailable() {
  if (!NativeModules.RNFusedLocation) {
    throw new Error(
      'Location support is missing from this app build. Install the latest app update and try again.',
    );
  }
}

async function requestLocationPermission() {
  ensureLocationModuleAvailable();
  if (Platform.OS === 'ios') {
    const status = await Geolocation.requestAuthorization('whenInUse');
    return status === 'granted';
  }
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
    message: 'MIDDO needs your location to save your delivery address.',
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
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error =>
        reject(
          new Error(error.message || 'Unable to get current location.'),
        ),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
        showLocationDialog: true,
        forceRequestLocation: true,
      },
    );
  });
}
export async function reverseGeocode(latitude, longitude) {
  if (latitude == null || longitude == null) {
    throw new Error('Location coordinates are required to find the address.');
  }
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${latitude}&lon=${longitude}`,
    {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'MIDDO-Customer-App/1.0',
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Unable to look up the location name (HTTP ${response.status}). Please try again.`,
    );
  }
  const data = await response.json();
  const locationName =
    typeof data.display_name === 'string' ? data.display_name.trim() : '';
  if (!locationName) {
    throw new Error(
      'Could not find a location name for this spot. Please try again.',
    );
  }
  return locationName;
}
export async function saveLoginLocation(input) {
  const coords = await getCurrentCoordinates();
  const liveAddress = await reverseGeocode(coords.latitude, coords.longitude);
  const response = await authFetch(`${API_BASE_URL}/api/auth/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...input,
      address: liveAddress,
      liveAddress,
      latitude: coords.latitude,
      longitude: coords.longitude,
    }),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to save login location');
  }
  return data.data || data;
}
