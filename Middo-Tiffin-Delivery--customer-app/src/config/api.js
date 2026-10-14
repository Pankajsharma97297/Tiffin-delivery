import { Platform } from 'react-native';
import { getEnv } from './env';

const localApiBaseUrl =
  Platform.OS === 'android'
    ? 'http://10.76.146.201:3002'
    : 'http://162.240.223.89:3002';

const configuredApiBaseUrl =
  getEnv('MIDDO_API_BASE_URL') ||
  getEnv('REACT_NATIVE_MIDDO_API_BASE_URL') ||
  localApiBaseUrl;

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, '');
