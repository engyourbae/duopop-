import { C4_COLS, C4_ROWS, c4Winner, dropC4 } from './logic';

/** Bot untuk game versus satu layar. Santai: sering salah/acak. Serius: berhitung, tapi tetap bisa dikalahkan. */
export type BotLevel = 'santai' | 'serius';
type Rnd = () => number;
const pickOf = <T,>(a: T[], rnd: Rnd) => a[Math.floor(rnd() * a.length)] as T;

// ---------- Tic-Tac-Toe (sel: 0 kosong, 1 X, 2 O) ----------
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const tttWins = (b: readonly number[], m: number) => LINES.some((l) => l.every((i) => b[i] === m));
/** Nilai papan untuk `me` bila giliran `turn` (minimax penuh; papan 3x3 kecil). */
function tttScore(b: number[], me: number, turn: number): number {
  const opp = me === 1 ? 2 : 1;
  if (tttWins(b, me)) return 1; if (tttWins(b, opp)) return -1; if (b.every(Boolean)) return 0;
  let best = turn === me ? -2 : 2;
  for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = turn; const v = tttScore(b, me, turn === 1 ? 2 : 1); b[i] = 0; best = turn === me ? Math.max(best, v) : Math.min(best, v); }
  return best;
}
export function tttBot(board: readonly number[], me: 1 | 2, level: BotLevel, rnd: Rnd = Math.random): number {
  const b = board.slice(), empty = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0), opp = me === 1 ? 2 : 1;
  const imm = (m: number) => empty.find((i) => { b[i] = m; const w = tttWins(b, m); b[i] = 0; return w; });
  if (level === 'santai') { // menang/menutup hanya kadang-kadang, selebihnya acak
    const w = imm(me), blk = imm(opp);
    if (w !== undefined && rnd() < 0.7) return w; if (blk !== undefined && rnd() < 0.5) return blk; return pickOf(empty, rnd);
  }
  if (rnd() < 0.15) return pickOf(empty, rnd); // sesekali meleset supaya bisa dikalahkan
  const scored = empty.map((i) => { b[i] = me; const v = tttScore(b, me, opp); b[i] = 0; return { i, v }; });
  const top = Math.max(...scored.map((x) => x.v));
  return pickOf(scored.filter((x) => x.v === top).map((x) => x.i), rnd);
}

// ---------- Empat Sejajar (7 kolom x 6 baris) ----------
const WINDOWS: number[][] = [];
for (let r = 0; r < C4_ROWS; r++) for (let c = 0; c < C4_COLS; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]] as const) {
  const cells = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k] as const);
  if (cells.every(([rr, cc]) => rr >= 0 && rr < C4_ROWS && cc >= 0 && cc < C4_COLS)) WINDOWS.push(cells.map(([rr, cc]) => rr * C4_COLS + cc));
}
const ORDER = [3, 2, 4, 1, 5, 0, 6];
function c4Eval(b: readonly number[], me: number): number {
  const opp = me === 1 ? 2 : 1; let sc = 0;
  for (let r = 0; r < C4_ROWS; r++) if (b[r * C4_COLS + 3] === me) sc += 3; // kolom tengah lebih berharga
  for (const w of WINDOWS) {
    let m = 0, o = 0; for (const i of w) { if (b[i] === me) m++; else if (b[i] === opp) o++; }
    if (m && o) continue;
    if (m === 3) sc += 6; else if (m === 2) sc += 2; if (o === 3) sc -= 7; else if (o === 2) sc -= 2;
  }
  return sc;
}
function c4Search(b: number[], depth: number, a: number, beta: number, turn: number, me: number): number {
  const opp = me === 1 ? 2 : 1, w = c4Winner(b as never).winner;
  if (w === me) return 10000 + depth; if (w === opp) return -10000 - depth;
  if (depth === 0 || b.every(Boolean)) return b.every(Boolean) ? 0 : c4Eval(b, me);
  let best = turn === me ? -Infinity : Infinity;
  for (const c of ORDER) {
    const idx = dropC4(b as never, c); if (idx < 0) continue;
    b[idx] = turn; const v = c4Search(b, depth - 1, a, beta, turn === 1 ? 2 : 1, me); b[idx] = 0;
    if (turn === me) { best = Math.max(best, v); a = Math.max(a, v); } else { best = Math.min(best, v); beta = Math.min(beta, v); }
    if (beta <= a) break;
  }
  return best;
}
export function c4Bot(board: readonly number[], me: 1 | 2, level: BotLevel, rnd: Rnd = Math.random): number {
  const b = board.slice(), cols = ORDER.filter((c) => dropC4(b as never, c) >= 0), opp = me === 1 ? 2 : 1;
  const wins = (m: number) => cols.find((c) => { const i = dropC4(b as never, c); b[i] = m; const w = c4Winner(b as never).winner === m; b[i] = 0; return w; });
  if (level === 'santai') {
    const w = wins(me), blk = wins(opp);
    if (w !== undefined && rnd() < 0.8) return w; if (blk !== undefined && rnd() < 0.6) return blk;
    return rnd() < 0.4 && cols.includes(3) ? 3 : pickOf(cols, rnd);
  }
  const scored = cols.map((c) => { const i = dropC4(b as never, c); b[i] = me; const v = c4Search(b, 3, -Infinity, Infinity, opp, me) + rnd() * 0.5; b[i] = 0; return { c, v }; }).sort((x, y) => y.v - x.v);
  return rnd() < 0.12 && scored.length > 1 ? (scored[1] as { c: number }).c : (scored[0] as { c: number }).c; // sesekali meleset
}

