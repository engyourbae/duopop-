/** Logika murni game papan (mudah diuji). */
export type Cell = 0 | 1 | 2; // 0 kosong, 1 pemain A, 2 pemain B
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]] as const;
export function tttWinner(b: readonly Cell[]): { winner: 1 | 2 | 0; line: readonly number[] } {
  for (const l of LINES) { const v = b[l[0]] as Cell; if (v && v === b[l[1]] && v === b[l[2]]) return { winner: v, line: l }; }
  return { winner: 0, line: [] };
}
export const C4_COLS = 7, C4_ROWS = 6;
export const emptyC4 = (): Cell[] => Array(C4_COLS * C4_ROWS).fill(0) as Cell[];
/** Jatuhkan cakram di kolom; mengembalikan indeks sel atau -1 bila kolom penuh. Indeks = baris*7+kolom, baris 0 di atas. */
export function dropC4(b: readonly Cell[], col: number): number {
  for (let r = C4_ROWS - 1; r >= 0; r--) if (b[r * C4_COLS + col] === 0) return r * C4_COLS + col;
  return -1;
}
export function c4Winner(b: readonly Cell[]): { winner: 1 | 2 | 0; cells: number[] } {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;
  for (let r = 0; r < C4_ROWS; r++) for (let c = 0; c < C4_COLS; c++) {
    const v = b[r * C4_COLS + c] as Cell;
    if (!v) continue;
    for (const [dr, dc] of dirs) {
      const cells = [r * C4_COLS + c];
      for (let k = 1; k < 4; k++) {
        const rr = r + dr * k, cc = c + dc * k;
        if (rr < 0 || rr >= C4_ROWS || cc < 0 || cc >= C4_COLS || b[rr * C4_COLS + cc] !== v) break;
        cells.push(rr * C4_COLS + cc);
      }
      if (cells.length === 4) return { winner: v, cells };
    }
  }
  return { winner: 0, cells: [] };
}
export const MEMORY_ICONS = ['heart', 'star', 'bolt', 'sun', 'fire', 'flag', 'trophy', 'bell', 'globe', 'book', 'flask', 'puzzle'];
export function memoryDeck(pairs: number, shuffleFn: <T>(a: readonly T[]) => T[]): string[] {
  const icons = MEMORY_ICONS.slice(0, Math.max(2, Math.min(pairs, MEMORY_ICONS.length)));
  return shuffleFn([...icons, ...icons]);
}
export const STROOP = [
  { name: 'MERAH', color: '#e0401f' }, { name: 'BIRU', color: '#2a4bff' }, { name: 'HIJAU', color: '#0f8f5f' }, { name: 'KUNING', color: '#e8a800' },
] as const;
