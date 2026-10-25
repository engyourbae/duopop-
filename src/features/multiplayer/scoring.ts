import { answerPoints, type PlayItem } from '../games/engine';

export interface AnsLite { uid: string; round: number; choice: number; atMs: number | null }
/** Skor diturunkan murni dari jawaban + waktu server: tidak ada field skor yang bisa dipalsukan klien. */
export function roomScores(items: PlayItem[], answers: AnsLite[], startsMs: Record<string, number | null>, secs: number, uids: string[]): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(uids.map((u) => [u, 0]));
  const seen = new Set<string>();
  for (const a of answers) {
    const key = `${a.round}_${a.uid}`;
    if (seen.has(key) || !(a.uid in out)) continue;
    seen.add(key);
    const item = items[a.round];
    const start = startsMs[String(a.round)];
    if (!item || start == null || a.atMs == null) continue;
    const el = (a.atMs - start) / 1000;
    if (el > secs + 2) continue; // jawaban terlambat diabaikan
    out[a.uid] = (out[a.uid] ?? 0) + answerPoints(a.choice === item.correct, 1 - Math.max(0, el) / secs);
  }
  return out;
}
