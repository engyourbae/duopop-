import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ProgressBar } from '../../../components/ui';
import { Icon } from '../../../components/Icon';
import { sfx } from '../../../utils/sound';
import { rng, seedFrom, shuffle } from '../../../utils/rng';
import { Scoreboard } from './Quiz';
import { c4Winner, C4_COLS, C4_ROWS, dropC4, emptyC4, memoryDeck, tttWinner, type Cell } from '../logic';
import type { MechProps } from './types';

export function MemoryMech({ players, seed, count, onDone }: MechProps) {
  const deck = useMemo(() => memoryDeck(count, (a) => shuffle(a, rng(seedFrom(seed)))), [count, seed]);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [turn, setTurn] = useState(0);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [moves, setMoves] = useState(0);
  const lock = useRef(false);
  const flip = (i: number) => {
    if (lock.current || open.includes(i) || done.has(i)) return;
    const o = [...open, i];
    setOpen(o);
    if (o.length < 2) return;
    setMoves((m) => m + 1);
    lock.current = true;
    const [a, b] = o as [number, number];
    if (deck[a] === deck[b]) {
      sfx.right();
      const nd = new Set(done); nd.add(a); nd.add(b);
      const ns = scores.map((v, k) => (k === turn ? v + 1 : v));
      setTimeout(() => {
        setDone(nd); setScores(ns); setOpen([]); lock.current = false;
        if (nd.size === deck.length) onDone({ scores: ns, correct: deck.length / 2, total: deck.length / 2, raceScore: Math.max(0, 600 - (moves + 1) * 10), xp: players.length === 1 ? Math.max(10, 60 - Math.max(0, moves + 1 - deck.length / 2) * 3) : undefined });
      }, 500);
    } else {
      sfx.wrong();
      setTimeout(() => { setOpen([]); setTurn((t) => (t + 1) % players.length); lock.current = false; }, 900);
    }
  };
  return (
    <div>
      <ProgressBar value={done.size / deck.length} />
      <p className="muted small gap">{players.length > 1 ? <>Giliran: <b>{players[turn]}</b> · </> : null}Langkah: {moves}</p>
      <div className="mgrid">
        {deck.map((ic, i) => {
          const shown = open.includes(i) || done.has(i);
          return <button key={i} className={`mcard ${shown ? 'up' : ''} ${done.has(i) ? 'matched' : ''}`} onClick={() => flip(i)} aria-label={shown ? ic : 'Kartu tertutup'}>{shown ? <Icon name={ic} size={30} /> : <span>?</span>}</button>;
        })}
      </div>
      <div className="gap"><Scoreboard players={players} scores={scores} turn={turn} /></div>
    </div>
  );
}

