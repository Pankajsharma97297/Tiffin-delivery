import {
  PROFILE_UPLOAD_ROUTE,
  UPLOADS_BASE_URL,
  UPLOADS_ROUTE,
} from '../config/uploads';

export const resolveImageUri = value => {
  const imagePath = String(value || '').trim();

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  if (imagePath.startsWith(`${UPLOADS_ROUTE}/`)) {
    return `${UPLOADS_BASE_URL}${imagePath.slice(UPLOADS_ROUTE.length)}`;
  }

  if (imagePath.startsWith(`${PROFILE_UPLOAD_ROUTE}/`)) {
    return `${UPLOADS_BASE_URL}${imagePath}`;
  }

  return '';
};
