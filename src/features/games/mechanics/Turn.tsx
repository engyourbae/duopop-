import { useEffect, useRef, useState } from 'react';
import { Button, Modal } from '../../../components/ui';
import { sfx } from '../../../utils/sound';
import { uno, cardColor, cardVal, playable, playMove as unoPlay, MOVE_DRAW, MOVE_PASS as UNO_PASS, COLORS, type UnoState } from '../engines/uno';
import { gaple, canPlay, hasMove, pips, playMove as gaplePlay, MOVE_PASS as GAPLE_PASS, type GapleState } from '../engines/gaple';
import { ladder, JUMPS, MOVE_ROLL, type LadderState } from '../engines/ladder';
import type { TurnEngine } from '../engines/types';
import type { MechProps } from './types';

export const TURN_ENGINES: Record<string, TurnEngine<never>> = { uno: uno as TurnEngine<never>, gaple: gaple as TurnEngine<never>, ladder: ladder as TurnEngine<never> };
const PCOL = ['#e0401f', '#2a4bff', '#0f8f5f', '#ffc414'];
const SYM: Record<number, string> = { 10: '⊘', 11: '⇄', 12: '+2', 13: '★', 14: '+4' };
const cardLabel = (c: number) => SYM[cardVal(c)] ?? String(cardVal(c));

function UnoView({ s, viewer, names, onMove, active }: { s: UnoState; viewer: number; names: string[]; onMove: (m: number) => void; active: boolean }) {
  const [wild, setWild] = useState<number | null>(null);
  const top = s.discard[s.discard.length - 1] as number, hand = s.hands[viewer] as number[];
  return (
    <div>
      <div className="row wrap" style={{ justifyContent: 'center' }}>{names.map((n, i) => i === viewer ? null : <span key={i} className={`badge ${s.cur === i ? '' : 'dim'}`}>{n}: {(s.hands[i] as number[]).length} kartu{s.cur === i ? ' ◀' : ''}</span>)}</div>
      <div className="row gap" style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
        <div className="center"><div className="ucard back">UNO</div><small className="muted">Tumpukan {s.draw.length}</small></div>
        <div className="center"><div className={`ucard c${cardColor(top)}`}>{cardLabel(top)}</div><small className="muted">Warna: <b style={{ color: PCOL[s.color] }}>{COLORS[s.color]}</b></small></div>
      </div>
      <p className="center gap"><b>{s.win >= 0 ? `${names[s.win]} menang!` : active ? 'Giliranmu' : `Giliran ${names[s.cur]}`}</b></p>
      {active && s.win < 0 && <div className="row" style={{ justifyContent: 'center' }}><Button size="sm" variant="soft" disabled={s.drew} onClick={() => onMove(MOVE_DRAW)}>Ambil kartu</Button><Button size="sm" variant="ghost" disabled={!s.drew} onClick={() => onMove(UNO_PASS)}>Lewati</Button></div>}
      <div className="uhand">{hand.map((c, i) => { const ok = active && s.win < 0 && playable(s, c); return <button key={i} className={`ucard c${cardColor(c)} ${ok ? '' : 'dim'}`} disabled={!ok} onClick={() => { if (cardColor(c) === 4) setWild(i); else onMove(unoPlay(i)); }} aria-label={`Kartu ${cardLabel(c)}`}>{cardLabel(c)}</button>; })}</div>
      <Modal open={wild !== null} title="Pilih warna" onClose={() => setWild(null)}>
        <div className="grid">{COLORS.map((c, k) => <button key={c} className="opt" style={{ background: PCOL[k], color: k === 1 ? '#17140e' : '#fff' }} onClick={() => { onMove(unoPlay(wild as number, k)); setWild(null); }}>{c}</button>)}</div>
      </Modal>
    </div>
  );
}

function Dom({ t, flip = false, small = false }: { t: [number, number]; flip?: boolean; small?: boolean }) {
  const half = (n: number) => <span className="dhalf">{Array.from({ length: n }, (_, k) => <i key={k} className={`dp p${n}-${k}`} />)}</span>;
  return <span className={`dom ${small ? 'sm' : ''}`}>{half(flip ? t[1] : t[0])}<span className="dsep" />{half(flip ? t[0] : t[1])}</span>;
}
function GapleView({ s, viewer, names, onMove, active }: { s: GapleState; viewer: number; names: string[]; onMove: (m: number) => void; active: boolean }) {
  const [sel, setSel] = useState<number | null>(null);
  const hand = s.hands[viewer] as number[];
  const tap = (i: number) => {
    const t = hand[i] as number, l = canPlay(s, t, 0), r = canPlay(s, t, 1);
    if (!s.row.length || (l && !r)) onMove(gaplePlay(i, 0)); else if (r && !l) onMove(gaplePlay(i, 1)); else setSel(i);
  };
  return (
    <div>
      <div className="row wrap" style={{ justifyContent: 'center' }}>{names.map((n, i) => i === viewer ? null : <span key={i} className={`badge ${s.cur === i ? '' : 'dim'}`}>{n}: {(s.hands[i] as number[]).length} kartu{s.cur === i ? ' ◀' : ''}</span>)}</div>
      <div className="drow" aria-label="Papan domino">{s.row.length === 0 ? <span className="muted">Belum ada kartu di meja</span> : s.row.map((t, i) => <Dom key={i} t={t} />)}</div>
      <p className="center"><b>{s.win >= 0 ? `${names[s.win]} menang!` : active ? 'Giliranmu' : `Giliran ${names[s.cur]}`}</b></p>
      {sel !== null && <div className="row gap" style={{ justifyContent: 'center' }}><Button size="sm" onClick={() => { onMove(gaplePlay(sel, 0)); setSel(null); }}>Pasang kiri</Button><Button size="sm" onClick={() => { onMove(gaplePlay(sel, 1)); setSel(null); }}>Pasang kanan</Button><Button size="sm" variant="ghost" onClick={() => setSel(null)}>Batal</Button></div>}
      <div className="uhand">{hand.map((t, i) => { const ok = active && s.win < 0 && (canPlay(s, t, 0) || canPlay(s, t, 1)); return <button key={i} className={`dbtn ${ok ? '' : 'dim'}`} disabled={!ok} onClick={() => tap(i)} aria-label={`Domino ${pips(t)[0]}-${pips(t)[1]}`}><Dom t={pips(t)} /></button>; })}</div>
      {active && s.win < 0 && !hasMove(s, viewer) && <Button className="gap" variant="soft" onClick={() => onMove(GAPLE_PASS)}>Tidak ada kartu cocok — Lewati</Button>}
    </div>
  );
}

