import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'middo.auth.session';

let currentSession = null;

// Backend login ke baad token + user/customer data yahan save hota hai.
// AsyncStorage app restart ke baad bhi session ko available rakhta hai.
export async function saveAuthSession(session) {
  currentSession = session || null;
  if (session) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
  return currentSession;
}

export async function getAuthSession() {
  if (currentSession) {
    return currentSession;
  }

  const stored = await AsyncStorage.getItem(SESSION_KEY);
  currentSession = stored ? JSON.parse(stored) : null;
  return currentSession;
}

export async function clearAuthSession() {
  currentSession = null;
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function getAuthHeaders() {
  const session = await getAuthSession();
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
}

// Protected API call ke liye normal fetch ka wrapper.
// Ye automatically Authorization header add karta hai.
export async function authFetch(url, options = {}) {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  });
}
