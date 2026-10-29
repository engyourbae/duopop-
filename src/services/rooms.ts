import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { makeCode } from '../utils/rng';
import { gameById } from '../features/games/registry';
import { roomCapacity } from '../features/multiplayer/rounds';

export interface Room {
  variant?: string;
  code: string; hostUid: string; gameId: string; seed: string; count: number; secs: number; pause?: number; auto?: boolean;
  status: 'lobby' | 'playing' | 'finished'; round: number;
  players: Record<string, { name: string }>; starts: Record<string, Timestamp | null>;
}
export interface RoomAnswer { uid: string; round: number; choice: number; at: Timestamp | null; text?: string }
export interface RoomScore { uid: string; score: number; at: Timestamp | null }

export async function createRoom(host: { uid: string; displayName: string }, gameId: string, count: number, secs: number, pause = 6, variant = ''): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = makeCode(5);
    const ref = doc(db(), 'rooms', code);
    if ((await getDoc(ref)).exists()) continue;
    await setDoc(ref, { code, hostUid: host.uid, gameId, ...(variant ? { variant } : {}), seed: `${code}-${Date.now()}`, count, secs, pause, status: 'lobby', round: 0, players: { [host.uid]: { name: host.displayName } }, starts: {}, createdAt: serverTimestamp() });
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
  const g = gameById(r.gameId), cap = g ? roomCapacity(g) : 8;
  if (Object.keys(r.players).length >= (r.auto ? Math.min(2, cap) : cap)) return 'full';
  await updateDoc(ref, { [`players.${me.uid}`]: { name: me.displayName } });
  return 'ok';
}
export const leaveRoom = (code: string, uid: string) => updateDoc(doc(db(), 'rooms', code), { [`players.${uid}`]: deleteField() });
export const startRoom = (code: string) => updateDoc(doc(db(), 'rooms', code), { status: 'playing', round: 0, 'starts.0': serverTimestamp() });
export const nextRound = (code: string, round: number, total: number) =>
  round + 1 >= total ? updateDoc(doc(db(), 'rooms', code), { status: 'finished' }) : updateDoc(doc(db(), 'rooms', code), { round: round + 1, [`starts.${round + 1}`]: serverTimestamp() });
/** Host menghapus seluruh data ruang setelah selesai agar database tidak menumpuk. */
export async function cleanupRoom(code: string): Promise<void> {
  for (const sub of ['answers', 'scores', 'chat']) { const snap = await getDocs(collection(db(), 'rooms', code, sub)); await Promise.all(snap.docs.map((d) => deleteDoc(d.ref))); }
  await deleteDoc(doc(db(), 'rooms', code));
}
export const finishRoom = (code: string) => updateDoc(doc(db(), 'rooms', code), { status: 'finished' });
export const submitAnswer = (code: string, uid: string, round: number, choice: number, text?: string) =>
  setDoc(doc(db(), 'rooms', code, 'answers', `${round}_${uid}`), { uid, round, choice, ...(text ? { text: text.slice(0, 140) } : {}), at: serverTimestamp() });
export const submitScore = (code: string, uid: string, score: number) => setDoc(doc(db(), 'rooms', code, 'scores', uid), { uid, score: Math.max(0, Math.min(1_000_000, Math.round(score))), at: serverTimestamp() });
export function watchRoom(code: string, cb: (r: Room | null) => void, onErr: (e: unknown) => void): () => void {
  return onSnapshot(doc(db(), 'rooms', code), (s) => cb(s.exists() ? (s.data() as Room) : null), onErr);
}
export function watchAnswers(code: string, cb: (a: RoomAnswer[]) => void): () => void {
  return onSnapshot(collection(db(), 'rooms', code, 'answers'), (s) => cb(s.docs.map((d) => d.data() as RoomAnswer)));
}
export function watchScores(code: string, cb: (a: RoomScore[]) => void): () => void {
  return onSnapshot(collection(db(), 'rooms', code, 'scores'), (s) => cb(s.docs.map((d) => d.data() as RoomScore)));
}
