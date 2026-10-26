import { buildRounds, roomCapacity, roomKind, roundComplete, scoreRounds, type AnsLite } from '../features/multiplayer/rounds';
import { replayBoard } from '../features/multiplayer/board';
import { GAMES, gameById } from '../features/games/registry';
import { MECH } from '../features/games/GamePage';
import { isFresh, ONLINE_TTL, pickCandidates, type QueueEntry } from '../utils/presence';
import { pickByLevel, buildItems } from '../features/games/engine';
import { genItems, PROVINCES, WORLD_CAPITALS } from '../data/questions/gen';
import { mcqBank } from '../data/questions';
import { rng } from '../utils/rng';

const names = ['@a', '@b', '@c'], uids = ['u1', 'u2', 'u3'];
describe('semua game bisa Mabar', () => {
  it('setiap game punya cara online dan komponen permainan', () => {
    for (const g of GAMES) {
      expect(g.multiplayer, g.id).toBe(true);
      const k = roomKind(g);
      if (k === 'rounds') expect(buildRounds(g, 'seed', 6, names).length, g.id).toBeGreaterThan(0);
      if (k === 'race') expect(MECH[g.mechanic], g.id).toBeTruthy();
      if (k === 'board') expect(roomCapacity(g)).toBe(2);
    }
  });
  it('pemetaan jenis ruang', () => {
    expect(roomKind(gameById('duel')!)).toBe('rounds'); expect(roomKind(gameById('tictactoe')!)).toBe('board'); expect(roomKind(gameById('snake')!)).toBe('race');
    expect(roomKind(gameById('kronologi')!)).toBe('race'); expect(roomKind(gameById('story')!)).toBe('rounds'); expect(roomKind(gameById('howwell')!)).toBe('rounds');
  });
  it('ronde deterministik dari seed', () => { const g = gameById('thisorthat')!; expect(buildRounds(g, 's', 5, names)).toEqual(buildRounds(g, 's', 5, names)); });
});
describe('skor ronde', () => {
  const T0 = 1000, starts = { '0': T0, '1': T0, '2': T0, '3': T0 };
  const A = (uid: string, round: number, choice: number, dt = 1000, text?: string): AnsLite => ({ uid, round, choice, atMs: T0 + dt, text });
  it('kuis: benar dapat poin dengan bonus kecepatan, jawaban terlambat diabaikan', () => {
    const rd = [{ kind: 'all' as const, actor: 0, scoring: 'quiz' as const, prompt: '', options: ['a', 'b'], correct: 1 }];
    const s = scoreRounds(rd, [A('u1', 0, 1, 0), A('u2', 0, 0), A('u3', 0, 1, 99000)], starts, 10, uids);
    expect(s).toEqual({ u1: 150, u2: 0, u3: 0 });
  });
  it('plurality, suara terbanyak, dan tebakan', () => {
    const base = { kind: 'all' as const, actor: 0, prompt: '', options: ['a', 'b', 'c'] };
    expect(scoreRounds([{ ...base, scoring: 'plurality' }], [A('u1', 0, 0), A('u2', 0, 0), A('u3', 0, 1)], starts, 10, uids)).toEqual({ u1: 1, u2: 1, u3: 0 });
    expect(scoreRounds([{ ...base, scoring: 'most' }], [A('u1', 0, 2), A('u2', 0, 2), A('u3', 0, 0)], starts, 10, uids)).toEqual({ u1: 0, u2: 0, u3: 1 });
    expect(scoreRounds([{ ...base, scoring: 'predict', actor: 0 }], [A('u1', 0, 1), A('u2', 0, 1), A('u3', 0, 2)], starts, 10, uids)).toEqual({ u1: 0, u2: 1, u3: 0 });
  });
  it('giliran: hanya pemain giliran yang dapat poin; kata berulang tidak', () => {
    const done = { kind: 'actor' as const, actor: 1, scoring: 'actorDone' as const, prompt: '', options: ['Selesai', 'Lewati'] };
    expect(scoreRounds([done], [A('u1', 0, 0), A('u2', 0, 0)], starts, 10, uids)).toEqual({ u1: 0, u2: 1, u3: 0 });
    const w = (i: number) => ({ kind: 'actor' as const, actor: i, scoring: 'wordchain' as const, prompt: '', options: [], textInput: true, secret: 'pantai' });
    const s = scoreRounds([w(0), w(1), w(2)], [A('u1', 0, 0, 100, 'laut'), A('u2', 1, 0, 100, 'Laut'), A('u3', 2, 0, 100, 'pantai')], starts, 10, uids);
    expect(s).toEqual({ u1: 1, u2: 0, u3: 0 });
  });
  it('ronde selesai bila semua / pemain giliran sudah menjawab', () => {
    expect(roundComplete({ kind: 'all', actor: 0, scoring: 'quiz', prompt: '', options: [] }, ['u1', 'u2'], uids)).toBe(false);
    expect(roundComplete({ kind: 'actor', actor: 2, scoring: 'text', prompt: '', options: [] }, ['u3'], uids)).toBe(true);
  });
});
describe('papan online', () => {
  it('tic-tac-toe: menang dan langkah tidak sah diabaikan', () => {
    const s = replayBoard('tictactoe', [0, 3, 1, 3, 4, 2].map((choice) => ({ choice })));
    expect(s.winner).toBe(1); expect(s.over).toBe(true);
  });
  it('empat sejajar vertikal', () => { expect(replayBoard('connect4', [0, 1, 0, 1, 0, 1, 0].map((choice) => ({ choice }))).winner).toBe(1); });
});
describe('presensi & antrean', () => {
  const E = (uid: string, at: number, status: 'waiting' | 'matched' = 'waiting'): QueueEntry => ({ uid, name: uid, gameId: 'duel', status, at });
  it('online hanya bila detak terbaru', () => { expect(isFresh(1000, 1000 + ONLINE_TTL - 1, ONLINE_TTL)).toBe(true); expect(isFresh(1000, 1000 + ONLINE_TTL, ONLINE_TTL)).toBe(false); expect(isFresh(0, 5, ONLINE_TTL)).toBe(false); });
  it('kandidat: bukan diri sendiri, menunggu, tidak basi, paling lama dulu', () => {
    const now = 100000;
    const list = pickCandidates([E('me', now), E('a', now - 5000), E('b', now - 20000), E('c', now - 50000), E('d', now - 1000, 'matched')], 'me', now);
    expect(list.map((x) => x.uid)).toEqual(['b', 'a']);
  });
});
describe('level & soal tak terbatas', () => {
  it('level tinggi lebih banyak soal sulit daripada level rendah', () => {
    const cnt = (lv: number) => pickByLevel(mcqBank, 10, lv, rng(7)).filter((q) => q.difficulty === 'sulit').length;
    expect(cnt(8)).toBeGreaterThan(cnt(1));
    expect(pickByLevel(mcqBank, 10, 1, rng(7)).every((q) => q.difficulty === 'mudah')).toBe(true);
  });
  it('soal belum dilihat didahulukan', () => {
    const seen = new Set(mcqBank.slice(0, mcqBank.length - 12).map((q) => q.id));
    expect(pickByLevel(mcqBank, 10, undefined, rng(3), seen).every((q) => !seen.has(q.id))).toBe(true);
  });
  it('bank cukup besar dan mode tanpa batas tidak kehabisan soal', () => {
    expect(mcqBank.length).toBeGreaterThanOrEqual(360);
    expect(buildItems(gameById('duel')!, 600, 'x').length).toBe(600);
  });
  it('generator: dua arah, deterministik, dan opsi unik', () => {
    for (const k of ['capital', 'provinsi', 'unsur', 'math']) {
      const a = genItems(k, 40, 's', 5), b = genItems(k, 40, 's', 5);
      expect(a).toEqual(b);
      for (const it of a) { expect(new Set(it.options).size).toBe(it.options.length); expect(it.correct).toBeGreaterThanOrEqual(0); expect(it.correct).toBeLessThan(it.options.length); }
    }
    expect(PROVINCES.length).toBe(38); expect(WORLD_CAPITALS.length).toBeGreaterThanOrEqual(60);
    const m = genItems('math', 5, 'q', 3)[0]!; expect(m.options[m.correct]).toBeDefined();
  });
});
