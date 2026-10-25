import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './config';

/** Modul ini hanya dimuat lewat dynamic import saat Firebase terkonfigurasi. */
function init(): FirebaseApp {
  if (!isFirebaseConfigured) throw new Error('Firebase belum dikonfigurasi');
  return getApps()[0] ?? initializeApp(firebaseConfig);
}
let _auth: Auth | null = null, _db: Firestore | null = null;
export const auth = (): Auth => (_auth ??= getAuth(init()));
export const db = (): Firestore => (_db ??= getFirestore(init()));
