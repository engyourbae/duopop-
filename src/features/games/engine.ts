import type { ChoiceQuestion, GameDef, Question } from '../../types';
import { allQuestions, mythQuestions, eraQuestions, mcqBank, MYTH_OPTIONS } from '../../data/questions';
import { countries, flagEmoji } from '../../data/content/countries';
import { rng, seedFrom, shuffle } from '../../utils/rng';
import { genItems } from '../../data/questions/gen';

/** Item siap-main untuk pilihan ganda; urutan opsi sudah diacak. */
export interface PlayItem { id: string; prompt: string; options: string[]; correct: number; explanation: string; big?: string }

export function toPlayItem(q: ChoiceQuestion, r: () => number): PlayItem {
  if (q.type === 'tf3') return { id: q.id, prompt: q.question, options: MYTH_OPTIONS, correct: q.correctAnswer, explanation: q.explanation };
  const order = shuffle(q.options.map((_, i) => i), r);
  return { id: q.id, prompt: q.question, options: order.map((i) => q.options[i] as string), correct: order.indexOf(q.correctAnswer), explanation: q.explanation };
}

export function flagItems(r: () => number): PlayItem[] {
  return shuffle(countries, r).map((c) => {
    const wrong = shuffle(countries.filter((x) => x.code !== c.code), r).slice(0, 3).map((x) => x.name);
    const opts = shuffle([c.name, ...wrong], r);
    return { id: `flag-${c.code}`, prompt: 'Bendera negara apakah ini?', big: flagEmoji(c.code), options: opts, correct: opts.indexOf(c.name), explanation: `Itu bendera ${c.name} (kode ${c.code}).` };
  });
}

export function poolFor(game: GameDef): ChoiceQuestion[] {
  if (game.mechanic === 'tf' || game.mechanic === 'chain-tf') return mythQuestions;
  if (game.mechanic === 'era') return eraQuestions;
  const cats = game.categories;
  return mcqBank.filter((q) => !cats || cats.includes(q.category));
}

const DIFF_ORDER = ['mudah', 'sedang', 'sulit'] as const;
/** Memilih soal: soal belum pernah dilihat didahulukan; pada mode level komposisi kesulitan naik bertahap. */
export function pickByLevel(pool: ChoiceQuestion[], count: number, level: number | undefined, r: () => number, seen?: Set<string>): ChoiceQuestion[] {
  const order = (arr: ChoiceQuestion[]) => { const s = shuffle(arr, r); return seen ? [...s.filter((q) => !seen.has(q.id)), ...s.filter((q) => seen.has(q.id))] : s; };
  let picks: ChoiceQuestion[];
  if (!level) picks = order(pool).slice(0, count);
  else {
    const hardP = Math.min(0.8, Math.max(0, (level - 3) * 0.2)), easyP = Math.max(0, 1 - (level - 1) * 0.3);
    const nE = Math.round(count * easyP), nH = Math.round(count * hardP), nM = Math.max(0, count - nE - nH);
    const want = { mudah: nE, sedang: nM, sulit: nH };
    picks = [];
    for (const d of DIFF_ORDER) picks.push(...order(pool.filter((q) => q.difficulty === d)).slice(0, want[d]));
    if (picks.length < count) {
      const have = new Set(picks.map((q) => q.id)), target = level < 3 ? 0 : level < 6 ? 1 : 2;
      const rest = order(pool.filter((q) => !have.has(q.id))).sort((x, y) => Math.abs(DIFF_ORDER.indexOf(x.difficulty) - target) - Math.abs(DIFF_ORDER.indexOf(y.difficulty) - target));
      picks.push(...rest.slice(0, count - picks.length));
    }
    picks.sort((x, y) => DIFF_ORDER.indexOf(x.difficulty) - DIFF_ORDER.indexOf(y.difficulty));
  }
  while (picks.length < count && pool.length) picks.push(...shuffle(pool, r).slice(0, count - picks.length)); // soal habis → putar ulang (mode tanpa batas)
  return picks;
}

