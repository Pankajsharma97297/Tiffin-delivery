import { API_BASE_URL } from '../config/api';
import { getAvatarForProfileSave } from '../utils/avatar';
import { getPartnerSession, loadPartnerSession, partnerRequest, savePartnerSession } from './partnerSession';

async function getSessionForUpload() {
  return getPartnerSession() || await loadPartnerSession();
}

async function syncPartnerSession(profile, user) {
  const currentSession = await getSessionForUpload();

  if (!currentSession) {
    return;
  }

  await savePartnerSession({
    ...currentSession,
    ...(user ? { user } : {}),
    ...(profile ? { profile } : {}),
  });
}

export async function fetchPartnerProfile() {
  const payload = await partnerRequest('/api/delivery-partner/profile');
  const profile = payload.profile || payload.data?.profile || {};
  await syncPartnerSession(profile, payload.user || payload.data?.user);
  return profile;
}

export async function updatePartnerProfile(profile) {
  const payload = await partnerRequest('/api/delivery-partner/profile', {
    method: 'PATCH',
    body: {
      ...profile,
      avatar: getAvatarForProfileSave(profile?.avatar),
    },
  });
  const updatedProfile = payload.profile || payload.data?.profile || {};
  await syncPartnerSession(updatedProfile, payload.user || payload.data?.user);
  return updatedProfile;
}

export async function updatePartnerKycDocuments(documents) {
  const payload = await partnerRequest('/api/delivery-partner/profile/kyc', {
    method: 'PATCH',
    body: {
      documents: Array.isArray(documents) ? documents : [],
    },
  });
  const updatedProfile = payload.profile || payload.data?.profile || {};
  await syncPartnerSession(updatedProfile, payload.user || payload.data?.user);
  return updatedProfile;
}

export async function updatePartnerAvailability({ isOnline, kitchenOpen, role } = {}) {
  const body = { role };
  if (typeof isOnline === 'boolean') {
    body.isOnline = isOnline;
  }
  if (typeof kitchenOpen === 'boolean') {
    body.kitchenOpen = kitchenOpen;
  }

  const payload = await partnerRequest('/api/delivery-partner/profile/availability', {
    method: 'PATCH',
    body,
  });
  const updatedProfile = payload.profile || payload.data?.profile || {};
  await syncPartnerSession(updatedProfile, payload.user || payload.data?.user);
  return updatedProfile;
}

export async function fetchHomeChefMenu() {
  const payload = await partnerRequest('/api/delivery-partner/profile/menu');
  return {
    photos: payload.photos || payload.data?.photos || [],
    sampleMenu: payload.sampleMenu || payload.data?.sampleMenu || [],
    weeklyMenu: payload.weeklyMenu || payload.data?.weeklyMenu || [],
  };
}

export async function updateHomeChefMenu(menu) {
  const payload = await partnerRequest('/api/delivery-partner/profile/menu', {
    method: 'PATCH',
    body: {
      sampleMenu: menu?.sampleMenu || [],
      weeklyMenu: menu?.weeklyMenu || [],
    },
  });
  return {
    photos: payload.photos || payload.data?.photos || [],
    sampleMenu: payload.sampleMenu || payload.data?.sampleMenu || [],
    weeklyMenu: payload.weeklyMenu || payload.data?.weeklyMenu || [],
  };
}

export async function fetchHomeChefPhotos() {
  const payload = await partnerRequest('/api/delivery-partner/profile/photos');
  return payload.photos || payload.data?.photos || [];
}

export async function updateHomeChefPhotos(photos) {
  const payload = await partnerRequest('/api/delivery-partner/profile/photos', {
    method: 'PATCH',
    body: {
      photos: Array.isArray(photos) ? photos : [],
    },
  });
  return payload.photos || payload.data?.photos || [];
}

export async function uploadPartnerProfileImage(input) {
  if (!input?.uri) {
    throw new Error('Image file URI is required');
  }

  const session = await getSessionForUpload();
  const body = new FormData();

  body.append('image', {
    uri: input.uri,
    name: input.fileName || 'profile-image.jpg',
    type: input.mimeType || 'image/jpeg',
  });

  const response = await fetch(`${API_BASE_URL}/api/uploads/profile-image`, {
    method: 'POST',
    headers: {
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body,
  });
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Unable to upload profile image');
  }

  return data.url || data.data?.url;
}
