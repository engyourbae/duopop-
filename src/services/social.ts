import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, writeBatch, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { makeCode } from '../utils/rng';

export interface Me { uid: string; displayName: string; handle?: string | null }
export interface PublicUser { uid: string; displayName: string; handle: string }
export interface FriendRequest { id: string; from: string; to: string; fromName: string; fromHandle: string; toName: string }
export interface Group { id: string; name: string; ownerUid: string; members: string[]; memberNames: Record<string, string>; code: string; max: number }
export interface GroupInvite { id: string; groupId: string; groupName: string; from: string; fromName: string; to: string }
type Unsub = () => void;

export async function myProfile(uid: string): Promise<PublicUser | null> {
  const s = await getDoc(doc(db(), 'users', uid));
  return s.exists() ? (s.data() as PublicUser) : null;
}
export async function searchUsers(prefix: string, selfUid: string): Promise<PublicUser[]> {
  const p = prefix.trim().toLowerCase().replace(/^@/, '');
  if (p.length < 2) return [];
  const q = query(collection(db(), 'users'), orderBy('handleLower'), startAt(p), endAt(p + '\uf8ff'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PublicUser & { discoverable?: boolean }).filter((u) => u.uid !== selfUid && u.discoverable !== false);
}

// ---------- Pertemanan ----------
export async function sendFriendRequest(me: Me & { handle: string }, target: PublicUser): Promise<'sent' | 'accepted' | 'already-friends' | 'pending'> {
  if (me.uid === target.uid) throw new Error('self');
  if ((await getDoc(doc(db(), 'users', me.uid, 'friends', target.uid))).exists()) return 'already-friends';
  const reverse = await getDoc(doc(db(), 'friendRequests', `${target.uid}_${me.uid}`));
  if (reverse.exists()) { await acceptRequest(me, reverse.data() as FriendRequest); return 'accepted'; }
  const ref = doc(db(), 'friendRequests', `${me.uid}_${target.uid}`);
  if ((await getDoc(ref)).exists()) return 'pending';
  await setDoc(ref, { from: me.uid, to: target.uid, fromName: me.displayName, fromHandle: me.handle, toName: target.displayName, createdAt: serverTimestamp() });
  return 'sent';
}
export async function acceptRequest(me: Me, r: Pick<FriendRequest, 'from' | 'to' | 'fromName' | 'fromHandle' | 'toName'>): Promise<void> {
  const b = writeBatch(db());
  b.set(doc(db(), 'users', r.to, 'friends', r.from), { uid: r.from, name: r.fromName, handle: r.fromHandle, since: serverTimestamp() });
  b.set(doc(db(), 'users', r.from, 'friends', r.to), { uid: r.to, name: r.toName || me.displayName, handle: me.handle ?? '', since: serverTimestamp() });
  b.delete(doc(db(), 'friendRequests', `${r.from}_${r.to}`));
  await b.commit();
}
export const removeRequest = (from: string, to: string) => deleteDoc(doc(db(), 'friendRequests', `${from}_${to}`));
export async function removeFriend(me: string, friend: string): Promise<void> {
  const b = writeBatch(db());
  b.delete(doc(db(), 'users', me, 'friends', friend)); b.delete(doc(db(), 'users', friend, 'friends', me));
  await b.commit();
}
export function watchFriends(uid: string, cb: (l: { uid: string; name: string; handle: string }[]) => void): Unsub {
  return onSnapshot(collection(db(), 'users', uid, 'friends'), (s) => cb(s.docs.map((d) => d.data() as { uid: string; name: string; handle: string })));
}
export function watchRequests(uid: string, cb: (incoming: FriendRequest[], outgoing: FriendRequest[]) => void): Unsub {
  let inc: FriendRequest[] = [], out: FriendRequest[] = [];
  const map = (d: { id: string; data: () => unknown }) => ({ ...(d.data() as Omit<FriendRequest, 'id'>), id: d.id });
  const u1 = onSnapshot(query(collection(db(), 'friendRequests'), where('to', '==', uid)), (s) => { inc = s.docs.map(map); cb(inc, out); });
  const u2 = onSnapshot(query(collection(db(), 'friendRequests'), where('from', '==', uid)), (s) => { out = s.docs.map(map); cb(inc, out); });
  return () => { u1(); u2(); };
}

// ---------- Grup ----------
export const GROUP_MAX = 12;
const CODE_TTL = 7 * 24 * 3600 * 1000;
export async function createGroup(me: Me, name: string): Promise<string> {
  const n = name.trim();
  if (n.length < 2 || n.length > 30) throw new Error('nama-grup');
  const ref = doc(collection(db(), 'groups'));
  const code = makeCode(6);
  const b = writeBatch(db());
  b.set(ref, { name: n, ownerUid: me.uid, members: [me.uid], memberNames: { [me.uid]: me.displayName }, code, max: GROUP_MAX, createdAt: serverTimestamp() });
  b.set(doc(db(), 'groupCodes', code), { groupId: ref.id, ownerUid: me.uid, expiresAt: Date.now() + CODE_TTL });
  await b.commit();
  return ref.id;
}
export type JoinResult = 'ok' | 'not-found' | 'expired' | 'full' | 'already';
export async function joinGroup(me: Me, rawCode: string): Promise<JoinResult> {
  const code = rawCode.trim().toUpperCase();
  const c = await getDoc(doc(db(), 'groupCodes', code));
  if (!c.exists()) return 'not-found';
  const { groupId, expiresAt } = c.data() as { groupId: string; expiresAt: number };
  if (Date.now() > expiresAt) return 'expired';
  const gRef = doc(db(), 'groups', groupId);
  // Hanya anggota yang boleh membaca grup: jika berhasil dibaca, berarti sudah bergabung.
  const already = await getDoc(gRef).then(() => true).catch(() => false);
  if (already) return 'already';
  try {
    await updateDoc(gRef, { members: arrayUnion(me.uid), [`memberNames.${me.uid}`]: me.displayName });
    return 'ok';
  } catch (e) {
    if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'permission-denied') return 'full';
    throw e;
  }
}
export const leaveGroup = (g: Group, uid: string) => updateDoc(doc(db(), 'groups', g.id), { members: arrayRemove(uid) });
export const kickMember = (g: Group, uid: string) => updateDoc(doc(db(), 'groups', g.id), { members: arrayRemove(uid) });
export async function deleteGroup(g: Group): Promise<void> {
  const b = writeBatch(db()); b.delete(doc(db(), 'groups', g.id)); b.delete(doc(db(), 'groupCodes', g.code)); await b.commit();
}
export async function regenerateCode(g: Group): Promise<string> {
  const code = makeCode(6);
  const b = writeBatch(db());
  b.delete(doc(db(), 'groupCodes', g.code));
  b.set(doc(db(), 'groupCodes', code), { groupId: g.id, ownerUid: g.ownerUid, expiresAt: Date.now() + CODE_TTL });
  b.update(doc(db(), 'groups', g.id), { code });
  await b.commit();
  return code;
}
export function watchGroups(uid: string, cb: (g: Group[]) => void): Unsub {
  return onSnapshot(query(collection(db(), 'groups'), where('members', 'array-contains', uid)), (s) => cb(s.docs.map((d) => ({ ...(d.data() as Omit<Group, 'id'>), id: d.id }))));
}
export const inviteFriend = (me: Me, g: Group, friendUid: string) =>
  setDoc(doc(db(), 'groupInvites', `${g.id}_${friendUid}`), { groupId: g.id, groupName: g.name, from: me.uid, fromName: me.displayName, to: friendUid, createdAt: serverTimestamp() });
export const cancelInvite = (id: string) => deleteDoc(doc(db(), 'groupInvites', id));
export function watchInvites(uid: string, cb: (i: GroupInvite[]) => void): Unsub {
  return onSnapshot(query(collection(db(), 'groupInvites'), where('to', '==', uid)), (s) => cb(s.docs.map((d) => ({ ...(d.data() as Omit<GroupInvite, 'id'>), id: d.id }))));
}
export async function acceptInvite(me: Me, inv: GroupInvite): Promise<void> {
  const b = writeBatch(db());
  b.update(doc(db(), 'groups', inv.groupId), { members: arrayUnion(me.uid), [`memberNames.${me.uid}`]: me.displayName });
  b.delete(doc(db(), 'groupInvites', inv.id));
  await b.commit();
}