export interface BuildOpts { level?: number; seen?: Set<string> }
export function buildItems(game: GameDef, count: number, seed: string, opts: BuildOpts = {}): PlayItem[] {
  const r = rng(seedFrom(seed));
  if (game.mechanic === 'flag') { const out: PlayItem[] = []; while (out.length < count) out.push(...flagItems(r)); return out.slice(0, count); }
  if (game.bank === 'daily') return shuffle(mcqBank, r).slice(0, 6).map((q) => toPlayItem(q, r));
  if (game.bank?.startsWith('gen:')) return genItems(game.bank.slice(4), count, seed, opts.level ?? 1);
  return pickByLevel(poolFor(game), count, opts.level, r, opts.seen).map((q) => toPlayItem(q, r));
}

export const QUESTION_COUNT = allQuestions.length;

// ---------- Skor ----------
export function answerPoints(isCorrect: boolean, timeFrac: number): number {
  if (!isCorrect) return 0;
  return 100 + Math.round(50 * Math.max(0, Math.min(1, timeFrac)));
}
export function estimatePoints(guess: number, answer: number): number {
  if (!Number.isFinite(guess)) return 0;
  const rel = Math.abs(guess - answer) / Math.max(Math.abs(answer), 1);
  if (rel === 0) return 100;
  return Math.max(0, Math.round(100 * (1 - Math.min(1, rel))));
}
export function orderPoints(user: number[], correct: number[]): number {
  return user.reduce((n, v, i) => n + (v === correct[i] ? 1 : 0), 0) * 25;
}
export function cluePoints(shown: number, wrongGuesses: number): number {
  return Math.max(10, 100 - (shown - 1) * 25 - wrongGuesses * 15);
}
export function chainMultiplier(streak: number): number { return 1 + Math.floor(streak / 3) * 0.5; }

// ---------- Mesin kuis (reducer murni, mudah diuji) ----------
export interface QuizState { index: number; scores: number[]; correct: number; chosen: number | null; streak: number; done: boolean; log: boolean[]; wrong: number }
export type QuizAction = { type: 'answer'; choice: number; timeFrac: number } | { type: 'next' };
export const initialQuiz = (players: number): QuizState => ({ index: 0, scores: Array(players).fill(0), correct: 0, chosen: null, streak: 0, done: false, log: [], wrong: 0 });

/** chain: berhenti pada salah pertama; maxWrong>0: berhenti setelah salah sebanyak itu (mode tanpa batas). */
export function quizReducer(s: QuizState, a: QuizAction, items: PlayItem[], chain = false, maxWrong = 0): QuizState {
  if (s.done) return s;
  if (a.type === 'answer') {
    if (s.chosen !== null) return s; // cegah jawaban ganda pada ronde yang sama
    const item = items[s.index];
    if (!item) return s;
    const ok = a.choice === item.correct;
    const turn = s.index % s.scores.length;
    const scores = s.scores.slice();
    const streak = ok ? s.streak + 1 : 0;
    scores[turn] = (scores[turn] ?? 0) + Math.round(answerPoints(ok, a.timeFrac) * (chain ? chainMultiplier(s.streak) : 1));
    return { ...s, chosen: a.choice, scores, streak, correct: s.correct + (ok ? 1 : 0), log: [...s.log, ok], wrong: s.wrong + (ok ? 0 : 1) };
  }
  if (s.chosen === null) return s;
  const lastWrongChain = (chain && s.log[s.log.length - 1] === false) || (maxWrong > 0 && s.wrong >= maxWrong);
  const next = s.index + 1;
  return { ...s, index: next, chosen: null, done: next >= items.length || lastWrongChain };
}

export function levelInfo(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const floor = (level - 1) ** 2 * 100, ceil = level ** 2 * 100;
  return { level, into: xp - floor, need: ceil - floor, pct: (xp - floor) / (ceil - floor) };
}
export const xpForResult = (correct: number, total: number, perfectBonus = true) =>
  Math.min(150, correct * 10 + (perfectBonus && total > 0 && correct === total ? 20 : 0) + 10);
export const rankPlayers = (players: { name: string; score: number }[]) => players.slice().sort((a, b) => b.score - a.score);
export type { Question };
