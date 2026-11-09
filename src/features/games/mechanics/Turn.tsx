import { useEffect, useRef, useState } from 'react';
import { Button, Modal } from '../../../components/ui';
import { sfx } from '../../../utils/sound';
import { uno, cardColor, cardVal, playable, playMove as unoPlay, MOVE_DRAW, MOVE_PASS as UNO_PASS, COLORS, type UnoState } from '../engines/uno';
import { gaple, canPlay, hasMove, pips, startTile, playMove as gaplePlay, MOVE_PASS as GAPLE_PASS, type GapleState } from '../engines/gaple';
import { ladder, JUMPS, MOVE_ROLL, type LadderState } from '../engines/ladder';
import type { TurnEngine } from '../engines/types';
import type { MechProps } from './types';
import { Emo } from '../../../components/Emo';

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

/** Pusat kotak n pada papan 100x100 (baris bawah = 1–10, berganti arah tiap baris). */
const cellXY = (n: number): [number, number] => { const r = Math.floor((n - 1) / 10), i = (n - 1) % 10, c = r % 2 === 0 ? i : 9 - i; return [c * 10 + 5, (9 - r) * 10 + 5]; };
const SNAKE_COL = ['#c2255c', '#e8590c', '#7048e8', '#0b7285'];
function JumpArt({ from, to, k }: { from: number; to: number; k: number }) {
  const [x1, y1] = cellXY(from), [x2, y2] = cellXY(to), dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, px = -dy / len, py = dx / len;
  if (to > from) { // tangga
    const n = Math.max(2, Math.round(len / 4.5)), o = 1.5;
    return (<g>
      {Array.from({ length: n }, (_, i) => { const t = (i + 1) / (n + 1), cx = x1 + dx * t, cy = y1 + dy * t; return <line key={i} x1={cx + px * o} y1={cy + py * o} x2={cx - px * o} y2={cy - py * o} stroke="#c08a4b" strokeWidth=".8" strokeLinecap="round" />; })}
      <line x1={x1 + px * o} y1={y1 + py * o} x2={x2 + px * o} y2={y2 + py * o} stroke="#8a5a2b" strokeWidth="1" strokeLinecap="round" />
      <line x1={x1 - px * o} y1={y1 - py * o} x2={x2 - px * o} y2={y2 - py * o} stroke="#8a5a2b" strokeWidth="1" strokeLinecap="round" />
    </g>);
  }
  const w = Math.min(9, len * 0.28), col = SNAKE_COL[k % SNAKE_COL.length] as string; // ular: kepala di kotak atas
  const d = `M${x1} ${y1} C${x1 + dx * 0.25 + px * w} ${y1 + dy * 0.25 + py * w} ${x1 + dx * 0.75 - px * w} ${y1 + dy * 0.75 - py * w} ${x2} ${y2}`;
  return (<g>
    <path d={d} fill="none" stroke="#17140e" strokeWidth="3" strokeLinecap="round" opacity=".55" />
    <path d={d} fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" />
    <path d={d} fill="none" stroke="#fff" strokeWidth=".6" strokeLinecap="round" strokeDasharray="1.2 2.4" opacity=".75" />
    <circle cx={x1} cy={y1} r="2.6" fill={col} stroke="#17140e" strokeWidth=".6" />
    <circle cx={x1 - 0.9} cy={y1 - 0.6} r=".55" fill="#fff" /><circle cx={x1 + 0.9} cy={y1 - 0.6} r=".55" fill="#fff" />
  </g>);
}
function Die({ v, tumble = false }: { v: number; tumble?: boolean }) {
  return <span className={`die ${tumble ? 'tumble' : ''}`} role="img" aria-label={`Dadu ${v}`}><span className="dhalf">{Array.from({ length: v }, (_, k) => <i key={k} className={`dp p${v}-${k}`} />)}</span></span>;
}
const OFFS: [number, number][] = [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]];
const JUMP_LIST = Object.entries(JUMPS).map(([k, v]) => [Number(k), v] as const);

