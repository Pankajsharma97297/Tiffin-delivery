import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import { googleAuthConfig } from '../config/googleAuth';
import { syncFirebaseTokenWithBackend } from './firebaseAuth';

let configured = false;

function configureGoogleSignIn() {
  if (configured) {
    return;
  }

  GoogleSignin.configure({
    scopes: googleAuthConfig.scopes,
    webClientId: googleAuthConfig.webClientId || undefined,
    iosClientId: googleAuthConfig.iosClientId || undefined,
  });

  configured = true;
}

async function signInGoogleUserWithFirebase(googleUser) {
  const tokens = await GoogleSignin.getTokens();
  const idToken = googleUser.idToken || tokens.idToken;
  const accessToken = tokens.accessToken || '';

  if (!idToken) {
    throw new Error('Google ID token is missing. Please check OAuth client IDs.');
  }

  const firebaseCredential = accessToken
    ? GoogleAuthProvider.credential(idToken, accessToken)
    : GoogleAuthProvider.credential(idToken);

  return signInWithCredential(getAuth(), firebaseCredential);
}

function getGoogleSignInErrorMessage(error) {
  if (isErrorWithCode(error)) {
    const nativeDetails = [error.code, error.message]
      .filter(Boolean)
      .join(': ');

    if (error.code === 'DEVELOPER_ERROR') {
      return `Google login is not configured yet. Verify the Android OAuth client for com.cws.tiffinapp and this app signing SHA-1 in Firebase/Google Cloud. ${nativeDetails}`;
    }

    if (error.code === statusCodes.IN_PROGRESS) {
      return `Google sign-in is already in progress. ${nativeDetails}`;
    }

    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return `Google Play Services is not available or needs an update. ${nativeDetails}`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Google sign-in failed. Please try again.';
}

export async function signInWithGoogle() {
  configureGoogleSignIn();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  try {
    const response = await GoogleSignin.signIn();

    if (response.type === 'cancelled') {
      return { type: 'cancelled' };
    }

    const firebaseUserCredential = await signInGoogleUserWithFirebase(
      response.data,
    );
    const googleProfile = response.data.user || {};
    const session = await syncFirebaseTokenWithBackend(
      firebaseUserCredential.user,
      {
        email: googleProfile.email,
        name: googleProfile.name,
        photoURL: googleProfile.photo,
      },
    );

    return {
      type: 'success',
      user: firebaseUserCredential.user,
      googleUser: response.data,
      session,
    };
  } catch (error) {
    throw new Error(getGoogleSignInErrorMessage(error));
  }
}
