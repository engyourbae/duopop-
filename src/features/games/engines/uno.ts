import { rng, seedFrom, shuffle } from '../../../utils/rng';
import type { TurnEngine } from './types';

/**
 * Kartu = warna*32 + nilai. Warna 0–3 (merah, kuning, hijau, biru), 4 = liar.
 * Nilai 0–9, 10 lewati, 11 balik, 12 +2, 13 liar, 14 liar +4.
 * Khusus Flip: kartu dua sisi = terang + 256*gelap; sisi gelap memakai COLORS_DARK. Nilai 22 +5, 23 flip, 24 +1, 25 liar +2, 26 liar tarik warna (16 = lewati semua).
 * Khusus No Mercy: 15 +4 berwarna, 16 lewati semua, 17 buang semua, 18 liar +6, 19 liar +10, 20 liar roulette, 21 liar balik +4.
 */
export const COLORS = ['Merah', 'Kuning', 'Hijau', 'Biru'];
export const COLORS_DARK = ['Pink', 'Tosca', 'Oranye', 'Ungu'];
export type UnoMode = 'classic' | 'nomercy' | 'flip' | 'custom';
/** Aturan aktif. Custom: huruf s=tumpuk, 7=tukar tangan, 0=putar tangan, j=jump-in, d=ambil sampai cocok, b=mulai 10 kartu. */
export interface UnoRules { stack: boolean; seven: boolean; zero: boolean; jump: boolean; until: boolean; big: boolean }
export const parseRules = (flags: string): UnoRules => ({ stack: flags.includes('s'), seven: flags.includes('7'), zero: flags.includes('0'), jump: flags.includes('j'), until: flags.includes('d'), big: flags.includes('b') });
export const rulesText = (r: UnoRules) => [r.stack && 'Tumpuk', r.seven && '7 tukar', r.zero && '0 putar', r.jump && 'Jump-in', r.until && 'Ambil sampai cocok', r.big && 'Mulai 10 kartu'].filter(Boolean).join(' · ') || 'Aturan dasar';
export const MERCY_LIMIT = 25;
export const cardColor = (c: number) => Math.floor(c / 32);
export const cardVal = (c: number) => c % 32;
/** Mode dibawa lewat seed agar sinkron online (replay) tanpa mengubah antarmuka mesin. */
export const unoSeed = (bank: string | undefined, seed: string) => (bank === 'nomercy' ? `nm~${seed}` : bank === 'flip' ? `fl~${seed}` : bank?.startsWith('custom') ? `cu~${bank.slice(7)}~${seed}` : seed);
/** Wajah kartu yang sedang terlihat (kode warna*32+nilai) pada sisi tertentu. Untuk mode non-Flip selalu kartu itu sendiri. */
export const face = (s: { side: 0 | 1 }, c: number) => (s.side === 1 ? Math.floor(c / 256) : c % 256);
export function makeDeck(mode: UnoMode = 'classic', r: () => number = Math.random): number[] {
  const d: number[] = [];
  if (mode === 'flip') { // 112 kartu dua sisi; kartu Flip berpasangan dengan Flip, sisanya dipasangkan acak (deterministik dari seed)
    const L: number[] = [], D: number[] = [], LF: number[] = [], DF: number[] = [];
    for (let col = 0; col < 4; col++) {
      for (let v = 1; v <= 9; v++) for (let k = 0; k < 2; k++) { L.push(col * 32 + v); D.push(col * 32 + v); }
      for (let k = 0; k < 2; k++) { L.push(col * 32 + 24, col * 32 + 11, col * 32 + 10); D.push(col * 32 + 22, col * 32 + 11, col * 32 + 16); LF.push(col * 32 + 23); DF.push(col * 32 + 23); }
    }
    for (let k = 0; k < 4; k++) { L.push(4 * 32 + 13, 4 * 32 + 25); D.push(4 * 32 + 13, 4 * 32 + 26); }
    const sl = shuffle(L, r), sd = shuffle(D, r), fl = shuffle(DF, r);
    sl.forEach((x, i) => d.push(x + 256 * (sd[i] as number)));
    LF.forEach((x, i) => d.push(x + 256 * (fl[i] as number)));
    return d;
  }
  if (mode === 'nomercy') {
    for (let col = 0; col < 4; col++) {
      for (let v = 0; v <= 9; v++) { d.push(col * 32 + v); d.push(col * 32 + v); }
      for (const v of [10, 11, 12, 15, 16, 17]) { d.push(col * 32 + v); d.push(col * 32 + v); }
    }
    for (const v of [18, 19, 20, 21]) for (let i = 0; i < 4; i++) d.push(4 * 32 + v);
    return d; // 144 kartu
  }
  for (let col = 0; col < 4; col++) {
    d.push(col * 32);
    for (let v = 1; v <= 12; v++) { d.push(col * 32 + v); d.push(col * 32 + v); }
  }
  for (let i = 0; i < 4; i++) { d.push(4 * 32 + 13); d.push(4 * 32 + 14); }
  return d; // 108 kartu
}
/** Jumlah kartu hukuman yang dibawa sebuah kartu (0 = bukan kartu hukuman). */
export const drawAmt = (c: number) => { const v = cardVal(c); return v === 24 ? 1 : v === 22 ? 5 : v === 25 ? 2 : v === 12 ? 2 : v === 14 || v === 15 || v === 21 ? 4 : v === 18 ? 6 : v === 19 ? 10 : 0; };
export interface UnoState { n: number; hands: number[][]; draw: number[]; discard: number[]; cur: number; dir: 1 | -1; color: number; drew: boolean; win: number; seed: string; moves: number; pend: number; last: { who: number; card: number; draw: number } | null; mode: UnoMode; out: boolean[]; pt: number; side: 0 | 1; rules: UnoRules }
/** Classic: saat ada hukuman menunggu, hanya kartu sejenis yang boleh ditumpuk. No Mercy: boleh menumpuk hukuman yang sama atau lebih besar. */
export const playable = (s: UnoState, c: number) => {
  const f = face(s, c), topV = cardVal(face(s, s.discard[s.discard.length - 1] as number));
  if (s.pend > 0) return s.mode === 'nomercy' ? drawAmt(f) >= Math.max(2, s.pt) : !s.rules.stack ? false : s.mode === 'flip' ? drawAmt(f) > 0 && cardVal(f) === topV : (cardVal(f) === 12 || cardVal(f) === 14) && cardVal(f) === topV;
  return cardColor(f) === 4 || cardColor(f) === s.color || cardVal(f) === topV;
};
const alive = (s: UnoState) => s.out.filter((x) => !x).length;
const next = (s: UnoState, from: number, steps = 1) => { let p = from; for (let k = 0; k < steps; k++) { do { p = ((p + s.dir) % s.n + s.n) % s.n; } while (s.out[p]); } return p; };
function drawCards(s: UnoState, p: number, k: number) {
  for (let i = 0; i < k; i++) {
    if (!s.draw.length) { const top = s.discard.pop() as number; s.draw = shuffle(s.discard, rng(seedFrom(`${s.seed}:r${s.moves}`))); s.discard = [top]; }
    const c = s.draw.pop(); if (c !== undefined) (s.hands[p] as number[]).push(c);
  }
}
/** Tarik kartu sampai dapat yang memenuhi `stop`; mengembalikan jumlah kartu yang diambil. */
function drawUntil(s: UnoState, p: number, stop: (c: number) => boolean): number {
  let k = 0; const h = s.hands[p] as number[];
  while (k < 40) { const before = h.length; drawCards(s, p, 1); if (h.length === before) break; k++; if (stop(h[h.length - 1] as number)) break; if (h.length >= MERCY_LIMIT) break; }
  return k;
}
/** No Mercy: pemain dengan 25+ kartu tersingkir; sisa satu pemain = menang. */
function mercy(s: UnoState, p: number): boolean {
  if (s.mode !== 'nomercy' || (s.hands[p] as number[]).length < MERCY_LIMIT) return false;
  s.draw = [...(s.hands[p] as number[]), ...s.draw]; s.hands[p] = []; s.out[p] = true;
  if (alive(s) === 1) s.win = s.out.findIndex((x) => !x);
  return true;
}
export const MOVE_DRAW = 1, MOVE_PASS = 2, playMove = (idx: number, color = 0) => 100 + idx * 5 + color;
export const uno: TurnEngine<UnoState> = {
  init(n, seed) {
    const mode: UnoMode = seed.startsWith('nm~') ? 'nomercy' : seed.startsWith('fl~') ? 'flip' : seed.startsWith('cu~') ? 'custom' : 'classic';
    const rules: UnoRules = mode === 'nomercy' ? { stack: true, seven: true, zero: true, jump: false, until: true, big: false } : mode === 'custom' ? parseRules(seed.slice(3, Math.max(3, seed.indexOf('~', 3)))) : { stack: true, seven: false, zero: false, jump: false, until: false, big: false };
    const deck = shuffle(makeDeck(mode, rng(seedFrom(`uno:${seed}:pair`))), rng(seedFrom(`uno:${seed}`)));
    const hands = Array.from({ length: n }, () => deck.splice(0, rules.big ? 10 : 7));
    let first = deck.findIndex((c) => cardColor(c % 256) !== 4 && cardVal(c % 256) < 10);
    if (first < 0) first = 0;
    const top = deck.splice(first, 1)[0] as number;
    return { n, hands, draw: deck, discard: [top], cur: 0, dir: 1, color: cardColor(top % 256), drew: false, win: -1, seed, moves: 0, pend: 0, last: null, mode, out: Array(n).fill(false), pt: 0, side: 0, rules };
  },
  actor: (s) => s.cur,
  winner: (s) => s.win,
  apply(s0, move) {
    if (s0.win >= 0) return null;
    const s: UnoState = { ...s0, hands: s0.hands.map((h) => h.slice()), draw: s0.draw.slice(), discard: s0.discard.slice(), out: s0.out.slice(), moves: s0.moves + 1 };
    const who = s.cur, hand = s.hands[who] as number[], nm = s.mode === 'nomercy', fl = s.mode === 'flip';
    if (move === MOVE_DRAW) {
      if (s.pend > 0) {
        const k = s.pend; drawCards(s, who, k); s.pend = 0; s.pt = 0; s.last = { who, card: -1, draw: k };
        mercy(s, who); if (s.win >= 0) return s;
        s.cur = next(s, who); s.drew = false; return s;
      }
      if (s.drew) return null;
      let k = 1;
      if (s.rules.until) k = drawUntil(s, who, (c) => playable(s, c)); else drawCards(s, who, 1);
      s.drew = true; s.last = { who, card: -1, draw: k };
      if (mercy(s, who)) { if (s.win >= 0) return s; s.cur = next(s, who); s.drew = false; }
      return s;
    }
    if (move === MOVE_PASS) { if (!s.drew || s.pend > 0) return null; s.last = { who, card: -1, draw: 0 }; s.cur = next(s, who); s.drew = false; return s; }
    if (move < 100) return null;
    const idx = Math.floor((move - 100) / 5), chosen = (move - 100) % 5, card = hand[idx];
    if (card === undefined || !playable(s, card)) return null;
    const f = face(s, card), v = cardVal(f), isWild = cardColor(f) === 4;
    if (isWild && chosen > 3) return null;
    if (s.rules.seven && v === 7 && !isWild && (chosen >= s.n || chosen === who || s.out[chosen])) return null;
    hand.splice(idx, 1); s.discard.push(card); s.last = { who, card: f, draw: 0 };
    s.color = isWild ? chosen : cardColor(f);
    if (nm && v === 17) { // buang semua kartu berwarna sama
      const gone = hand.filter((c) => cardColor(c) === cardColor(f));
      for (const c of gone) hand.splice(hand.indexOf(c), 1);
      s.discard.splice(s.discard.length - 1, 0, ...gone);
    }
    if (hand.length === 0) { s.win = s.cur; return s; }
    if (fl && v === 23) { s.side = s.side === 1 ? 0 : 1; s.color = cardColor(face(s, card)); } // Flip: semua kartu berganti sisi
    let steps = 1;
    if (v === 10) steps = 2;
    else if (v === 11 || (nm && v === 21)) { s.dir = (s.dir === 1 ? -1 : 1); if (alive(s) === 2) steps = 2; }
    if (drawAmt(f) > 0) { s.pend += drawAmt(f); s.pt = drawAmt(f); }
    if (v === 16 && (nm || fl)) steps = 0; // lewati semua → main lagi
    else if (s.rules.seven && v === 7 && !isWild) { const t = s.hands[chosen] as number[]; s.hands[chosen] = hand.slice(); s.hands[who] = t; }
    else if (s.rules.zero && v === 0 && !isWild) {
      const order: number[] = []; let p = who; do { order.push(p); p = next(s, p); } while (p !== who);
      const old = order.map((i) => s.hands[i] as number[]);
      order.forEach((_, k) => { s.hands[order[(k + 1) % order.length] as number] = old[k] as number[]; });
    } else if ((nm && v === 20) || (fl && v === 26)) { // roulette / tarik warna: pemain berikutnya menarik sampai dapat warna pilihan, lalu dilewati
      const victim = next(s, who); drawUntil(s, victim, (c) => cardColor(face(s, c)) === chosen);
      mercy(s, victim); if (s.win >= 0) return s;
      s.cur = next(s, victim); s.drew = false; return s;
    }
    s.cur = next(s, s.cur, steps); s.drew = false;
    return s;
  },
  /** Jump-in (aturan Custom): pemain di luar giliran memainkan kartu yang persis sama (warna & nilai) dengan kartu teratas. */
  jump(s, p, move) {
    if (!s.rules.jump || s.win >= 0 || p < 0 || p >= s.n || p === s.cur || s.out[p] || s.pend > 0 || move < 100) return null;
    const card = (s.hands[p] as number[])[Math.floor((move - 100) / 5)];
    if (card === undefined) return null;
    const top = face(s, s.discard[s.discard.length - 1] as number), f = face(s, card);
    if (cardColor(top) === 4 || f !== top) return null;
    return uno.apply({ ...s, cur: p, drew: false }, move);
  },
};
