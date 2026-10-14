import { API_BASE_URL } from '../config/api';
import { authFetch, getAuthSession, saveAuthSession } from './authSession';
import { getAvatarForProfileSave } from '../utils/avatar';

// Profile save hone ke baad session bhi update hota hai,
// taaki app ke baaki screens latest customer data use karein.
export async function updateCustomerProfile(profile) {
  const profilePayload = {
    ...profile,
    avatar: getAvatarForProfileSave(profile?.avatar),
  };
  const response = await authFetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profilePayload),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to update profile');
  }
  const customer = data.customer || data.data?.customer;
  const user = data.user || data.data?.user;
  const currentSession = await getAuthSession();

  if (currentSession) {
    await saveAuthSession({
      ...currentSession,
      ...(user ? { user } : {}),
      ...(customer ? { customer } : {}),
    });
  }

  return customer;
}
export async function uploadProfileImage(input) {
  if (!input?.uri) {
    throw new Error('Image file URI is required');
  }

  const body = new FormData();

  // Backend multer route field name: image
  body.append('image', {
    uri: input.uri,
    name: input.fileName || 'profile-image.jpg',
    type: input.mimeType || 'image/jpeg',
  });

  const response = await authFetch(
    `${API_BASE_URL}/api/uploads/profile-image`,
    {
      method: 'POST',
      body,
    },
  );
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to upload profile image');
  }
  return data.url || data.data?.url;
}