/** Satu pemain = uji refleks (dipakai pada adu skor online); dua pemain = duel satu layar. */
export function ReflexMech(p: MechProps) { return p.players.length === 1 ? <ReflexSolo {...p} /> : <ReflexDuel {...p} />; }
function ReflexSolo({ count, onDone }: MechProps) {
  const [phase, setPhase] = useState<'idle' | 'wait' | 'go' | 'res'>('idle');
  const [i, setI] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  const t0 = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const begin = () => { setPhase('wait'); setMsg('Tunggu hijau…'); timer.current = setTimeout(() => { t0.current = performance.now(); setPhase('go'); setMsg('SENTUH!'); }, 1500 + Math.random() * 3000); };
  const tap = () => {
    if (phase === 'wait') { clearTimeout(timer.current); record(1000, 'Terlalu cepat! +1000 ms'); }
    else if (phase === 'go') record(Math.round(performance.now() - t0.current), `${Math.round(performance.now() - t0.current)} ms`);
  };
  const record = (ms: number, text: string) => {
    const all = [...times, ms]; setTimes(all); setMsg(text); setPhase('res'); (ms < 1000 ? sfx.right : sfx.wrong)();
    if (i + 1 >= count) { const avg = all.reduce((a, b) => a + b, 0) / all.length, score = Math.max(0, Math.round(1000 - avg)); setTimeout(() => onDone({ scores: [score], correct: count, total: count, raceScore: score, headline: `Rata-rata ${Math.round(avg)} ms`, xp: Math.min(100, Math.round(score / 10) + 10) }), 1200); }
  };
  return (
    <div className="center"><p className="muted small">Percobaan {Math.min(i + 1, count)}/{count}</p>
      <button className={`rhalf ${phase === 'go' ? 'go' : phase === 'wait' ? 'wait' : ''}`} style={{ width: '100%', minHeight: 280 }} onPointerDown={tap} aria-label="Area refleks"><b>{phase === 'idle' ? 'Siap?' : msg}</b></button>
      {(phase === 'idle' || (phase === 'res' && i + 1 < count)) && <Button size="lg" className="gap" onClick={() => { if (phase === 'res') setI(i + 1); begin(); }}>{phase === 'idle' ? 'Mulai' : 'Berikutnya'}</Button>}</div>
  );
}
function ReflexDuel({ players, count, onDone }: MechProps) {
  const [phase, setPhase] = useState<'idle' | 'wait' | 'go' | 'result'>('idle');
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [msg, setMsg] = useState('');
  const t0 = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const begin = () => {
    setPhase('wait'); setMsg('Tunggu hijau…');
    timer.current = setTimeout(() => { t0.current = performance.now(); setPhase('go'); setMsg('SENTUH!'); sfx.tick(); }, 1500 + Math.random() * 3000);
  };
  const finishRound = (winner: 0 | 1, text: string) => {
    clearTimeout(timer.current);
    const ns: [number, number] = [scores[0] + (winner === 0 ? 1 : 0), scores[1] + (winner === 1 ? 1 : 0)];
    setScores(ns); setMsg(text); setPhase('result');
    (winner === 0 ? sfx.right : sfx.wrong)();
    if (round + 1 >= count) setTimeout(() => onDone({ scores: ns, correct: ns[0] + ns[1], total: count }), 1400);
  };
  const tap = (p: 0 | 1) => {
    if (phase === 'wait') finishRound(p === 0 ? 1 : 0, `${players[p]} menyentuh terlalu cepat! Poin untuk ${players[p === 0 ? 1 : 0]}.`);
    else if (phase === 'go') finishRound(p, `${players[p]} menang! ${Math.round(performance.now() - t0.current)} ms`);
  };
  const half = (p: 0 | 1) => (
    <button className={`rhalf ${phase === 'go' ? 'go' : phase === 'wait' ? 'wait' : ''}`} style={p === 1 ? { transform: 'rotate(180deg)' } : undefined} onPointerDown={() => tap(p)} aria-label={`Area ${players[p]}`}>
      <b>{players[p]}</b><span>{scores[p]}</span>
    </button>
  );
  return (
    <div className="reflex">
      {half(1)}
      <div className="rmid">
        <p style={{ margin: 0, fontWeight: 800 }}>{phase === 'idle' ? `Ronde ${round + 1}/${count}` : msg}</p>
        {(phase === 'idle' || (phase === 'result' && round + 1 < count)) && <Button size="sm" onClick={() => { if (phase === 'result') setRound(round + 1); begin(); }}>{phase === 'idle' ? 'Mulai ronde' : 'Ronde berikutnya'}</Button>}
      </div>
      {half(0)}
    </div>
  );
}

const Mark = ({ v }: { v: Cell }) => v === 1 ? <svg viewBox="0 0 24 24" width="44" height="44" aria-label="X"><path d="M5 5l14 14M19 5L5 19" stroke="var(--blue)" strokeWidth="4" strokeLinecap="round" /></svg>
  : v === 2 ? <svg viewBox="0 0 24 24" width="44" height="44" aria-label="O"><circle cx="12" cy="12" r="7" fill="none" stroke="var(--red)" strokeWidth="4" /></svg> : null;

