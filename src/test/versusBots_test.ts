import { c4Bot, memoryPick, reflexMs, rpsBot, runnerScore, tttBot, buzzPlan, botAnswer } from '../features/games/versusBots';
import { dropC4, emptyC4, c4Winner } from '../features/games/logic';

const hi = () => 0.99; // tidak pernah "meleset" / selalu pilihan terakhir
describe('bot game versus', () => {
  it('Tic-Tac-Toe: serius mengambil kemenangan dan menutup kemenangan lawan', () => {
    expect(tttBot([1, 1, 0, 2, 2, 0, 0, 0, 0], 1, 'serius', hi)).toBe(2); // X menang di petak 2
    expect(tttBot([0, 0, 0, 2, 2, 0, 1, 0, 0], 1, 'serius', hi)).toBe(5); // X menutup O di petak 5
    const b = Array(9).fill(0); for (let k = 0; k < 9; k++) { const m = tttBot(b, (k % 2 === 0 ? 1 : 2), 'serius', hi); expect(b[m]).toBe(0); b[m] = k % 2 === 0 ? 1 : 2; }
  });
  it('Empat Sejajar: serius menang bila bisa dan menutup 3 sejajar lawan', () => {
    const b = emptyC4(); for (const c of [0, 0, 0]) b[dropC4(b, c)] = 1; // X punya 3 vertikal di kolom 0
    expect(c4Bot(b, 1, 'serius', hi)).toBe(0); // X menyelesaikan 4
    const b2 = emptyC4(); for (const c of [3, 3, 3]) b2[dropC4(b2, c)] = 2; // O punya 3 vertikal di kolom 3
    expect(c4Bot(b2, 1, 'serius', hi)).toBe(3); // X wajib menutup
    const b3 = emptyC4(); const col = c4Bot(b3, 1, 'santai', () => 0.5); expect(dropC4(b3, col)).toBeGreaterThanOrEqual(0); expect(c4Winner(b3).winner).toBe(0);
  });
  it('Suit: bot serius mengalahkan lawan yang selalu memilih sama; santai tetap sah', () => {
    const hist = Array.from({ length: 8 }, () => [0]); // lawan selalu batu
    expect(rpsBot(hist, 'serius', hi)).toBe(2); // kertas menang atas batu
    for (let k = 0; k < 20; k++) { const m = rpsBot([], 'santai', () => k / 20); expect(m >= 0 && m <= 2).toBeTruthy(); }
  });
  it('Pasangan Kartu: serius membuka pasangan yang sudah diketahui', () => {
    const deck = ['a', 'b', 'a', 'c', 'b', 'c'], seen = new Map<number, string>([[0, 'a'], [2, 'a']]);
    expect(memoryPick(deck, seen, new Set(), [], 'serius', () => 0.1)).toBe(0);
    expect(memoryPick(deck, seen, new Set(), [0], 'serius', () => 0.1)).toBe(2);
  });
  it('refleks, rebutan, dan skor bergiliran berada di rentang wajar', () => {
    expect(reflexMs('serius', () => 0)).toBe(230); expect(reflexMs('santai', () => 0)).toBe(380);
    expect(buzzPlan('serius', 10, () => 0).at).toBe(4); expect(botAnswer('serius', 2, 4, () => 0)).toBe(2);
    expect(botAnswer('serius', 2, 4, hi)).not.toBe(2);
    for (const k of ['typing', 'tap', 'anagram', 'whack'] as const) { const s = runnerScore(k, 'santai', 30, () => 0.5), t = runnerScore(k, 'serius', 30, () => 0.5); expect(t).toBeGreaterThan(s); }
  });
});
