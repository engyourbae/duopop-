import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, signOut, updateProfile, type User } from 'firebase/auth';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/client';

export interface AppUser { uid: string; displayName: string; handle: string | null; email: string | null }

export function mapAuthError(code: string): string {
  const m: Record<string, string> = {
    'auth/invalid-email': 'Format email tidak valid.', 'auth/user-not-found': 'Akun dengan email ini tidak ditemukan.',
    'auth/wrong-password': 'Kata sandi salah.', 'auth/invalid-credential': 'Email atau kata sandi salah.',
    'auth/email-already-in-use': 'Email ini sudah terdaftar. Coba masuk.', 'auth/weak-password': 'Kata sandi terlalu lemah (minimal 6 karakter).',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa saat.', 'auth/network-request-failed': 'Tidak ada koneksi internet.',
    'handle-taken': 'Nama pengguna sudah dipakai. Pilih yang lain.', 'auth/popup-closed-by-user': 'Login Google dibatalkan.', 'auth/cancelled-popup-request': 'Login Google dibatalkan.', 'auth/popup-blocked': 'Popup diblokir browser. Izinkan popup lalu coba lagi.', 'auth/unauthorized-domain': 'Domain ini belum diizinkan di Firebase (Authorized domains).', 'auth/operation-not-allowed': 'Login Google belum diaktifkan di Firebase.', 'invalid-handle': 'Nama pengguna 3–20 karakter: huruf kecil, angka, garis bawah.', 'permission-denied': 'Akses ditolak oleh aturan keamanan.',
  };
  return m[code] ?? 'Terjadi kesalahan. Coba lagi.';
}
export const errCode = (e: unknown): string => (typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : e instanceof Error ? e.message : 'unknown');

const toApp = (u: User): AppUser => ({ uid: u.uid, displayName: u.displayName ?? 'Pemain', handle: null, email: u.email });
export function watchAuth(cb: (u: AppUser | null) => void): () => void { return onAuthStateChanged(auth(), (u) => cb(u ? toApp(u) : null)); }

export const validHandle = (h: string) => /^[a-z0-9_]{3,20}$/.test(h);

/** Memesan username dan membuat profil publik (atomik). Nama publik = @username; nama asli/Google tidak disimpan. */
export async function claimProfile(uid: string, handle: string): Promise<void> {
  const h = handle.trim().toLowerCase();
  if (!validHandle(h)) throw new Error('invalid-handle');
  await runTransaction(db(), async (tx) => {
    const hRef = doc(db(), 'handles', h);
    if ((await tx.get(hRef)).exists()) throw new Error('handle-taken');
    tx.set(hRef, { uid });
    tx.set(doc(db(), 'users', uid), { uid, displayName: `@${h}`, handle: h, handleLower: h, discoverable: true, createdAt: serverTimestamp() });
  });
}
export async function register(email: string, password: string, handle: string): Promise<void> {
  const h = handle.trim().toLowerCase();
  if (!validHandle(h)) throw new Error('invalid-handle');
  const cred = await createUserWithEmailAndPassword(auth(), email.trim(), password);
  try {
    await updateProfile(cred.user, { displayName: `@${h}` });
    await claimProfile(cred.user.uid, h);
  } catch (e) {
    await cred.user.delete().catch(() => undefined); // batalkan akun setengah jadi
    throw e;
  }
}
/** Login Google (popup). Mengembalikan true bila profil publik (nama pengguna) sudah ada. */
export async function loginGoogle(): Promise<boolean> {
  const cred = await signInWithPopup(auth(), new GoogleAuthProvider());
  return (await getDoc(doc(db(), 'users', cred.user.uid))).exists();
}
export const login = (email: string, password: string) => signInWithEmailAndPassword(auth(), email.trim(), password).then(() => undefined);
export const logout = () => signOut(auth());
