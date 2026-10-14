import { PROFILE_UPLOAD_ROUTE } from '../config/uploads';
import { resolveImageUri } from './imageUrl';

export const isUploadedAvatarPath = value =>
  String(value || '').startsWith(`${PROFILE_UPLOAD_ROUTE}/`);

export const getAvatarForProfileSave = value =>
  isUploadedAvatarPath(value) ? String(value).trim() : '';

export const getAvatarImageUri = value =>
  isUploadedAvatarPath(value) ? resolveImageUri(value) : '';

export const getAvatarPreviewUri = value => {
  const avatar = String(value || '').trim();

  if (avatar.startsWith('content://') || avatar.startsWith('file://')) {
    return avatar;
  }

  return getAvatarImageUri(avatar);
};
