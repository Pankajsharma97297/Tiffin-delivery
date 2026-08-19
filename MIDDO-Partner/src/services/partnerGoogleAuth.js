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
import { syncPartnerFirebaseTokenWithBackend } from './partnerFirebaseAuth';

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
    if (error.code === 'DEVELOPER_ERROR') {
      return 'Google login is not configured yet. Add Android OAuth for com.cws.middopartner with the debug SHA-1, then set the Web client ID.';
    }

    if (error.code === statusCodes.IN_PROGRESS) {
      return 'Google sign-in is already in progress.';
    }

    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'Google Play Services is not available or needs an update.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Google sign-in failed. Please try again.';
}

export async function signInPartnerWithGoogle(role) {
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
    const session = await syncPartnerFirebaseTokenWithBackend(
      firebaseUserCredential.user,
      {
        role,
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

export async function signOutPartnerFromGoogle() {
  configureGoogleSignIn();

  await Promise.allSettled([
    GoogleSignin.revokeAccess(),
    GoogleSignin.signOut(),
    getAuth().signOut(),
  ]);
}