function LadderView({ s, viewer, names, onMove, active }: { s: LadderState; viewer: number; names: string[]; onMove: (m: number) => void; active: boolean }) {
  const cell = (r: number, c: number) => (r % 2 === 0 ? r * 10 + c + 1 : r * 10 + (9 - c) + 1);
  return (
    <div>
      <div className="lboard">{Array.from({ length: 10 }, (_, rr) => 9 - rr).map((r) => Array.from({ length: 10 }, (_, c) => { const n = cell(r, c), j = JUMPS[n]; return (
        <div key={n} className={`lcell ${j ? (j > n ? 'up' : 'down') : ''}`}><small>{n}</small>{j && <em>{j > n ? '↑' : '↓'}{j}</em>}<span className="ltok">{s.pos.map((p, i) => p === n ? <i key={i} style={{ background: PCOL[i] }} /> : null)}</span></div>); }))}</div>
      <div className="row wrap gap" style={{ justifyContent: 'center' }}>{names.map((n, i) => <span key={i} className="badge" style={{ background: PCOL[i], color: i === 3 ? '#17140e' : '#fff' }}>{n}: {s.pos[i]}</span>)}</div>
      {s.last && <p className="center">{names[s.last.who]} melempar <b>{s.last.roll}</b>{s.last.jump !== s.last.to ? (s.last.jump > s.last.to ? ' — naik tangga!' : ' — dimakan ular!') : ''}</p>}
      <p className="center"><b>{s.win >= 0 ? `${names[s.win]} menang!` : active ? 'Giliranmu' : `Giliran ${names[s.cur]}`}</b></p>
      {active && s.win < 0 && <Button size="lg" onClick={() => onMove(MOVE_ROLL)}>🎲 Lempar dadu</Button>}
      <span className="sr">{viewer}</span>
    </div>
  );
}

/** Tampilan sesuai game; dipakai gantian (offline) dan online (ruang). */
export function TurnBoard({ kind, state, viewer, names, onMove, active }: { kind: string; state: unknown; viewer: number; names: string[]; onMove: (m: number) => void; active: boolean }) {
  if (kind === 'uno') return <UnoView s={state as UnoState} viewer={viewer} names={names} onMove={onMove} active={active} />;
  if (kind === 'gaple') return <GapleView s={state as GapleState} viewer={viewer} names={names} onMove={onMove} active={active} />;
  return <LadderView s={state as LadderState} viewer={viewer} names={names} onMove={onMove} active={active} />;
}

/** Permainan giliran satu perangkat: oper ponsel; kartu pemain lain tertutup lewat layar serah. */
export function TurnMech({ game, players, seed, onDone }: MechProps) {
  const eng = TURN_ENGINES[game.mechanic] as TurnEngine<unknown>;
  const [s, setS] = useState(() => eng.init(players.length, seed));
  const hidden = game.mechanic !== 'ladder' && players.length > 1;
  const [covered, setCovered] = useState(hidden);
  const done = useRef(false);
  const cur = eng.actor(s), w = eng.winner(s);
  useEffect(() => { if (w >= 0 && !done.current) { done.current = true; sfx.win(); setTimeout(() => onDone({ scores: players.map((_, i) => (i === w ? 1 : 0)), correct: 1, total: 1, headline: `${players[w]} menang!`, xp: 60 }), 1400); } }, [w]); // eslint-disable-line react-hooks/exhaustive-deps
  const move = (m: number) => {
    const n = eng.apply(s, m);
    if (!n) { sfx.wrong(); return; }
    sfx.tick(); setS(n);
    if (hidden && eng.winner(n) < 0 && eng.actor(n) !== cur) setCovered(true);
  };
  if (covered && w < 0) return (
    <div className="card center gap"><div className="avatar" style={{ margin: '0 auto 8px' }}>{(players[cur] ?? '?').slice(0, 1).toUpperCase()}</div>
      <h2>Serahkan ponsel ke {players[cur]}</h2><p className="muted">Pastikan pemain lain tidak melihat kartumu.</p><Button size="lg" onClick={() => setCovered(false)}>Aku {players[cur]}, lihat kartuku</Button></div>);
  return <TurnBoard kind={game.mechanic} state={s} viewer={cur} names={players} onMove={move} active={w < 0} />;
}
