import { c4Winner, dropC4, emptyC4, memoryDeck, tttWinner, C4_COLS, type Cell } from '../features/games/logic';
import { rng, seedFrom, shuffle } from '../utils/rng';

describe('Tic-Tac-Toe', () => {
  it('mendeteksi menang mendatar, menurun, miring', () => {
    expect(tttWinner([1, 1, 1, 0, 2, 2, 0, 0, 0]).winner).toBe(1);
    expect(tttWinner([2, 0, 1, 2, 1, 0, 2, 0, 0]).winner).toBe(2);
    expect(tttWinner([1, 2, 0, 2, 1, 0, 0, 0, 1]).winner).toBe(1);
    expect(tttWinner([1, 2, 1, 1, 2, 2, 2, 1, 1]).winner).toBe(0);
  });
});
describe('Empat Sejajar', () => {
  it('cakram jatuh ke dasar dan kolom bisa penuh', () => {
    let b = emptyC4();
    expect(dropC4(b, 3)).toBe(5 * C4_COLS + 3);
    for (let i = 0; i < 6; i++) { const idx = dropC4(b, 0); b = b.slice() as Cell[]; b[idx] = (i % 2 ? 1 : 2) as Cell; }
    expect(dropC4(b, 0)).toBe(-1);
  });
  it('mendeteksi 4 sejajar ke semua arah', () => {
    const mk = (cells: number[]) => { const b = emptyC4(); cells.forEach((c) => { b[c] = 1; }); return b; };
    expect(c4Winner(mk([35, 36, 37, 38])).winner).toBe(1);      // mendatar
    expect(c4Winner(mk([35, 28, 21, 14])).winner).toBe(1);      // menurun
    expect(c4Winner(mk([35, 29, 23, 17])).winner).toBe(1);      // miring
    expect(c4Winner(mk([38, 30, 22, 14])).winner).toBe(1);      // miring lain
    expect(c4Winner(mk([35, 36, 37])).winner).toBe(0);
  });
});
describe('Pasangan Kartu', () => {
  it('dek berisi tiap ikon tepat dua kali dan deterministik', () => {
    const d = memoryDeck(8, (a) => shuffle(a, rng(seedFrom('x'))));
    expect(d.length).toBe(16);
    for (const k of new Set(d)) expect(d.filter((x) => x === k).length).toBe(2);
    expect(d).toEqual(memoryDeck(8, (a) => shuffle(a, rng(seedFrom('x')))));
  });
});