// ---------- Suit (0 batu, 1 gunting, 2 kertas) ----------
/** `history`: pilihan semua lawan per ronde yang sudah lewat (tanpa pilihan ronde berjalan). */
export function rpsBot(history: number[][], level: BotLevel, rnd: Rnd = Math.random): number {
  const flat = history.flat();
  if (level === 'santai' || flat.length < 3 || rnd() < 0.3) return Math.floor(rnd() * 3);
  const freq = [0, 0, 0]; flat.forEach((x) => { freq[x] = (freq[x] ?? 0) + 1; });
  // pola: apa yang biasanya dipilih lawan setelah pilihan terakhirnya
  const last = (history[history.length - 1] ?? [])[0], trans = [0, 0, 0];
  if (last !== undefined) for (let k = 1; k < history.length; k++) if ((history[k - 1] ?? [])[0] === last) { const n = (history[k] ?? [])[0]; if (n !== undefined) trans[n] = (trans[n] ?? 0) + 1; }
  const pool = trans.some((x) => x >= 2) ? trans : freq, predicted = pool.indexOf(Math.max(...pool));
  return (predicted + 2) % 3; // pilihan yang mengalahkan prediksi
}

// ---------- Adu Refleks ----------
export const reflexMs = (level: BotLevel, rnd: Rnd = Math.random) => (level === 'serius' ? 230 + rnd() * 160 : 380 + rnd() * 330);

// ---------- Kuis Rebutan ----------
/** Rencana bot untuk satu soal: kata ke berapa ia menekan bel (null = tidak menekan) dan peluang menjawab benar. */
export function buzzPlan(level: BotLevel, words: number, rnd: Rnd = Math.random): { at: number | null; correct: number } {
  if (level === 'serius') return { at: rnd() < 0.9 ? Math.max(1, Math.floor(words * (0.45 + rnd() * 0.45))) : null, correct: 0.8 };
  return { at: rnd() < 0.6 ? Math.max(1, Math.floor(words * (0.6 + rnd() * 0.55))) : null, correct: 0.5 };
}
export function botAnswer(level: BotLevel, correct: number, options: number, rnd: Rnd = Math.random): number {
  if (rnd() < (level === 'serius' ? 0.8 : 0.5)) return correct;
  const wrong = [...Array(options).keys()].filter((i) => i !== correct); return pickOf(wrong, rnd);
}

// ---------- Pasangan Kartu ----------
/** Pilih kartu yang dibuka bot. `seen`: kartu yang pernah terbuka (indeks -> isi), `open`: kartu terbuka sekarang. */
export function memoryPick(deck: readonly string[], seen: Map<number, string>, done: ReadonlySet<number>, open: readonly number[], level: BotLevel, rnd: Rnd = Math.random): number {
  const remember = level === 'serius' ? 0.9 : 0.45, avail = deck.map((_, i) => i).filter((i) => !done.has(i) && !open.includes(i));
  if (open.length === 1) { // pembuka kedua: cari pasangan yang sudah diketahui
    const f = open[0] as number, mate = [...seen.entries()].find(([i, v]) => i !== f && !done.has(i) && v === deck[f]);
    if (mate && rnd() < remember) return mate[0];
    const unknown = avail.filter((i) => !seen.has(i)); return pickOf(unknown.length ? unknown : avail, rnd);
  }
  const byVal = new Map<string, number[]>(); seen.forEach((v, i) => { if (!done.has(i)) byVal.set(v, [...(byVal.get(v) ?? []), i]); });
  const pair = [...byVal.values()].find((l) => l.length >= 2);
  if (pair && rnd() < remember) return pair[0] as number;
  const unknown = avail.filter((i) => !seen.has(i)); return pickOf(unknown.length ? unknown : avail, rnd);
}

// ---------- Game skor bergiliran (Adu Mengetik, Adu Ketuk, Susun Huruf, Pukul Tikus) ----------
export type RunnerKind = 'typing' | 'tap' | 'anagram' | 'whack';
/** Skor perkiraan bot untuk satu giliran; `secs` = durasi game. */
export function runnerScore(kind: RunnerKind, level: BotLevel, secs: number, rnd: Rnd = Math.random): number {
  const u = (a: number, b: number) => a + (b - a) * rnd(), s = level === 'serius';
  switch (kind) {
    case 'typing': return Math.round((s ? u(42, 70) : u(18, 36)) * 10 * (s ? u(0.94, 0.995) : u(0.82, 0.95)));
    case 'tap': return Math.round((s ? u(5.2, 7.2) : u(3, 4.6)) * secs);
    case 'anagram': return Math.round((s ? u(0.12, 0.18) : u(0.05, 0.1)) * secs) * 100;
    case 'whack': return Math.round((s ? u(0.55, 0.85) : u(0.25, 0.45)) * secs);
  }
}
