/** Antarmuka mesin permainan giliran: murni, deterministik dari seed; dipakai offline (gantian) dan online (replay langkah). */
export interface TurnEngine<S> {
  init(n: number, seed: string): S;
  actor(s: S): number;
  /** null = langkah tidak sah */
  apply(s: S, move: number): S | null;
  /** -1 = belum ada pemenang */
  winner(s: S): number;
}
/** Memutar ulang urutan langkah (urut ronde, lalu waktu). Langkah dari bukan-giliran atau tidak sah diabaikan. */
export function replayTurns<S>(e: TurnEngine<S>, uids: string[], seed: string, moves: { uid: string; choice: number }[]): { s: S; count: number } {
  let s = e.init(uids.length, seed), count = 0;
  for (const m of moves) {
    if (e.winner(s) >= 0) break;
    if (uids.indexOf(m.uid) !== e.actor(s)) continue;
    const nx = e.apply(s, m.choice);
    if (nx) { s = nx; count++; }
  }
  return { s, count };
}
