# MIDDO Customer App

MIDDO Customer App is the React Native mobile experience for customers ordering home-style tiffin meals, managing subscriptions, tracking deliveries, topping up wallet balance, and updating profile settings.

## Features

- Onboarding and role selection
- Customer login, OTP verification flow, and Google Sign-In
- Home dashboard with meals, nearby HomeChefs, categories, and active order tracking
- Trial meal ordering, subscription plans, wallet top-up, and Razorpay integration
- Profile, settings, saved addresses, help center, WhatsApp support, and AI chat screens
- Splash screen with internet check, offline retry state, and smooth loading progress
- Vendor and rider dashboard preview screens

## Tech Stack

- React Native 0.86
- React 19
- JavaScript / JSX
- React Native Safe Area Context
- Google Sign-In
- Razorpay checkout
- Jest and React Test Renderer
- ESLint and Prettier

## Installation

```sh
npm install
```

For iOS, install CocoaPods dependencies:

```sh
bundle install
bundle exec pod install --project-directory=ios
```

## Environment Variables

The app reads runtime values from environment variables when they are injected by Metro or your build pipeline. Defaults are kept for local development.

| Variable                          | Description                                 | Default                                                          |
| --------------------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| `MIDDO_API_BASE_URL`              | Backend API base URL                        | Android: `http://192.168.1.5:3000`, iOS: `http://localhost:3000` |
| `REACT_NATIVE_MIDDO_API_BASE_URL` | Alternate API base URL key                  | Empty                                                            |
| `MIDDO_RAZORPAY_KEY_ID`           | Razorpay key ID                             | Test key fallback                                                |
| `MIDDO_USE_NATIVE_CHECKOUT`       | Set `true` to open native Razorpay checkout | `false`                                                          |
| `MIDDO_GOOGLE_WEB_CLIENT_ID`      | Google OAuth web client ID                  | Existing development client ID                                   |
| `MIDDO_GOOGLE_IOS_CLIENT_ID`      | Google OAuth iOS client ID                  | Empty                                                            |

## Running Locally

Start Metro:

```sh
npm start
```

Run Android:

```sh
npm run android
```

Run iOS:

```sh
npm run ios
```

## Production Build

Android release builds are produced from the native Android project:

```sh
cd android
./gradlew assembleRelease
```

Release signing must be configured before building. Set these values in `android/gradle.properties` on each developer machine, or as CI environment variables:

```properties
MIDDO_RELEASE_STORE_FILE=/absolute/path/to/middo-release.keystore
MIDDO_RELEASE_STORE_PASSWORD=change-me
MIDDO_RELEASE_KEY_ALIAS=middo-release
MIDDO_RELEASE_KEY_PASSWORD=change-me
```

Generate the release keystore once, store it in a secure shared vault, and reuse that same keystore for every release build:

```sh
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore middo-release.keystore \
  -alias middo-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Get the Firebase SHA fingerprints for the release keystore:

```sh
keytool -list -v \
  -keystore middo-release.keystore \
  -alias middo-release
```

For iOS, create an archive from Xcode after configuring signing, bundle identifiers, OAuth URL schemes, and production API variables.

## Deployment

- Configure production backend URL and payment keys in your build pipeline.
- Add Android debug, release, and Play App Signing SHA fingerprints in Firebase.
- Configure Android release signing in `android/gradle.properties` or CI secrets.
- Do not commit local keystores, generated bundles, or build artifacts.

## Firebase Android Auth

Use package name `com.cws.tiffinapp` for every Android Firebase app entry.

Local debug builds are stable across laptops because the project uses the checked-in debug keystore at `android/app/debug.keystore`:

```text
Debug SHA-1:   34:6A:61:86:03:F0:2F:40:96:B9:3D:E0:0E:24:27:65:4E:E2:5E:08
Debug SHA-256: D7:F6:52:15:ED:00:92:C0:E7:96:F6:71:A7:3E:A5:6D:84:02:3F:55:7E:D1:71:4C:46:B9:5D:D5:1D:A9:93:73
```

For release APKs built outside Google Play, add the SHA-1 and SHA-256 from `middo-release.keystore`.

For Play Store releases, also add the Play App Signing certificate SHA-1 and SHA-256 from Play Console > Setup > App integrity > App signing key certificate. Google, Phone OTP, and Firebase Auth can fail in production if only the upload key SHA is added.

## Folder Structure

```text
.
├── App.jsx
├── android/
├── ios/
├── src/
│   ├── Assets/
│   ├── components/
│   ├── config/
│   ├── constants/
│   ├── screens/
│   ├── services/
│   └── theme/
└── __tests__/
```

## Available Scripts

| Script            | Purpose         |
| ----------------- | --------------- |
| `npm start`       | Start Metro     |
| `npm run android` | Run Android app |
| `npm run ios`     | Run iOS app     |
| `npm run lint`    | Run ESLint      |
| `npm test`        | Run Jest tests  |

## Architecture Overview

- `screens/` contains feature screens and user flows.
- `components/` contains reusable UI primitives.
- `services/` contains backend and payment API calls.
- `config/` centralizes API, Google, payment, and environment configuration.
- `theme/` contains colors and image references.

The app currently uses lightweight in-app state rather than a navigation or global state library. Keep screen transitions and service contracts stable when refactoring.

## Troubleshooting

- If Android cannot reach the backend, update `MIDDO_API_BASE_URL` or the Android local IP in `src/config/api.js`.
- If Google login or OTP works locally but fails in release, verify that Firebase has the release keystore SHA and, for Play Store installs, the Play App Signing SHA.
- If Razorpay does not open, confirm `MIDDO_USE_NATIVE_CHECKOUT=true` and a valid `MIDDO_RAZORPAY_KEY_ID`.
- If tests fail on native modules, update `jest.setup.js` mocks.

## Contribution Guide

- Run `npm run lint` and `npm test` before pushing.
- Keep business logic and API payloads backward compatible.
- Add reusable UI to `src/components`.
- Keep secrets out of source control.
- Prefer small, focused changes with clear commit messages.
