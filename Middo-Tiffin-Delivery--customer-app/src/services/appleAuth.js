import { Platform } from 'react-native';
import appleAuth from '@invertase/react-native-apple-authentication';
import {
  getAuth,
  OAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { syncFirebaseTokenWithBackend } from './firebaseAuth';

export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple sign-in is available only on iOS.');
  }

  if (!appleAuth.isSupported) {
    throw new Error('Apple sign-in is not supported on this device.');
  }

  const credential = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
  });

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token.');
  }

  const fullName = [
    credential.fullName?.givenName,
    credential.fullName?.familyName,
  ]
    .filter(Boolean)
    .join(' ');

  const firebaseCredential = new OAuthProvider('apple.com').credential({
    idToken: credential.identityToken,
    rawNonce: credential.nonce,
  });
  const firebaseUserCredential = await signInWithCredential(
    getAuth(),
    firebaseCredential,
  );
  const session = await syncFirebaseTokenWithBackend(
    firebaseUserCredential.user,
    {
      appleId: credential.user,
      email: credential.email,
      name: fullName,
    },
  );

  return { type: 'success', user: firebaseUserCredential.user, session };
}
