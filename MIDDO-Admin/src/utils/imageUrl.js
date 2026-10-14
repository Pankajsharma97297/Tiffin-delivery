import {API_BASE_URL} from '../api/adminApi';

const UPLOADS_ROUTE = '/uploads';
const PROFILE_UPLOAD_ROUTE = '/profile';

export function resolveImageUri(value) {
  const imagePath = String(value || '').trim();

  if (!imagePath) {
    return '';
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  if (imagePath.startsWith(`${UPLOADS_ROUTE}/`)) {
    return `${API_BASE_URL}${imagePath}`;
  }

  if (imagePath.startsWith(`${PROFILE_UPLOAD_ROUTE}/`)) {
    return `${API_BASE_URL}${UPLOADS_ROUTE}${imagePath}`;
  }

  return '';
}
