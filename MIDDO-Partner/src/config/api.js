import { Platform } from 'react-native';
import { getEnv } from './env';

const localApiBaseUrl =
  Platform.OS === 'android'
    ? 'http://10.219.226.201:3000'
    : 'http://10.219.226.201:3000';

const configuredApiBaseUrl =
  getEnv('MIDDO_PARTNER_API_BASE_URL') ||
  getEnv('MIDDO_API_BASE_URL') ||
  getEnv('REACT_NATIVE_MIDDO_API_BASE_URL') ||
  localApiBaseUrl;

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, '');
