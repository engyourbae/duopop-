import { rng, seedFrom, shuffle } from '../../../utils/rng';
import type { TurnEngine } from './types';

/** Kartu domino = a*7+b dengan a ≤ b (0–6). */
export const tile = (a: number, b: number) => Math.min(a, b) * 7 + Math.max(a, b);
export const pips = (t: number): [number, number] => [Math.floor(t / 7), t % 7];
export interface GapleState { n: number; hands: number[][]; row: [number, number][]; cur: number; passes: number; win: number }
export const MOVE_PASS = 2, playMove = (idx: number, side: 0 | 1) => 100 + idx * 2 + side;
const ends = (s: GapleState): [number, number] | null => (s.row.length ? [s.row[0]![0], s.row[s.row.length - 1]![1]] : null);
export function canPlay(s: GapleState, t: number, side: 0 | 1): boolean { const e = ends(s); if (!e) return true; const [a, b] = pips(t), v = e[side]; return a === v || b === v; }
export const hasMove = (s: GapleState, p: number) => (s.hands[p] as number[]).some((t) => canPlay(s, t, 0) || canPlay(s, t, 1));
const sum = (h: number[]) => h.reduce((x, t) => x + pips(t)[0] + pips(t)[1], 0);
export const gaple: TurnEngine<GapleState> = {
  init(n, seed) {
    const tiles = [...Array(7).keys()].flatMap((a) => [...Array(7 - a).keys()].map((k) => tile(a, a + k)));
    const deck = shuffle(tiles, rng(seedFrom(`gaple:${seed}`)));
    const hands = Array.from({ length: n }, () => deck.splice(0, 7));
    let cur = 0, best = -1;
    hands.forEach((h, p) => h.forEach((t) => { const [a, b] = pips(t); if (a === b && a > best) { best = a; cur = p; } }));
    return { n, hands, row: [], cur, passes: 0, win: -1 };
  },
  actor: (s) => s.cur,
  winner: (s) => s.win,
  apply(s0, move) {
    if (s0.win >= 0) return null;
    const s: GapleState = { ...s0, hands: s0.hands.map((h) => h.slice()), row: s0.row.map((r) => [r[0], r[1]] as [number, number]) };
    const hand = s.hands[s.cur] as number[];
    if (move === MOVE_PASS) {
      if (hasMove(s, s.cur)) return null;
      s.passes++;
      if (s.passes >= s.n) { let w = 0; s.hands.forEach((h, p) => { if (sum(h) < sum(s.hands[w] as number[])) w = p; }); s.win = w; return s; }
      s.cur = (s.cur + 1) % s.n; return s;
    }
    if (move < 100) return null;
    const idx = Math.floor((move - 100) / 2), side = ((move - 100) % 2) as 0 | 1, t = hand[idx];
    if (t === undefined || !canPlay(s, t, side)) return null;
    const [a, b] = pips(t), e = ends(s);
    if (!e) s.row.push([a, b]);
    else if (side === 0) s.row.unshift(a === e[0] ? [b, a] : [a, b]);
    else s.row.push(a === e[1] ? [a, b] : [b, a]);
    hand.splice(idx, 1); s.passes = 0;
    if (hand.length === 0) { s.win = s.cur; return s; }
    s.cur = (s.cur + 1) % s.n;
    return s;
  },
};
