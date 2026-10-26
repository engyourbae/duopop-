import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, query, runTransaction, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { makeCode } from '../utils/rng';
import { pickCandidates, type QueueEntry } from '../utils/presence';

type Unsub = () => void;
export interface Who { uid: string; displayName: string }

// ---------- Presensi (siapa yang sedang online) ----------
export const setPresence = (me: Who, online = true) => setDoc(doc(db(), 'presence', me.uid), { uid: me.uid, name: me.displayName, at: online ? Date.now() : 0 });
/** Memantau presensi tiap teman (satu pendengar per teman; maks. 30 teman). */
export function watchPresence(uids: string[], cb: (m: Record<string, number>) => void): Unsub {
  const state: Record<string, number> = {};
  const offs = uids.slice(0, 30).map((u) => onSnapshot(doc(db(), 'presence', u), (s) => { state[u] = s.exists() ? Number((s.data() as { at?: number }).at ?? 0) : 0; cb({ ...state }); }, () => { state[u] = 0; cb({ ...state }); }));
  return () => offs.forEach((f) => f());
}

// ---------- Cari lawan acak ----------
export const joinQueue = (me: Who, gameId: string) => setDoc(doc(db(), 'matchQueue', me.uid), { uid: me.uid, name: me.displayName, gameId, status: 'waiting', at: Date.now() });
export const heartbeatQueue = (uid: string) => updateDoc(doc(db(), 'matchQueue', uid), { at: Date.now() });
export const leaveQueue = (uid: string) => deleteDoc(doc(db(), 'matchQueue', uid));
export function watchMyQueue(uid: string, cb: (d: QueueEntry | null) => void): Unsub {
  return onSnapshot(doc(db(), 'matchQueue', uid), (s) => cb(s.exists() ? (s.data() as QueueEntry) : null), () => cb(null));
}
/** Mencoba menjodohkan: mengklaim lawan yang menunggu lewat transaksi (aman dari tabrakan dua pencari). Mengembalikan kode ruang atau null. */
export async function tryMatch(me: Who, gameId: string, count = 10, secs = 15): Promise<string | null> {
  const snap = await getDocs(query(collection(db(), 'matchQueue'), where('gameId', '==', gameId), limit(25)));
  const cands = pickCandidates(snap.docs.map((d) => d.data() as QueueEntry), me.uid, Date.now());
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
