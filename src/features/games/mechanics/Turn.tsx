import { useEffect, useRef, useState } from 'react';
import { Button, Modal } from '../../../components/ui';
import { sfx } from '../../../utils/sound';
import { uno, cardColor, cardVal, playable, playMove as unoPlay, MOVE_DRAW, MOVE_PASS as UNO_PASS, COLORS, type UnoState } from '../engines/uno';
import { gaple, canPlay, hasMove, pips, startTile, playMove as gaplePlay, MOVE_PASS as GAPLE_PASS, type GapleState } from '../engines/gaple';
import { ladder, JUMPS, MOVE_ROLL, type LadderState } from '../engines/ladder';
import type { TurnEngine } from '../engines/types';
import type { MechProps } from './types';

export const TURN_ENGINES: Record<string, TurnEngine<never>> = { uno: uno as TurnEngine<never>, gaple: gaple as TurnEngine<never>, ladder: ladder as TurnEngine<never> };
const PCOL = ['#e0401f', '#2a4bff', '#0f8f5f', '#ffc414'];
const SYM: Record<number, string> = { 10: '⊘', 11: '⇄', 12: '+2', 13: '★', 14: '+4' };
const cardLabel = (c: number) => SYM[cardVal(c)] ?? String(cardVal(c));

const UCOL = ['#e0401f', '#ffc414', '#0f8f5f', '#2a4bff'];
const cardName = (c: number) => (cardColor(c) === 4 ? (cardVal(c) === 14 ? 'Liar +4' : 'Liar') : `${COLORS[cardColor(c)]} ${cardLabel(c)}`);

/** Posisi kursi lawan relatif terhadap pemegang layar: searah jarum jam dari bawah (kiri → atas → kanan). */
function seatsFor(n: number, viewer: number): { i: number; pos: 'top' | 'left' | 'right' }[] {
  const order: ('top' | 'left' | 'right')[] = n === 2 ? ['top'] : n === 3 ? ['left', 'right'] : ['left', 'top', 'right'];
  return order.map((pos, k) => ({ i: (viewer + 1 + k) % n, pos }));
}
function Seat({ name, count, turn, pos, tile = false }: { name: string; count: number; turn: boolean; pos: string; tile?: boolean }) {
  return (
    <div className={`seat ${pos} ${turn ? 'turn' : ''}`}>
      <div className="seat-id"><span className="s-av">{name.slice(0, 1).toUpperCase()}</span><b>{name}</b><span className="seat-n">{count}</span></div>
      <div className="seat-hand">{Array.from({ length: Math.min(count, 9) }, (_, k) => <i key={k} className={`mini ${tile ? 'tile' : ''}`} />)}</div>
      {count === 1 && <em className="uno-flag">{tile ? 'Sisa 1!' : 'UNO!'}</em>}
    </div>
  );
}
function Table({ n, viewer, names, counts, cur, tile, children }: { n: number; viewer: number; names: string[]; counts: number[]; cur: number; tile?: boolean; children: React.ReactNode }) {
  const seats = seatsFor(n, viewer), side = seats.some((x) => x.pos !== 'top');
  return (
    <div className={`ttable ${side ? '' : 'noside'}`}>
      {seats.map(({ i, pos }) => <Seat key={i} name={names[i] ?? `P${i + 1}`} count={counts[i] ?? 0} turn={cur === i} pos={pos} tile={tile} />)}
      <div className="tcenter">{children}</div>
    </div>
  );
}

function UFace({ c, back = false }: { c: number; back?: boolean }) {
  if (back) return <span className="uoval"><b>UNO</b></span>;
  const l = cardLabel(c), v = cardVal(c);
  return (<><i className="uc tl">{l}</i><span className={`uoval ${cardColor(c) === 4 ? 'wild' : ''}`}><b className={v === 6 || v === 9 ? 'u' : ''}>{l}</b></span><i className="uc br">{l}</i></>);
}
const unoLine = (s: UnoState, names: string[]) => {
  const l = s.last; if (!l) return 'Permainan dimulai';
  const n = names[l.who] ?? '?';
  if (l.card >= 0) return `${n} memainkan ${cardName(l.card)}`;
  return l.draw > 0 ? `${n} mengambil ${l.draw} kartu` : `${n} melewati giliran`;
};

