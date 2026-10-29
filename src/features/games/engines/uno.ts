import { rng, seedFrom, shuffle } from '../../../utils/rng';
import type { TurnEngine } from './types';

/** Kartu = warna*16 + nilai. Warna 0–3 (merah, kuning, hijau, biru), 4 = liar. Nilai 0–9, 10 lewati, 11 balik, 12 +2, 13 liar, 14 liar +4. */
export const COLORS = ['Merah', 'Kuning', 'Hijau', 'Biru'];
export const cardColor = (c: number) => Math.floor(c / 16);
export const cardVal = (c: number) => c % 16;
export function makeDeck(): number[] {
  const d: number[] = [];
  for (let col = 0; col < 4; col++) {
    d.push(col * 16);
    for (let v = 1; v <= 12; v++) { d.push(col * 16 + v); d.push(col * 16 + v); }
  }
  for (let i = 0; i < 4; i++) { d.push(4 * 16 + 13); d.push(4 * 16 + 14); }
  return d; // 108 kartu
}
export interface UnoState { n: number; hands: number[][]; draw: number[]; discard: number[]; cur: number; dir: 1 | -1; color: number; drew: boolean; win: number; seed: string; moves: number }
export const playable = (s: UnoState, c: number) => cardColor(c) === 4 || cardColor(c) === s.color || cardVal(c) === cardVal(s.discard[s.discard.length - 1] as number);
const next = (s: UnoState, from: number, steps = 1) => ((from + s.dir * steps) % s.n + s.n) % s.n;
function drawCards(s: UnoState, p: number, k: number) {
  for (let i = 0; i < k; i++) {
    if (!s.draw.length) { const top = s.discard.pop() as number; s.draw = shuffle(s.discard, rng(seedFrom(`${s.seed}:r${s.moves}`))); s.discard = [top]; }
    const c = s.draw.pop(); if (c !== undefined) (s.hands[p] as number[]).push(c);
  }
}
export const MOVE_DRAW = 1, MOVE_PASS = 2, playMove = (idx: number, color = 0) => 100 + idx * 5 + color;
export const uno: TurnEngine<UnoState> = {
  init(n, seed) {
    const deck = shuffle(makeDeck(), rng(seedFrom(`uno:${seed}`)));
    const hands = Array.from({ length: n }, () => deck.splice(0, 7));
    let first = deck.findIndex((c) => cardColor(c) !== 4 && cardVal(c) < 10);
    if (first < 0) first = 0;
    const top = deck.splice(first, 1)[0] as number;
    return { n, hands, draw: deck, discard: [top], cur: 0, dir: 1, color: cardColor(top), drew: false, win: -1, seed, moves: 0 };
  },
  actor: (s) => s.cur,
  winner: (s) => s.win,
  apply(s0, move) {
    if (s0.win >= 0) return null;
    const s: UnoState = { ...s0, hands: s0.hands.map((h) => h.slice()), draw: s0.draw.slice(), discard: s0.discard.slice(), moves: s0.moves + 1 };
    const hand = s.hands[s.cur] as number[];
    if (move === MOVE_DRAW) { if (s.drew) return null; drawCards(s, s.cur, 1); s.drew = true; return s; }
    if (move === MOVE_PASS) { if (!s.drew) return null; s.cur = next(s, s.cur); s.drew = false; return s; }
    if (move < 100) return null;
    const idx = Math.floor((move - 100) / 5), chosen = (move - 100) % 5, card = hand[idx];
    if (card === undefined || !playable(s, card)) return null;
    if (cardColor(card) === 4 && chosen > 3) return null;
    hand.splice(idx, 1); s.discard.push(card);
    s.color = cardColor(card) === 4 ? chosen : cardColor(card);
    if (hand.length === 0) { s.win = s.cur; return s; }
    const v = cardVal(card); let steps = 1;
    if (v === 10) steps = 2;
    else if (v === 11) { s.dir = (s.dir === 1 ? -1 : 1); if (s.n === 2) steps = 2; }
    else if (v === 12) { drawCards(s, next(s, s.cur), 2); steps = 2; }
    else if (v === 14) { drawCards(s, next(s, s.cur), 4); steps = 2; }
    s.cur = next(s, s.cur, steps); s.drew = false;
    return s;
  },
};
