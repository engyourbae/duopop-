import { c4Winner, dropC4, emptyC4, tttWinner, type Cell } from '../games/logic';

export interface BoardState { cells: Cell[]; moves: number; winner: 0 | 1 | 2; draw: boolean; over: boolean; winLine: readonly number[] }
/** Mereplay langka berurutan; langkah tidak sah diabaikan. Pemain 1 = uids[0]. */
export function replayBoard(kind: 'tictactoe' | 'connect4', ordered: { choice: number }[]): BoardState {
  const cells: Cell[] = kind === 'tictactoe' ? (Array(9).fill(0) as Cell[]) : emptyC4();
  let moves = 0, winner: 0 | 1 | 2 = 0, line: readonly number[] = [];
  for (const m of ordered) {
    if (winner) break;
    const p = ((moves % 2) + 1) as 1 | 2;
    if (kind === 'tictactoe') { if (m.choice < 0 || m.choice > 8 || cells[m.choice]) continue; cells[m.choice] = p; const w = tttWinner(cells); if (w.winner) { winner = w.winner; line = w.line; } }
    else { if (m.choice < 0 || m.choice > 6) continue; const idx = dropC4(cells, m.choice); if (idx < 0) continue; cells[idx] = p; const w = c4Winner(cells); if (w.winner) { winner = w.winner; line = w.cells; } }
    moves++;
  }
  const draw = !winner && cells.every(Boolean);
  return { cells, moves, winner, draw, over: !!winner || draw, winLine: line };
}
