import type { GameDef } from '../../types';
import { answerPoints, buildItems } from '../games/engine';
import { challenges, rapidFire, storyStarters, wheelSlices, wordPairs } from '../../data/content/party';
import { chemistryBank, deepTalk, knowMe, likelyBank, matchBank, memoryLane, thisOrThat, truthDare, wouldYouRather } from '../../data/content/couples';
import { rng, seedFrom, shuffle } from '../../utils/rng';

/** Cara tiap game dimainkan online. rounds = ronde sinkron; board = giliran papan; race = semua main sendiri-sendiri lalu adu skor. */
export type RoomKind = 'rounds' | 'board' | 'race';
export type Scoring = 'quiz' | 'plurality' | 'most' | 'predict' | 'actorDone' | 'text' | 'wordchain';
const ROUND_MECHS = ['mcq', 'tf', 'era', 'flag', 'pair', 'match', 'likely', 'predict', 'deck', 'wheel', 'story', 'wordchain', 'wordguess'];
export function roomKind(g: GameDef): RoomKind {
  if (g.mechanic === 'tictactoe' || g.mechanic === 'connect4') return 'board';
  return ROUND_MECHS.includes(g.mechanic) ? 'rounds' : 'race';
}
export const roomCapacity = (g: GameDef) => (roomKind(g) === 'board' ? 2 : 8);

export interface RoomRound {
  /** all = semua pemain menjawab; actor = hanya pemain giliran yang menjawab */
  kind: 'all' | 'actor'; actor: number; scoring: Scoring;
  prompt: string; options: string[]; correct?: number; explanation?: string; big?: string; secret?: string; textInput?: boolean; hint?: string;
}
export const DONE_OPTS = ['Selesai', 'Lewati'];

/** Membangun daftar ronde secara deterministik dari seed; semua klien menghasilkan hasil yang sama. */
export function buildRounds(game: GameDef, seed: string, count: number, names: string[]): RoomRound[] {
  const n = Math.max(1, names.length), r = rng(seedFrom(seed));
  const act = (i: number) => i % n;
  switch (game.mechanic) {
    case 'mcq': case 'tf': case 'era': case 'flag':
      return buildItems(game, count, seed).map((it, i) => ({ kind: 'all', actor: act(i), scoring: 'quiz', prompt: it.prompt, options: it.options, correct: it.correct, explanation: it.explanation, big: it.big }));
    case 'pair': {
      const bank = game.bank === 'wouldYouRather' ? wouldYouRather : thisOrThat;
      return shuffle(bank, r).slice(0, count).map((p, i) => ({ kind: 'all', actor: act(i), scoring: 'plurality', prompt: game.bank === 'wouldYouRather' ? 'Kamu lebih pilih…' : 'Pilih salah satu:', options: [...p] }));
    }
    case 'match': {
      const bank = game.bank === 'chemistryBank' ? chemistryBank : matchBank;
      return shuffle(bank, r).slice(0, count).map((q, i) => ({ kind: 'all', actor: act(i), scoring: 'plurality', prompt: q.q, options: q.o }));
    }
    case 'likely':
      return shuffle(likelyBank, r).slice(0, count).map((t, i) => ({ kind: 'all', actor: act(i), scoring: 'most', prompt: `Siapa yang paling mungkin ${t}?`, options: names }));
    case 'predict': {
      const rows = game.bank === 'knowMe' ? shuffle(knowMe, r).slice(0, count) : shuffle(wouldYouRather, r).slice(0, count).map((p) => ({ q: 'Kalau harus memilih, aku akan…', o: [...p] }));
      return rows.map((q, i) => ({ kind: 'all', actor: act(i), scoring: 'predict', prompt: q.q, options: q.o, hint: `${names[act(i)] ?? ''} menjawab tentang dirinya; yang lain menebak.` }));
    }
    case 'deck': {
      const cards = game.bank === 'memoryLane' ? memoryLane : game.bank === 'deepTalk' ? deepTalk.map((d) => d.q) : game.bank === 'rapidFire' ? rapidFire : game.bank === 'truthDare' ? truthDare : challenges;
      return shuffle(cards, r).slice(0, count).map((c, i) => ({ kind: 'actor', actor: act(i), scoring: 'actorDone', prompt: c, options: DONE_OPTS }));
    }
    case 'wheel':
      return Array.from({ length: count }, (_, i) => ({ kind: 'actor' as const, actor: act(i), scoring: 'actorDone' as const, prompt: `Roda memilih: ${wheelSlices[Math.floor(r() * wheelSlices.length)]}`, options: DONE_OPTS }));
    case 'wordguess':
      return shuffle(wordPairs, r).slice(0, Math.max(count, n * 2)).map((w, i) => ({ kind: 'actor', actor: act(i), scoring: 'actorDone', prompt: `${names[act(i)] ?? ''} menjelaskan, yang lain menebak!`, secret: w, options: ['Benar ditebak', 'Lewati'] }));
    case 'story': {
      const total = Math.max(n * 2, count);
      return Array.from({ length: total }, (_, i) => ({ kind: 'actor' as const, actor: act(i), scoring: 'text' as const, prompt: i === 0 ? (shuffle(storyStarters, r)[0] ?? '') : 'Lanjutkan ceritanya dengan satu kalimat.', options: [], textInput: true }));
    }
    case 'wordchain': {
      const start = shuffle(wordPairs, r)[0] ?? 'Pantai';
      return Array.from({ length: Math.max(n * 3, count) }, (_, i) => ({ kind: 'actor' as const, actor: act(i), scoring: 'wordchain' as const, prompt: i === 0 ? `Kata awal: ${start}` : 'Ketik kata yang berhubungan dengan kata sebelumnya.', options: [], textInput: true, secret: start }));
    }
    default: return [];
  }
}

