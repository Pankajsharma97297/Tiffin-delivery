/* eslint-env jest */

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ type: 'cancelled', data: null })),
  },
  isErrorWithCode: jest.fn(() => false),
  statusCodes: {
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: {
    credential: jest.fn(() => ({ providerId: 'google.com' })),
  },
  signInWithCredential: jest.fn(() =>
    Promise.resolve({
      user: {
        getIdToken: jest.fn(() => Promise.resolve('firebase-id-token')),
      },
    }),
  ),
  signInWithPhoneNumber: jest.fn(() =>
    Promise.resolve({
      confirm: jest.fn(() =>
        Promise.resolve({
          user: {
            getIdToken: jest.fn(() => Promise.resolve('firebase-id-token')),
          },
        }),
      ),
    }),
  ),
}));

const asyncStorage = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(key => Promise.resolve(asyncStorage[key] || null)),
    removeItem: jest.fn(key => {
      delete asyncStorage[key];
      return Promise.resolve();
    }),
    setItem: jest.fn((key, value) => {
      asyncStorage[key] = value;
      return Promise.resolve();
    }),
  },
}));

jest.mock('react-native-razorpay', () => ({
  __esModule: true,
  default: {
    open: jest.fn(() =>
      Promise.resolve({ razorpay_payment_id: 'pay_test_123' }),
    ),
  },
}));

jest.mock('react-native-geolocation-service', () => ({
  __esModule: true,
  default: {
    getCurrentPosition: jest.fn(),
    requestAuthorization: jest.fn(() => Promise.resolve('granted')),
  },
}));