export function TicTacToeMech({ players, count, onDone }: MechProps) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(0) as Cell[]);
  const [round, setRound] = useState(0);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [res, setRes] = useState<string | null>(null);
  const w = tttWinner(board);
  const full = board.every(Boolean);
  const play = (i: number) => {
    if (board[i] || res) return;
    const nb = board.slice() as Cell[]; nb[i] = turn; setBoard(nb); sfx.tick();
    const win = tttWinner(nb);
    if (win.winner) { const ns: [number, number] = [scores[0] + (win.winner === 1 ? 1 : 0), scores[1] + (win.winner === 2 ? 1 : 0)]; setScores(ns); setRes(`${players[win.winner - 1]} menang ronde ini!`); sfx.win(); }
    else if (nb.every(Boolean)) setRes('Seri!');
    else setTurn(turn === 1 ? 2 : 1);
  };
  const next = () => {
    if (round + 1 >= count) { onDone({ scores, correct: scores[0] + scores[1], total: count }); return; }
    setRound(round + 1); setBoard(Array(9).fill(0) as Cell[]); setRes(null); setTurn(((round + 1) % 2 === 0 ? 1 : 2));
  };
  return (
    <div>
      <p className="center muted small">Ronde {round + 1}/{count}</p>
      <p className="center"><b>{res ?? `Giliran ${players[turn - 1]} (${turn === 1 ? 'X' : 'O'})`}</b></p>
      <div className="ttt">{board.map((v, i) => <button key={i} className={`tcell ${w.line.includes(i) ? 'win' : ''}`} onClick={() => play(i)} aria-label={`Petak ${i + 1}`} disabled={!!res || !!v}><Mark v={v} /></button>)}</div>
      {res && <Button size="lg" className="gap" onClick={next}>{round + 1 >= count ? 'Lihat hasil' : 'Ronde berikutnya'}</Button>}
      {!res && full && null}
      <div className="gap"><Scoreboard players={players} scores={scores} turn={res ? undefined : turn - 1} /></div>
    </div>
  );
}

export function Connect4Mech({ players, count, onDone }: MechProps) {
  const [board, setBoard] = useState<Cell[]>(emptyC4());
  const [round, setRound] = useState(0);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [res, setRes] = useState<string | null>(null);
  const w = c4Winner(board);
  const drop = (col: number) => {
    if (res) return;
    const idx = dropC4(board, col);
    if (idx < 0) return;
    const nb = board.slice() as Cell[]; nb[idx] = turn; setBoard(nb); sfx.tick();
    const win = c4Winner(nb);
    if (win.winner) { setScores([scores[0] + (win.winner === 1 ? 1 : 0), scores[1] + (win.winner === 2 ? 1 : 0)]); setRes(`${players[win.winner - 1]} menang ronde ini!`); sfx.win(); }
    else if (nb.every(Boolean)) setRes('Papan penuh — seri!');
    else setTurn(turn === 1 ? 2 : 1);
  };
  const next = () => {
    if (round + 1 >= count) { onDone({ scores, correct: scores[0] + scores[1], total: count }); return; }
    setRound(round + 1); setBoard(emptyC4()); setRes(null); setTurn((round + 1) % 2 === 0 ? 1 : 2);
  };
  return (
    <div>
      <p className="center muted small">Ronde {round + 1}/{count}</p>
      <p className="center"><b>{res ?? `Giliran ${players[turn - 1]}`}</b> {!res && <span className={`disc d${turn}`} style={{ display: 'inline-block', width: 16, height: 16, verticalAlign: 'middle' }} />}</p>
      <div className="c4" style={{ gridTemplateColumns: `repeat(${C4_COLS}, 1fr)` }}>
        {Array.from({ length: C4_COLS }, (_, c) => <button key={`h${c}`} className="c4head" onClick={() => drop(c)} disabled={!!res} aria-label={`Jatuhkan di kolom ${c + 1}`}>▼</button>)}
        {Array.from({ length: C4_ROWS * C4_COLS }, (_, i) => <div key={i} className={`c4cell ${w.cells.includes(i) ? 'win' : ''}`}><span className={`disc ${board[i] ? `d${board[i]}` : ''}`} /></div>)}
      </div>
      {res && <Button size="lg" className="gap" onClick={next}>{round + 1 >= count ? 'Lihat hasil' : 'Ronde berikutnya'}</Button>}
      <div className="gap"><Scoreboard players={players} scores={scores} turn={res ? undefined : turn - 1} /></div>
    </div>
  );
}
