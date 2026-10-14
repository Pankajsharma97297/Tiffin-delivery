import {
  getAuth,
  signInWithPhoneNumber,
  updateProfile,
} from '@react-native-firebase/auth';
import { API_BASE_URL } from '../config/api';
import { saveAuthSession } from './authSession';

async function parseAuthResponse(response, fallbackMessage) {
  let data = {};

  try {
    data = await response.json();
  } catch {
    throw new Error('MIDDO backend returned an invalid auth response.');
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || fallbackMessage);
  }

  return data.data || data;
}

export async function syncFirebaseTokenWithBackend(firebaseUser, profile = {}) {
  const displayName = String(profile.name || '').trim();
  const photoURL = profile.photoURL || profile.avatar || '';

  if (
    (displayName && firebaseUser.displayName !== displayName) ||
    (photoURL && firebaseUser.photoURL !== photoURL)
  ) {
    await updateProfile(firebaseUser, {
      ...(displayName ? { displayName } : {}),
      ...(photoURL ? { photoURL } : {}),
    });
  }

  const idToken = await firebaseUser.getIdToken(true);
  const response = await fetch(`${API_BASE_URL}/api/auth/firebase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken, profile }),
  });
  const session = await parseAuthResponse(
    response,
    'Unable to sync Firebase session.',
  );
  await saveAuthSession(session);
  return session;
}

export async function startPhoneOtp({ dialCode = '+91', phone }) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const cleanDialCode = String(dialCode || '+91').trim();

  if (!cleanPhone) {
    throw new Error('Enter a valid phone number.');
  }

  const e164Phone = `${cleanDialCode}${cleanPhone}`;
  const firebaseConfirmation = await signInWithPhoneNumber(
    getAuth(),
    e164Phone,
  );

  return {
    dialCode: cleanDialCode,
    e164Phone,
    firebaseConfirmation,
    phone: cleanPhone,
  };
}

export async function confirmPhoneOtp(confirmation, otp) {
  if (!confirmation?.firebaseConfirmation) {
    throw new Error('OTP session expired. Please request a new code.');
  }

  const credential = await confirmation.firebaseConfirmation.confirm(otp);

  if (!credential?.user) {
    throw new Error('Firebase did not return a signed-in phone user.');
  }

  return syncFirebaseTokenWithBackend(credential.user, {
    phone: confirmation.e164Phone,
    displayPhone: `${confirmation.dialCode} ${confirmation.phone}`.trim(),
  });
}

export function getFirebaseAuthErrorMessage(error, fallbackMessage) {
  const code = error?.code || '';

  if (code.includes('invalid-phone-number')) {
    return 'Phone number format is invalid. Please check country code and number.';
  }

  if (code.includes('too-many-requests')) {
    return 'Too many OTP requests. Please wait and try again.';
  }

  if (code.includes('invalid-verification-code')) {
    return 'Invalid OTP. Please check the code and try again.';
  }

  if (code.includes('session-expired')) {
    return 'OTP expired. Please request a new code.';
  }

  if (code.includes('app-not-authorized')) {
    return 'Firebase Auth is not configured for this app. Check package name, SHA fingerprints, and google-services.json.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export async function syncFirebaseUserWithBackend(user) {
  return saveAuthSession({
    token: user?.token || '',
    user,
    customer: user?.customer,
  });
}
