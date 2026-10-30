// Your Firebase web app settings (Firebase console > Project settings > Your apps > Web app).
// A Firebase web API key only identifies the project; it is not a secret. Access is decided by
// the Firestore rules, so read "Known limitations" in the README before using this for real.
export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.firebasestorage.app",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

// This account is created as the first admin the first time anyone signs in.
export const ADMIN_EMAIL = "admin@yourcompany.com";
