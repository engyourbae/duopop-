import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { makeCode } from '../utils/rng';
import { pickCandidates, type QueueEntry } from '../utils/presence';
import { calibrateClock as calibrate, serverNow } from '../utils/clock';

type Unsub = () => void;
export interface Who { uid: string; displayName: string }

// ---------- Jam server ----------
// Jam HP bisa berbeda beberapa menit. Semua stempel waktu memakai jam server; selisihnya dikalibrasi dari dokumen milik sendiri.
const ms = (t: Timestamp | null | undefined) => (t && typeof t.toMillis === 'function' ? t.toMillis() : 0);

// ---------- Presensi (siapa yang sedang online) ----------
export const setPresence = (me: Who, online = true) => setDoc(doc(db(), 'presence', me.uid), { uid: me.uid, name: me.displayName, at: online ? serverTimestamp() : null });
/** Mengkalibrasi jam server dari dokumen presensi milik sendiri. */
export function watchOwnClock(uid: string): Unsub {
  return onSnapshot(doc(db(), 'presence', uid), (s) => { if (s.exists() && !s.metadata.hasPendingWrites) calibrate(ms((s.data() as { at?: Timestamp | null }).at)); }, () => undefined);
}
/** Memantau presensi tiap teman (satu pendengar per teman; maks. 30). Nilai = milidetik jam server; 0 = offline. */
export function watchPresence(uids: string[], cb: (m: Record<string, number>) => void, onError?: (code: string) => void): Unsub {
  const state: Record<string, number> = {};
  const offs = uids.slice(0, 30).map((u) => onSnapshot(doc(db(), 'presence', u),
    (s) => { state[u] = s.exists() ? ms((s.data({ serverTimestamps: 'estimate' }) as { at?: Timestamp | null }).at) : 0; cb({ ...state }); },
    (e) => { state[u] = 0; cb({ ...state }); onError?.((e as { code?: string }).code ?? 'error'); }));
  return () => offs.forEach((f) => f());
}

// ---------- Cari lawan acak ----------
export const joinQueue = (me: Who, gameId: string) => setDoc(doc(db(), 'matchQueue', me.uid), { uid: me.uid, name: me.displayName, gameId, status: 'waiting', at: serverTimestamp() });
export const heartbeatQueue = (uid: string) => updateDoc(doc(db(), 'matchQueue', uid), { at: serverTimestamp() });
export const leaveQueue = (uid: string) => deleteDoc(doc(db(), 'matchQueue', uid));
export function watchMyQueue(uid: string, cb: (d: QueueEntry | null) => void): Unsub {
  return onSnapshot(doc(db(), 'matchQueue', uid), (s) => {
    if (!s.exists()) { cb(null); return; }
    const d = s.data() as Omit<QueueEntry, 'at'> & { at?: Timestamp | null };
    if (!s.metadata.hasPendingWrites) calibrate(ms(d.at));
    cb({ ...d, at: ms(d.at) } as QueueEntry);
  }, () => cb(null));
}
/** Mencoba menjodohkan: mengklaim lawan yang menunggu lewat transaksi (aman dari tabrakan dua pencari). Mengembalikan kode ruang atau null. */
export async function tryMatch(me: Who, gameId: string, count = 10, secs = 15): Promise<string | null> {
  const snap = await getDocs(query(collection(db(), 'matchQueue'), where('gameId', '==', gameId), limit(25)));
  const cands = pickCandidates(snap.docs.map((d) => { const x = d.data({ serverTimestamps: 'estimate' }) as Omit<QueueEntry, 'at'> & { at?: Timestamp | null }; return { ...x, at: ms(x.at) } as QueueEntry; }), me.uid, serverNow());
  for (const c of cands) {
    const code = makeCode(5);
    try {
      const ok = await runTransaction(db(), async (tx) => {
        const meRef = doc(db(), 'matchQueue', me.uid), otherRef = doc(db(), 'matchQueue', c.uid), roomRef = doc(db(), 'rooms', code);
        const [m, o, r] = await Promise.all([tx.get(meRef), tx.get(otherRef), tx.get(roomRef)]);
        if (!m.exists() || (m.data() as QueueEntry).status !== 'waiting' || !o.exists() || (o.data() as QueueEntry).status !== 'waiting' || r.exists()) return false;
        tx.set(roomRef, { code, hostUid: me.uid, gameId, seed: `${code}-${Date.now()}`, count, secs, status: 'lobby', round: 0, auto: true, players: { [me.uid]: { name: me.displayName } }, starts: {}, createdAt: Date.now() });
        tx.update(otherRef, { status: 'matched', roomCode: code });
        tx.update(meRef, { status: 'matched', roomCode: code });
        return true;
      });
      if (ok) return code;
    } catch { /* bentrok atau ditolak: coba kandidat berikutnya */ }
  }
  return null;
}

// ---------- Undangan bermain ke teman ----------
export interface PlayInvite { id: string; from: string; fromName: string; to: string; code: string; gameId: string; at: number }
export const sendPlayInvite = (me: Who, friendUid: string, code: string, gameId: string) =>
  setDoc(doc(db(), 'roomInvites', `${me.uid}_${friendUid}`), { from: me.uid, fromName: me.displayName, to: friendUid, code, gameId, at: Date.now() });
export const removePlayInvite = (id: string) => deleteDoc(doc(db(), 'roomInvites', id));
export function watchPlayInvites(uid: string, cb: (i: PlayInvite[]) => void): Unsub {
  return onSnapshot(query(collection(db(), 'roomInvites'), where('to', '==', uid)), (s) => cb(s.docs.map((d) => ({ ...(d.data() as Omit<PlayInvite, 'id'>), id: d.id }))), () => cb([]));
}
