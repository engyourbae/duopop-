import { claimDaily, DAILY_XP_CAP, getProgress, recordResult, resetProgress } from '../features/progression/store';
import { pluralityPoints } from '../features/games/mechanics/Social';
import { roomScores } from '../features/multiplayer/scoring';
import type { GameResult } from '../types';

const res = (id: string, xp = 100, correct = 5, total = 5): GameResult => ({ sessionId: id, gameId: 'duel', at: 0, players: [{ name: 'A', score: 1 }], correct, total, xp });
beforeEach(() => { localStorage.clear(); resetProgress(); });
describe('progresi', () => {
  it('XP tidak bertambah dua kali untuk sesi yang sama', () => {
    recordResult(res('s1')); recordResult(res('s1'));
    expect(getProgress().xp).toBe(100); expect(getProgress().history.length).toBe(1);
  });
  it('dibatasi batas harian', () => {
    const now = new Date(2026, 0, 5);
    for (let i = 0; i < 10; i++) recordResult(res(`s${i}`, 150), now);
    expect(getProgress().xp).toBe(DAILY_XP_CAP);
    recordResult(res('besok', 100), new Date(2026, 0, 6));
    expect(getProgress().xp).toBe(DAILY_XP_CAP + 100);
  });
  it('lencana pertama diberikan', () => { const r = recordResult(res('b1')); expect(r.newBadges).toContain('pemula'); expect(r.newBadges).toContain('sempurna'); });
  it('streak harian naik beruntun, reset bila terlewat, klaim sekali sehari', () => {
    expect(claimDaily(new Date(2026, 2, 1))).toBe(true); expect(claimDaily(new Date(2026, 2, 1))).toBe(false);
    claimDaily(new Date(2026, 2, 2)); expect(getProgress().streak.count).toBe(2);
    claimDaily(new Date(2026, 2, 5)); expect(getProgress().streak.count).toBe(1); expect(getProgress().streak.best).toBe(2);
  });
});
describe('poin kelompok & ruang', () => {
  it('plurality', () => { expect(pluralityPoints([0, 0])).toEqual([1, 1]); expect(pluralityPoints([0, 1])).toEqual([0, 0]); expect(pluralityPoints([0, 0, 1])).toEqual([1, 1, 0]); });
  it('skor ruang diturunkan dari jawaban, abaikan duplikat/terlambat/non-pemain', () => {
    const items = [{ id: 'a', prompt: 'q', options: ['x', 'y'], correct: 1, explanation: '' }];
    const s = roomScores(items, [
      { uid: 'u1', round: 0, choice: 1, atMs: 1000 }, { uid: 'u1', round: 0, choice: 1, atMs: 1000 },
      { uid: 'u2', round: 0, choice: 1, atMs: 99000 }, { uid: 'zz', round: 0, choice: 1, atMs: 1000 }, { uid: 'u3', round: 0, choice: 0, atMs: 1000 },
    ], { '0': 0 }, 10, ['u1', 'u2', 'u3']);
    expect(s).toEqual({ u1: 145, u2: 0, u3: 0 });
  });
});