function UnoView({ s, viewer, names, onMove, active }: { s: UnoState; viewer: number; names: string[]; onMove: (m: number) => void; active: boolean }) {
  const [wild, setWild] = useState<number | null>(null);
  const top = s.discard[s.discard.length - 1] as number, hand = s.hands[viewer] as number[];
  const myTurn = active && s.win < 0, stack = s.pend > 0;
  const noPlay = myTurn && !stack && !s.drew && !hand.some((c) => playable(s, c));
  return (
    <div>
      <Table n={s.n} viewer={viewer} names={names} counts={s.hands.map((h) => h.length)} cur={s.cur}>
        <div className="pile-row">
          <div className="pile"><div className="ucard back"><UFace c={0} back /></div><small>Tumpukan {s.draw.length}</small></div>
          <div className="pile"><div className="ucard-ring" style={{ boxShadow: `0 0 0 5px ${UCOL[s.color]}, 0 0 16px 4px ${UCOL[s.color]}88` }}><div className={`ucard c${cardColor(top)}`}><UFace c={top} /></div></div><small><b style={{ color: '#fff' }}>{COLORS[s.color]}</b></small></div>
        </div>
        <div className="dirs">{s.dir === 1 ? '↻ searah jarum jam' : '↺ berlawanan arah'}{stack ? ` · Hukuman +${s.pend}` : ''}</div>
        <div className="tlog">{unoLine(s, names)}</div>
      </Table>
      <div className={`me-bar ${myTurn ? 'turn' : ''}`}>{s.win >= 0 ? `${names[s.win]} menang!` : myTurn ? (stack ? `Giliranmu — tumpuk +${s.pend === 2 ? '2' : '4'} atau ambil ${s.pend} kartu` : 'Giliranmu') : `Giliran ${names[s.cur]}`}{hand.length === 1 && s.win < 0 ? ' · UNO!' : ''}</div>
      {myTurn && <div className="row" style={{ justifyContent: 'center' }}><Button size="sm" variant="soft" disabled={!stack && s.drew} onClick={() => onMove(MOVE_DRAW)}>{stack ? `Ambil ${s.pend} kartu` : 'Ambil kartu'}</Button><Button size="sm" variant="ghost" disabled={!s.drew || stack} onClick={() => onMove(UNO_PASS)}>Lewati</Button></div>}
      {noPlay && <p className="center small muted">Tidak ada kartu cocok — ambil kartu.</p>}
      <div className="uhand">{hand.map((c, i) => { const ok = myTurn && playable(s, c); return <button key={i} className={`ucard c${cardColor(c)} ${ok ? 'ok' : 'dim'}`} disabled={!ok} onClick={() => { if (cardColor(c) === 4) setWild(i); else onMove(unoPlay(i)); }} aria-label={`Kartu ${cardName(c)}`}><UFace c={c} /></button>; })}</div>
      <Modal open={wild !== null} title="Pilih warna" onClose={() => setWild(null)}>
        <div className="grid">{COLORS.map((c, k) => <button key={c} className="opt" style={{ background: UCOL[k], color: k === 1 ? '#17140e' : '#fff' }} onClick={() => { onMove(unoPlay(wild as number, k)); setWild(null); }}>{c}</button>)}</div>
      </Modal>
    </div>
  );
}

