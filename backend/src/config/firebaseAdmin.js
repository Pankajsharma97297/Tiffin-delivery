const {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
} = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getMessaging } = require("firebase-admin/messaging");

const getServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON.replace(/,\s*$/, ""));
  }

  const privateKey = String(process.env.FIREBASE_PRIVATE_KEY || "")
    .trim()
    .replace(/,\s*$/, "")
    .replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n");

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    privateKey
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    };
  }

  return null;
};

const initializeFirebaseAdmin = () => {
  if (getApps().length) {
    return getApp();
  }

  const serviceAccount = getServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      ...(projectId ? { projectId } : {}),
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    ...(projectId ? { projectId } : {}),
  });
};

const admin = {
  auth() {
    return getAuth(initializeFirebaseAdmin());
  },
  messaging() {
    return getMessaging(initializeFirebaseAdmin());
  },
};

module.exports = {
  admin,
  initializeFirebaseAdmin,
};