function LadderView({ s, names, onMove, active }: { s: LadderState; viewer: number; names: string[]; onMove: (m: number) => void; active: boolean }) {
  const [disp, setDisp] = useState<number[]>(() => s.pos.slice());
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [tumble, setTumble] = useState(false);
  const [face, setFace] = useState(s.last?.roll ?? 1);
  const [slide, setSlide] = useState(false);
  const seen = useRef(s.moves), alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  // Bidak berjalan kotak demi kotak mengikuti langkah terakhir (juga untuk pemain lain di mode online).
  useEffect(() => {
    if (s.moves === seen.current) return;
    seen.current = s.moves;
    const l = s.last;
    setPending(false);
    if (!l) { setDisp(s.pos.slice()); return; }
    const path: number[] = []; for (let p = l.from + 1; p <= l.to; p++) path.push(p);
    const hasJump = l.jump !== l.to; if (hasJump) path.push(l.jump);
    setFace(l.roll); setTumble(false); setBusy(true); setDisp(s.pos.map((v, i) => (i === l.who ? l.from : v)));
    let k = 0, timer: ReturnType<typeof setTimeout> | undefined, cancelled = false;
    const step = () => {
      if (cancelled) return;
      if (k >= path.length) { setDisp(s.pos.slice()); setSlide(false); setBusy(false); return; }
      const p = path[k] as number, isJump = hasJump && k === path.length - 1;
      setSlide(isJump); setDisp((d) => d.map((v, i) => (i === l.who ? p : v)));
      if (isJump && l.jump < l.to) sfx.wrong(); else sfx.tick();
      k++; timer = setTimeout(step, isJump ? 700 : 240);
    };
    timer = setTimeout(step, 150);
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [s.moves]); // eslint-disable-line react-hooks/exhaustive-deps
  const roll = () => {
    if (busy || tumble || pending) return;
    setTumble(true); setPending(true); let n = 0;
    setTimeout(() => { if (alive.current) setPending(false); }, 5000); // jaga-jaga bila langkah ditolak
    const id = setInterval(() => {
      if (!alive.current) { clearInterval(id); return; }
      setFace(1 + Math.floor(Math.random() * 6)); n++;
      if (n >= 7) { clearInterval(id); setTumble(false); onMove(MOVE_ROLL); }
    }, 90);
  };
  const l = s.last, n0 = l ? names[l.who] ?? '?' : '';
  const msg = s.win >= 0 ? `${names[s.win]} sampai di 100!` : !l ? 'Lempar dadu untuk mulai. Butuh angka pas untuk mencapai 100.'
    : busy ? `${n0} melempar ${l.roll}…`
    : l.to === l.from ? `${n0} melempar ${l.roll} — terlalu jauh, butuh angka pas ke 100`
    : `${n0} melempar ${l.roll}${l.jump > l.to ? ` — naik tangga ke ${l.jump}! 🪜` : l.jump < l.to ? ` — dimakan ular, turun ke ${l.jump}! 🐍` : ''}${l.roll === 6 && s.win < 0 ? ' · dapat giliran lagi!' : ''}`;
  const canRoll = active && s.win < 0 && !busy && !tumble && !pending;
  return (
    <div>
      <div className="row wrap" style={{ justifyContent: 'center', marginBottom: 6 }}>{names.map((n, i) => <span key={i} className={`badge ${s.cur === i && s.win < 0 ? '' : 'dim'}`} style={{ background: PCOL[i], color: i === 3 ? '#17140e' : '#fff' }}>{s.cur === i && s.win < 0 ? '▶ ' : ''}{n}: {s.pos[i] === 0 ? 'Start' : s.pos[i]}</span>)}</div>
      <div className="lwrap"><div className="lgrid">
        <div className="lboard">{Array.from({ length: 10 }, (_, rr) => 9 - rr).map((r) => Array.from({ length: 10 }, (_, c) => { const num = r % 2 === 0 ? r * 10 + c + 1 : r * 10 + (9 - c) + 1, j = JUMPS[num];
          return <div key={num} className={`lcell ${(r + c) % 2 ? 'alt' : ''} ${j ? (j > num ? 'up' : 'down') : ''}`}><small>{num}</small>{num === 100 && <b className="goal"><Emo t="🏆" /></b>}</div>; }))}</div>
        <svg className="lsvg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{JUMP_LIST.map(([f, t], k) => <JumpArt key={f} from={f} to={t} k={k} />)}</svg>
        {disp.map((p, i) => {
          const [bx, by] = p === 0 ? [5 + i * 7, 106] as [number, number] : cellXY(p), same = disp.filter((q) => q === p).length, idx = disp.slice(0, i).filter((q) => q === p).length, o: [number, number] = same > 1 ? (OFFS[idx % 4] as [number, number]) : [0, 0];
          return <span key={i} className={`ltoken ${s.cur === i && s.win < 0 ? 'now' : ''} ${slide && s.last?.who === i ? 'slide' : ''}`} style={{ left: `${bx + o[0]}%`, top: `${by + o[1]}%`, background: PCOL[i] }} title={names[i]} />;
        })}
      </div></div>
      <div className="row gap" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Die v={face} tumble={tumble} />
        <div style={{ maxWidth: 220 }}><p className="small" style={{ margin: 0 }}><b><Emo t={msg} /></b></p><p className="small muted" style={{ margin: '4px 0 0' }}>{s.win >= 0 ? '' : active ? 'Giliranmu' : `Giliran ${names[s.cur]}`}</p></div>
      </div>
      {s.win < 0 && <Button size="lg" className="gap" style={{ width: '100%' }} disabled={!canRoll} onClick={roll}><Emo t={tumble ? '🎲 Berputar…' : busy ? 'Bidak berjalan…' : '🎲 Lempar dadu'} /></Button>}
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
