import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'middo.partner.auth.session';

let currentSession = null;

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {
      success: false,
      message: 'Backend returned an invalid response',
    };
  }
}

export function getPartnerSession() {
  return currentSession;
}

export async function loadPartnerSession() {
  if (currentSession) {
    return currentSession;
  }

  const stored = await AsyncStorage.getItem(SESSION_KEY);
  currentSession = stored ? JSON.parse(stored) : null;
  return currentSession;
}

export async function savePartnerSession(session) {
  currentSession = session || null;

  if (currentSession) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }

  return currentSession;
}

export async function clearPartnerSession() {
  currentSession = null;
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function loginPartner({
  email = 'homechefs@middo.com',
  password = 'password123',
} = {}) {
  const response = await fetch(`${API_BASE_URL}/api/delivery-partner/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const payload = await readJsonResponse(response);

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Partner login failed');
  }

  return savePartnerSession({
    token: payload.token,
    user: payload.user,
  });
}

export async function partnerRequest(path, { body, method = 'GET' } = {}) {
  const session = currentSession || await loadPartnerSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await readJsonResponse(response);

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Partner request failed');
  }

  return payload;
}
