import type { CSSProperties } from 'react';
import { C4_COLS, C4_ROWS, type Cell } from '../logic';

/** Papan Empat Sejajar: seluruh kolom adalah satu tombol besar, cakram jatuh dengan animasi. */
export function C4Board({ cells, winLine, onDrop, disabled, turn }: { cells: readonly Cell[]; winLine: readonly number[]; onDrop: (col: number) => void; disabled?: boolean; turn?: 1 | 2 }) {
  const style = { gridTemplateColumns: `repeat(${C4_COLS}, 1fr)`, '--tc': turn === 2 ? 'var(--yellow)' : 'var(--red)' } as CSSProperties;
  return (
    <div className="c4" style={style}>
      {Array.from({ length: C4_COLS }, (_, c) => (
        <button key={c} type="button" className="c4col" disabled={disabled} onClick={() => onDrop(c)} aria-label={`Jatuhkan di kolom ${c + 1}`}>
          <span className="c4head" aria-hidden="true">▼</span>
          {Array.from({ length: C4_ROWS }, (_, r) => {
            const i = r * C4_COLS + c;
            const v = cells[i] ?? 0;
            return (
              <span key={r} className={`c4cell ${winLine.includes(i) ? 'win' : ''}`}>
                <span className={`disc ${v ? `d${v} drop` : ''}`} style={{ '--fall': r + 1 } as CSSProperties} />
              </span>
            );
          })}
        </button>
      ))}
    </div>
  );
}