function Dom({ t, flip = false, small = false, end = false }: { t: [number, number]; flip?: boolean; small?: boolean; end?: boolean }) {
  const half = (n: number) => <span className="dhalf">{Array.from({ length: n }, (_, k) => <i key={k} className={`dp p${n}-${k}`} />)}</span>;
  return <span className={`dom ${small ? 'sm' : ''} ${end ? 'end' : ''}`}>{half(flip ? t[1] : t[0])}<span className="dsep" />{half(flip ? t[0] : t[1])}</span>;
}
/** Papan ular: baris bergantian arah agar ratusan kartu tetap muat tanpa terpotong. */
function Snake({ row, per }: { row: [number, number][]; per: number }) {
  const rows: { t: [number, number]; i: number }[][] = [];
  row.forEach((t, i) => { const r = Math.floor(i / per); (rows[r] ??= []).push({ t, i }); });
  return (
    <div className="snake">{rows.map((r, k) => { const rev = k % 2 === 1, arr = rev ? r.slice().reverse() : r;
      return <div key={k} className={`snake-row ${rev ? 'rev' : ''}`}>{arr.map(({ t, i }) => <Dom key={i} t={t} flip={rev} small end={i === 0 || i === row.length - 1} />)}</div>; })}</div>
  );
}
function GapleView({ s, viewer, names, onMove, active }: { s: GapleState; viewer: number; names: string[]; onMove: (m: number) => void; active: boolean }) {
  const [sel, setSel] = useState<number | null>(null);
  const hand = s.hands[viewer] as number[];
  const myTurn = active && s.win < 0;
  const first = s.row[0], last = s.row[s.row.length - 1];
  const seats = seatsFor(s.n, viewer), side = seats.some((x) => x.pos !== 'top');
  const tap = (i: number) => {
    const t = hand[i] as number, l = canPlay(s, t, 0), r = canPlay(s, t, 1);
    if (!s.row.length || (l && !r)) onMove(gaplePlay(i, 0)); else if (r && !l) onMove(gaplePlay(i, 1)); else setSel(i);
  };
  const st = !s.row.length && myTurn ? startTile(s) : null;
  const lg = s.last ? (s.last.pass ? `${names[s.last.who]} lewat` : `${names[s.last.who]} memasang ${pips(s.last.tile)[0]}|${pips(s.last.tile)[1]}`) : 'Permainan dimulai';
  return (
    <div>
      <Table n={s.n} viewer={viewer} names={names} counts={s.hands.map((h) => h.length)} cur={s.cur} tile>
        <div className="ends">{first && last ? <><span>◀ Kiri: <b>{first[0]}</b></span><span>Kanan: <b>{last[1]}</b> ▶</span></> : <span>Meja kosong</span>}</div>
        {s.row.length === 0 ? <div className="muted small center" style={{ color: '#e9fff3', padding: '18px 0' }}>{st !== null ? `Pasang balak ${pips(st)[0]}|${pips(st)[1]} untuk memulai` : 'Pasang kartu apa saja'}</div> : <Snake row={s.row} per={side ? 4 : 6} />}
        <div className="tlog">{lg}</div>
      </Table>
      <div className={`me-bar ${myTurn ? 'turn' : ''}`}>{s.win >= 0 ? `${names[s.win]} menang!` : myTurn ? 'Giliranmu' : `Giliran ${names[s.cur]}`}</div>
      {sel !== null && <div className="row gap" style={{ justifyContent: 'center' }}><Button size="sm" onClick={() => { onMove(gaplePlay(sel, 0)); setSel(null); }}>Pasang kiri</Button><Button size="sm" onClick={() => { onMove(gaplePlay(sel, 1)); setSel(null); }}>Pasang kanan</Button><Button size="sm" variant="ghost" onClick={() => setSel(null)}>Batal</Button></div>}
      <div className="uhand dh">{hand.map((t, i) => { const ok = myTurn && (canPlay(s, t, 0) || canPlay(s, t, 1)); return <button key={i} className={`dbtn ${ok ? 'ok' : 'dim'}`} disabled={!ok} onClick={() => tap(i)} aria-label={`Domino ${pips(t)[0]}-${pips(t)[1]}`}><Dom t={pips(t)} /></button>; })}</div>
      {myTurn && !hasMove(s, viewer) && <Button className="gap" variant="soft" onClick={() => onMove(GAPLE_PASS)}>Tidak ada kartu cocok — Lewati</Button>}
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
