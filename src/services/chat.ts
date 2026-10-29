import { addDoc, collection, deleteDoc, limit, onSnapshot, orderBy, query, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { serverNow } from '../utils/clock';

/** Chat & reaksi = perantara sementara: dokumen hanya hidup ≤ 60 detik di Firestore, lalu dihapus. Riwayat disimpan lokal di perangkat. */
export type ChatKind = 'text' | 'react' | 'sticker';
export interface ChatMsg { id: string; uid: string; name: string; kind: ChatKind; text: string; at: number }
export type Scope = { kind: 'room' | 'group' | 'dm'; id: string };
export const TTL_MS = 60_000;
export const dmId = (a: string, b: string) => [a, b].sort().join('_');
const colFor = (s: Scope) => (s.kind === 'room' ? collection(db(), 'rooms', s.id, 'chat') : s.kind === 'group' ? collection(db(), 'groups', s.id, 'chat') : collection(db(), 'dmChats', s.id, 'msgs'));

export async function sendChat(s: Scope, me: { uid: string; displayName: string }, kind: ChatKind, text: string): Promise<void> {
  const t = text.trim().slice(0, 200);
  if (!t) return;
  const ref = await addDoc(colFor(s), { uid: me.uid, name: me.displayName, kind, text: t, at: serverTimestamp() });
  setTimeout(() => { void deleteDoc(ref).catch(() => undefined); }, TTL_MS - 5000); // pengirim menghapus lebih dulu
}
export function watchChat(s: Scope, cb: (m: ChatMsg[]) => void): () => void {
  return onSnapshot(query(colFor(s), orderBy('at', 'desc'), limit(40)), (snap) => {
    const list: ChatMsg[] = [];
    snap.docs.forEach((d) => {
      const x = d.data({ serverTimestamps: 'estimate' }) as Omit<ChatMsg, 'id' | 'at'> & { at?: Timestamp | null };
      const at = x.at && typeof x.at.toMillis === 'function' ? x.at.toMillis() : serverNow();
      if (serverNow() - at > TTL_MS + 5000) { void deleteDoc(d.ref).catch(() => undefined); return; } // bersihkan sisa lama
      list.push({ ...x, id: d.id, at } as ChatMsg);
    });
    cb(list.sort((a, b) => a.at - b.at));
  }, () => undefined);
}
