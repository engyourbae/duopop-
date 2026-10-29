import { rng, seedFrom } from '../../../utils/rng';
import type { TurnEngine } from './types';

export const JUMPS: Record<number, number> = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100, 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
export interface LadderState { n: number; pos: number[]; cur: number; moves: number; win: number; seed: string; last: { who: number; roll: number; from: number; to: number; jump: number } | null }
/** Dadu deterministik: semua pemain melihat hasil yang sama untuk langkah ke-n. */
export const diceFor = (seed: string, moveNo: number) => 1 + Math.floor(rng(seedFrom(`ladder:${seed}:${moveNo}`))() * 6);
export const MOVE_ROLL = 1;
export const ladder: TurnEngine<LadderState> = {
  init: (n, seed) => ({ n, pos: Array(n).fill(0), cur: 0, moves: 0, win: -1, seed, last: null }),
  actor: (s) => s.cur,
  winner: (s) => s.win,
  apply(s0, move) {
    if (s0.win >= 0 || move !== MOVE_ROLL) return null;
    const roll = diceFor(s0.seed, s0.moves), from = s0.pos[s0.cur] as number;
    let to = from + roll; if (to > 100) to = from;
    const jumped = JUMPS[to] ?? to, pos = s0.pos.slice(); pos[s0.cur] = jumped;
    const win = jumped === 100 ? s0.cur : -1;
    return { ...s0, pos, win, moves: s0.moves + 1, cur: win >= 0 ? s0.cur : roll === 6 && to !== from ? s0.cur : (s0.cur + 1) % s0.n, last: { who: s0.cur, roll, from, to, jump: jumped } };
  },
};
