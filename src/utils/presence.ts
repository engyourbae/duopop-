/** Logika murni presensi & pencarian lawan (mudah diuji). */
export const ONLINE_TTL = 90_000;   // teman dianggap online bila detak jantung < 90 dtk
export const QUEUE_TTL = 40_000;    // entri antrean dianggap basi bila > 40 dtk
export const isFresh = (at: number | undefined, now: number, ttl: number) => typeof at === 'number' && at > 0 && now - at < ttl;
export interface QueueEntry { uid: string; name: string; gameId: string; status: 'waiting' | 'matched'; at: number; roomCode?: string }
/** Kandidat lawan: bukan diri sendiri, masih menunggu, belum basi; yang menunggu paling lama didahulukan. */
export function pickCandidates(entries: QueueEntry[], selfUid: string, now: number): QueueEntry[] {
  return entries.filter((e) => e.uid !== selfUid && e.status === 'waiting' && isFresh(e.at, now, QUEUE_TTL)).sort((a, b) => a.at - b.at);
}
export const initial = (name: string) => name.replace(/^@/, '').slice(0, 1).toUpperCase() || '?';
