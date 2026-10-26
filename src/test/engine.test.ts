import { answerPoints, buildItems, chainMultiplier, estimatePoints, initialQuiz, levelInfo, orderPoints, quizReducer, cluePoints, type PlayItem } from '../features/games/engine';
import { GAMES } from '../features/games/registry';
import { rng, seedFrom } from '../utils/rng';

const items: PlayItem[] = [0, 1, 2].map((i) => ({ id: `i${i}`, prompt: 'q', options: ['a', 'b', 'c'], correct: i, explanation: 'e' }));
describe('skor', () => {
  it('poin jawaban', () => { expect(answerPoints(false, 1)).toBe(0); expect(answerPoints(true, 0)).toBe(100); expect(answerPoints(true, 1)).toBe(150); expect(answerPoints(true, 5)).toBe(150); });
  it('estimasi', () => { expect(estimatePoints(100, 100)).toBe(100); expect(estimatePoints(50, 100)).toBe(50); expect(estimatePoints(1000, 100)).toBe(0); expect(estimatePoints(NaN, 1)).toBe(0); });
  it('urutan', () => { expect(orderPoints([0, 1, 2, 3], [0, 1, 2, 3])).toBe(100); expect(orderPoints([1, 0, 2, 3], [0, 1, 2, 3])).toBe(50); });
  it('petunjuk dan pengali rantai', () => { expect(cluePoints(1, 0)).toBe(100); expect(cluePoints(4, 2)).toBe(10); expect(cluePoints(2, 0)).toBe(75); expect(chainMultiplier(0)).toBe(1); expect(chainMultiplier(3)).toBe(1.5); });
  it('level', () => { expect(levelInfo(0).level).toBe(1); expect(levelInfo(100).level).toBe(2); expect(levelInfo(450).level).toBe(3); });
});
describe('reducer kuis', () => {
  it('pergantian ronde, giliran, dan selesai', () => {
    let s = initialQuiz(2);
    s = quizReducer(s, { type: 'answer', choice: 0, timeFrac: 1 }, items);
    expect(s.scores).toEqual([150, 0]); expect(s.chosen).toBe(0);
    s = quizReducer(s, { type: 'answer', choice: 0, timeFrac: 1 }, items); // jawaban ganda diabaikan
    expect(s.scores).toEqual([150, 0]);
    s = quizReducer(s, { type: 'next' }, items); expect(s.index).toBe(1); expect(s.chosen).toBeNull();
    s = quizReducer(s, { type: 'answer', choice: 0, timeFrac: 1 }, items); expect(s.scores).toEqual([150, 0]); // salah, pemain 2
    s = quizReducer(s, { type: 'next' }, items);
    s = quizReducer(s, { type: 'answer', choice: 2, timeFrac: 0 }, items);
    s = quizReducer(s, { type: 'next' }, items);
    expect(s.done).toBe(true); expect(s.correct).toBe(2); expect(s.scores).toEqual([250, 0]);
  });
  it('next tanpa jawaban tidak maju', () => { const s = initialQuiz(1); expect(quizReducer(s, { type: 'next' }, items)).toEqual(s); });
  it('mode berantai berakhir saat salah', () => {
    let s = initialQuiz(1);
    s = quizReducer(s, { type: 'answer', choice: 2, timeFrac: 0 }, items, true);
    s = quizReducer(s, { type: 'next' }, items, true);
    expect(s.done).toBe(true);
  });
});
describe('pembuat soal', () => {
  it('deterministik per seed', () => { const g = GAMES.find((x) => x.id === 'duel')!; expect(buildItems(g, 10, 's1')).toEqual(buildItems(g, 10, 's1')); expect(buildItems(g, 10, 's1')).not.toEqual(buildItems(g, 10, 's2')); });
  it('semua game kuis menghasilkan item valid dengan kunci di rentang', () => {
    for (const g of GAMES.filter((x) => ['mcq', 'tf', 'chain-tf', 'era', 'flag'].includes(x.mechanic))) {
      const it = buildItems(g, 10, 'test');
      expect(it.length, g.id).toBeGreaterThan(0);
      for (const i of it) { expect(i.correct).toBeGreaterThanOrEqual(0); expect(i.correct).toBeLessThan(i.options.length); expect(new Set(i.options).size).toBe(i.options.length); }
    }
  });
  it('registry: id unik dan 6 inti', () => { expect(GAMES.length).toBeGreaterThanOrEqual(55); expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length); expect(GAMES.filter((g) => g.core).length).toBe(6); });
  it('rng deterministik', () => { const a = rng(seedFrom('x')), b = rng(seedFrom('x')); expect([a(), a()]).toEqual([b(), b()]); });
});
