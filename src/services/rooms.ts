import { collection, deleteField, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { makeCode } from '../utils/rng';

export interface Room {
  code: string; hostUid: string; gameId: string; seed: string; count: number; secs: number;
  status: 'lobby' | 'playing' | 'finished'; round: number;
  players: Record<string, { name: string }>; starts: Record<string, Timestamp | null>;
}
export interface RoomAnswer { uid: string; round: number; choice: number; at: Timestamp | null }
export const ROOM_MAX = 8;

export async function createRoom(host: { uid: string; displayName: string }, gameId: string, count: number, secs: number): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = makeCode(5);
    const ref = doc(db(), 'rooms', code);
    if ((await getDoc(ref)).exists()) continue;
    await setDoc(ref, { code, hostUid: host.uid, gameId, seed: `${code}-${Date.now()}`, count, secs, status: 'lobby', round: 0, players: { [host.uid]: { name: host.displayName } }, starts: {}, createdAt: serverTimestamp() });
    return code;
  }
  throw new Error('kode-gagal');
}
export type JoinRoomResult = 'ok' | 'not-found' | 'started' | 'full';
export async function joinRoom(me: { uid: string; displayName: string }, rawCode: string): Promise<JoinRoomResult> {
  const code = rawCode.trim().toUpperCase();
  const ref = doc(db(), 'rooms', code);
  const s = await getDoc(ref);
  if (!s.exists()) return 'not-found';
  const r = s.data() as Room;
  if (r.players[me.uid]) return 'ok'; // bergabung kembali setelah terputus
  if (r.status !== 'lobby') return 'started';
  if (Object.keys(r.players).length >= ROOM_MAX) return 'full';
  await updateDoc(ref, { [`players.${me.uid}`]: { name: me.displayName } });
  return 'ok';
}
export const leaveRoom = (code: string, uid: string) => updateDoc(doc(db(), 'rooms', code), { [`players.${uid}`]: deleteField() });
export const startRoom = (code: string) => updateDoc(doc(db(), 'rooms', code), { status: 'playing', round: 0, 'starts.0': serverTimestamp() });
export const nextRound = (code: string, round: number, total: number) =>
  round + 1 >= total ? updateDoc(doc(db(), 'rooms', code), { status: 'finished' }) : updateDoc(doc(db(), 'rooms', code), { round: round + 1, [`starts.${round + 1}`]: serverTimestamp() });
export const submitAnswer = (code: string, uid: string, round: number, choice: number) =>
  setDoc(doc(db(), 'rooms', code, 'answers', `${round}_${uid}`), { uid, round, choice, at: serverTimestamp() });
export function watchRoom(code: string, cb: (r: Room | null) => void, onErr: (e: unknown) => void): () => void {
  return onSnapshot(doc(db(), 'rooms', code), (s) => cb(s.exists() ? (s.data() as Room) : null), onErr);
}
export function watchAnswers(code: string, cb: (a: RoomAnswer[]) => void): () => void {
  return onSnapshot(collection(db(), 'rooms', code, 'answers'), (s) => cb(s.docs.map((d) => d.data() as RoomAnswer)));
}