export interface AnsLite { uid: string; round: number; choice: number; atMs: number | null; text?: string }
const tally = (arr: number[]) => { const m = new Map<number, number>(); arr.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1)); return m; };

/** Skor murni dari jawaban + waktu server. Jawaban terlambat, ganda, atau dari non-pemain diabaikan. */
export function scoreRounds(rounds: RoomRound[], answers: AnsLite[], startsMs: Record<string, number | null>, secs: number, uids: string[]): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(uids.map((u) => [u, 0]));
  const byRound = new Map<number, AnsLite[]>();
  const seen = new Set<string>();
  for (const a of answers) {
    const key = `${a.round}_${a.uid}`, start = startsMs[String(a.round)];
    if (seen.has(key) || !(a.uid in out) || start == null || a.atMs == null) continue;
    if ((a.atMs - start) / 1000 > secs + 2) continue;
    seen.add(key);
    byRound.set(a.round, [...(byRound.get(a.round) ?? []), a]);
  }
  const usedWords = new Set<string>();
  rounds.forEach((rd, i) => {
    const list = byRound.get(i) ?? [], actorUid = uids[rd.actor];
    const start = startsMs[String(i)] ?? 0;
    switch (rd.scoring) {
      case 'quiz': list.forEach((a) => { out[a.uid] = (out[a.uid] ?? 0) + answerPoints(a.choice === rd.correct, 1 - Math.max(0, ((a.atMs ?? start) - start) / 1000) / secs); }); break;
      case 'plurality': {
        const t = tally(list.map((a) => a.choice)), max = Math.max(0, ...t.values());
        if (list.length > 1 && max === 1) break;
        list.forEach((a) => { if (t.get(a.choice) === max) out[a.uid] = (out[a.uid] ?? 0) + 1; });
        break;
      }
      case 'most': {
        const t = tally(list.map((a) => a.choice)), max = Math.max(0, ...t.values());
        if (max > 0) t.forEach((v, k) => { const u = uids[k]; if (v === max && u) out[u] = (out[u] ?? 0) + 1; });
        break;
      }
      case 'predict': {
        const truth = list.find((a) => a.uid === actorUid);
        if (truth) list.forEach((a) => { if (a.uid !== actorUid && a.choice === truth.choice) out[a.uid] = (out[a.uid] ?? 0) + 1; });
        break;
      }
      case 'actorDone': { const a = list.find((x) => x.uid === actorUid); if (a && a.choice === 0 && actorUid) out[actorUid] = (out[actorUid] ?? 0) + 1; break; }
      case 'text': { const a = list.find((x) => x.uid === actorUid); if (a && (a.text ?? '').trim().length >= 3 && actorUid) out[actorUid] = (out[actorUid] ?? 0) + 1; break; }
      case 'wordchain': {
        if (i === 0 && rd.secret) usedWords.add(rd.secret.toLowerCase());
        const a = list.find((x) => x.uid === actorUid), w = (a?.text ?? '').trim().toLowerCase();
        if (a && w.length >= 2 && !usedWords.has(w) && actorUid) { out[actorUid] = (out[actorUid] ?? 0) + 1; usedWords.add(w); }
        break;
      }
    }
  });
  return out;
}
/** Ronde selesai bila semua (kind all) atau pemain giliran (kind actor) sudah menjawab. */
export function roundComplete(rd: RoomRound, answered: string[], uids: string[]): boolean {
  return rd.kind === 'all' ? uids.every((u) => answered.includes(u)) : answered.includes(uids[rd.actor] ?? '');
}
