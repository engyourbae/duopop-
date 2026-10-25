export interface FirebaseEnv { apiKey: string; authDomain: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string }
const e = import.meta.env;
export const firebaseConfig: FirebaseEnv = {
  apiKey: (e.VITE_FIREBASE_API_KEY as string | undefined) ?? '',
  authDomain: (e.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ?? '',
  projectId: (e.VITE_FIREBASE_PROJECT_ID as string | undefined) ?? '',
  storageBucket: (e.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ?? '',
  messagingSenderId: (e.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ?? '',
  appId: (e.VITE_FIREBASE_APP_ID as string | undefined) ?? '',
};
/** true hanya jika kunci minimal terisi. Tanpa ini aplikasi berjalan mode solo; tidak ada login/multiplayer palsu. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
