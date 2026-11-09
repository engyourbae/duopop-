import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import '../../../styles/monopoly.css';
import { Button, Modal, Select } from '../../../components/ui';
import { mono } from '../../../utils/monoSound';
import { sfx } from '../../../utils/sound';
import {
  BID_STEPS, CHALLENGES, FINISH_ROUND, MV, alive, canBuild, canMortgage, canSell, canUnmortgage, challengeXp, monopoly, netWorth, ownedBy, tradeMove, unmortCost, validTrade,
  mvBid, mvBuild, mvMort, mvSell, mvUnmort, type MonoEv, type MonoState,
} from '../engines/monopoly';
import { botMove } from '../engines/monopolyBot';
import { CHANCE, CHEST, GROUPS, MODES, PAWNS, PAWN_NAME, PCOL, TILES, money, type Tile } from '../engines/monopolyData';
import { Banknote, DeckArt, DieFace, HotelArt, HouseArt, MonoIcon, PawnArt, TileIcon } from './MonoArt';
import type { MechProps } from './types';

// ---------- Geometri papan (viewBox 1100) ----------
const VB = 1100, CORNER = 118, SIDE = 96, BAND = 26;
interface Rect { x: number; y: number; w: number; h: number; side: 'b' | 'l' | 't' | 'r' | 'c' }
function rectOf(i: number): Rect {
  if (i === 0) return { x: VB - CORNER, y: VB - CORNER, w: CORNER, h: CORNER, side: 'c' };
  if (i < 10) return { x: VB - CORNER - i * SIDE, y: VB - CORNER, w: SIDE, h: CORNER, side: 'b' };
  if (i === 10) return { x: 0, y: VB - CORNER, w: CORNER, h: CORNER, side: 'c' };
  if (i < 20) return { x: 0, y: VB - CORNER - (i - 10) * SIDE, w: CORNER, h: SIDE, side: 'l' };
  if (i === 20) return { x: 0, y: 0, w: CORNER, h: CORNER, side: 'c' };
  if (i < 30) return { x: CORNER + (i - 21) * SIDE, y: 0, w: SIDE, h: CORNER, side: 't' };
  if (i === 30) return { x: VB - CORNER, y: 0, w: CORNER, h: CORNER, side: 'c' };
  return { x: VB - CORNER, y: CORNER + (i - 31) * SIDE, w: CORNER, h: SIDE, side: 'r' };
}
const RECTS = Array.from({ length: 40 }, (_, i) => rectOf(i));
function bandRect(r: Rect): Rect {
  switch (r.side) {
    case 'b': return { ...r, h: BAND }; case 't': return { ...r, y: r.y + r.h - BAND, h: BAND };
    case 'l': return { ...r, x: r.x + r.w - BAND, w: BAND }; default: return { ...r, w: BAND };
  }
}
function contentRect(r: Rect): Rect {
  switch (r.side) {
    case 'b': return { ...r, y: r.y + BAND, h: r.h - BAND }; case 't': return { ...r, h: r.h - BAND };
    case 'l': return { ...r, w: r.w - BAND }; case 'r': return { ...r, x: r.x + BAND, w: r.w - BAND }; default: return r;
  }
}
const ICON_OF: Record<string, string> = { go: 'go', rail: 'rail', chance: 'chance', chest: 'chest', tax: 'tax', jail: 'jail', park: 'park', gojail: 'police' };
const lines = (n: string): string[] => { const w = n.split(' '); if (w.length === 1) return [n]; if (w.length === 2) return w; const mid = Math.ceil(w.length / 2); return [w.slice(0, mid).join(' '), w.slice(mid).join(' ')]; };
const OFFS: [number, number][] = [[-20, -12], [20, -12], [-20, 16], [20, 16], [0, -28], [0, 30]];

function pawnXY(tile: number, k: number, total: number, inJail: boolean): [number, number] {
  const r = RECTS[tile] as Rect;
  if (tile === 10) { const [ox, oy] = OFFS[k % 6] as [number, number]; return inJail ? [r.x + 40 + ox * 0.55, r.y + 40 + oy * 0.55] : [r.x + 84 + ox * 0.3, r.y + 86 + oy * 0.3]; }
  const c = (TILES[tile] as Tile).kind === 'prop' ? contentRect(r) : r, [ox, oy] = total > 1 ? (OFFS[k % 6] as [number, number]) : [0, 0];
  return [c.x + c.w / 2 + ox, c.y + c.h / 2 + oy + (r.side === 'c' ? 12 : 8)];
}

// ---------- Teks ----------
const nm = (n: string[], i: number) => n[i] ?? `P${i + 1}`;
const tn = (t: number) => (TILES[t] as Tile).name;
function describe(e: MonoEv, n: string[]): string {
  switch (e.t) {
    case 'roll': return `${nm(n, e.who)} melempar ${e.d[0]} + ${e.d[1]}${e.d[0] === e.d[1] ? ' (kembar!)' : ''}`;
    case 'move': return e.warp ? `${nm(n, e.who)} pindah ke ${tn(e.to)}` : `${nm(n, e.who)} tiba di ${tn(e.to)}`;
    case 'cash': return '';
    case 'rent': return `${nm(n, e.from)} bayar sewa ${money(e.amt)} ke ${nm(n, e.to)} (${tn(e.tile)})`;
    case 'tax': return `${nm(n, e.who)} bayar ${tn(e.tile)} ${money(e.amt)}`;
    case 'buy': return `${nm(n, e.who)} membeli ${tn(e.tile)} seharga ${money(e.price)}`;
    case 'card': return `${nm(n, e.who)} mengambil kartu ${e.deck === 'chance' ? 'Kejutan' : 'Kas Warga'}`;
    case 'build': return `${nm(n, e.who)} membangun ${e.lvl === 5 ? 'hotel' : `rumah ke-${e.lvl}`} di ${tn(e.tile)}`;
    case 'sell': return `${nm(n, e.who)} menjual bangunan di ${tn(e.tile)}`;
    case 'mort': return `${nm(n, e.who)} ${e.on ? 'menggadaikan' : 'menebus'} ${tn(e.tile)}`;
    case 'auction': return `Lelang dimulai untuk ${tn(e.tile)}`;
    case 'bid': return `${nm(n, e.who)} menawar ${money(e.amt)}`;
    case 'sold': return `${tn(e.tile)} terjual ke ${nm(n, e.who)} seharga ${money(e.price)}`;
    case 'unsold': return `${tn(e.tile)} tidak laku dilelang`;
    case 'jail': return `${nm(n, e.who)} masuk penjara!`;
    case 'free': return `${nm(n, e.who)} bebas dari penjara${e.how === 'dadu' ? ' lewat dadu kembar' : e.how === 'kartu' ? ' dengan kartu' : e.how === 'bayar' ? ' (bayar denda)' : ' (denda paksa)'}`;
    case 'trade': return e.offer ? `${nm(n, e.from)} mengajukan dagang ke ${nm(n, e.to)}` : e.ok ? `${nm(n, e.from)} dan ${nm(n, e.to)} sepakat dagang` : `${nm(n, e.to)} menolak tawaran dagang`;
    case 'bankrupt': return `${nm(n, e.who)} bangkrut!`;
    case 'end': return e.byLimit ? 'Batas putaran tercapai' : '';
    case 'win': return `${nm(n, e.who)} menang!`;
  }
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const monoScores = (s: MonoState) => s.cash.map((_, i) => (s.out[i] ? 0 : Math.round(netWorth(s, i))));

// ---------- Kartu hak milik ----------
function Deed({ t, s, names }: { t: number; s: MonoState; names: string[] }) {
  const tl = TILES[t] as Tile, o = s.owner[t] as number, g = tl.group >= 0 ? (GROUPS[tl.group] as (typeof GROUPS)[number]) : null;
  const col = g?.color ?? (tl.kind === 'rail' ? '#455a64' : tl.kind === 'util' ? (tl.util === 'air' ? '#1c7ed6' : '#f08c00') : '#555');
  const sub = tl.kind === 'prop' ? 'HAK MILIK' : tl.kind === 'rail' ? 'STASIUN KERETA' : 'UTILITAS';
  return (
    <div className="mn-deed">
      <div className="band" style={{ background: col }}><small>{sub}</small><b>{tl.name}</b></div>
      <div className="body">
        {tl.kind === 'prop' && <table><tbody>
          <tr><td>Sewa tanah</td><td>{money(tl.rent[0] as number)}</td></tr>
          <tr><td>Set penuh (tanpa bangunan)</td><td>{money((tl.rent[0] as number) * 2)}</td></tr>
          {[1, 2, 3, 4].map((k) => <tr key={k}><td>Dengan {k} rumah</td><td>{money(tl.rent[k] as number)}</td></tr>)}
          <tr><td>Dengan hotel</td><td>{money(tl.rent[5] as number)}</td></tr></tbody></table>}
        {tl.kind === 'rail' && <table><tbody>{[1, 2, 3, 4].map((k) => <tr key={k}><td>Punya {k} stasiun</td><td>{money(25 * 2 ** (k - 1))}</td></tr>)}</tbody></table>}
        {tl.kind === 'util' && <p style={{ margin: 0 }}>Punya 1 utilitas: sewa 4 kali angka dadu.<br />Punya 2 utilitas: sewa 10 kali angka dadu.</p>}
        <div className="foot">
          <Banknote label={String(tl.price)} w={58} /><br />Harga {money(tl.price)} · Gadai {money(tl.price / 2)}{g ? ` · Bangun ${money(g.house)}/rumah` : ''}
          <div style={{ marginTop: 5 }}>{o < 0 ? <b>Belum dimiliki</b> : <span className="mn-own"><PawnArt kind={PAWNS[o % 6] as string} color={PCOL[o % 6] as string} size={22} />{nm(names, o)}{s.mort[t] ? ' · digadaikan' : ''}{(s.lvl[t] as number) > 0 ? ` · ${s.lvl[t] === 5 ? 'hotel' : `${s.lvl[t]} rumah`}` : ''}</span>}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Papan ----------
function Board({ s, disp, now, warp, hop, tumble, dice, zoom, msg, onTile }: { s: MonoState; disp: number[]; now: number; warp: boolean; hop: number; tumble: boolean; dice: [number, number]; zoom: number; msg: string; onTile: (t: number) => void }) {
  const pawnsAt = useMemo(() => {
    const m: Record<number, number[]> = {}; disp.forEach((t, i) => { if (!s.out[i]) (m[t] ??= []).push(i); }); return m;
  }, [disp, s.out]);
  return (
    <div className="mn-scroll"><div className="mn-board" style={{ width: `${zoom * 100}%` }}>
      <svg className="bd" viewBox={`0 0 ${VB} ${VB}`} role="img" aria-label="Papan Monopoli Nusantara">
        <defs><pattern id="mnmort" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="14" fill="#17140e" opacity=".28" /></pattern></defs>
        <rect x={CORNER} y={CORNER} width={VB - 2 * CORNER} height={VB - 2 * CORNER} fill="#0c6b4a" />
        <rect x={CORNER + 14} y={CORNER + 14} width={VB - 2 * CORNER - 28} height={VB - 2 * CORNER - 28} rx="30" fill="none" stroke="#ffffff33" strokeWidth="4" strokeDasharray="14 10" />
        {TILES.map((tl) => {
          const r = RECTS[tl.id] as Rect, c = tl.kind === 'prop' ? contentRect(r) : r, cx = c.x + c.w / 2, cy = c.y + c.h / 2, o = s.owner[tl.id] as number, lv = s.lvl[tl.id] as number;
          const col = tl.group >= 0 ? (GROUPS[tl.group] as { color: string }).color : '';
          const own = o >= 0 ? PCOL[o % 6] : null;
          const ownerStrip = own && (r.side === 'b' ? <rect x={r.x} y={r.y + r.h - 9} width={r.w} height="9" fill={own} /> : r.side === 't' ? <rect x={r.x} y={r.y} width={r.w} height="9" fill={own} />
            : r.side === 'l' ? <rect x={r.x} y={r.y} width="9" height={r.h} fill={own} /> : <rect x={r.x + r.w - 9} y={r.y} width="9" height={r.h} fill={own} />);
          const b = bandRect(r), horiz = r.side === 'b' || r.side === 't', built: ReactNode[] = [];
          if (tl.kind === 'prop' && lv > 0) {
            if (lv === 5) built.push(<HotelArt key="h" x={horiz ? b.x + b.w / 2 - 14 : b.x + 1} y={horiz ? b.y + 1 : b.y + b.h / 2 - 14} size={28} />);
            else for (let k = 0; k < lv; k++) built.push(<HouseArt key={k} size={21} x={horiz ? b.x + (b.w - lv * 22) / 2 + k * 22 : b.x + 2} y={horiz ? b.y + 2 : b.y + (b.h - lv * 22) / 2 + k * 22} />);
          }
          const ln = lines(tl.name);
          return (
            <g key={tl.id} className={`mn-tile ${tl.id === now ? 'now' : ''}`} onClick={() => onTile(tl.id)}>
              <rect className="hit" x={r.x} y={r.y} width={r.w} height={r.h} fill={r.side === 'c' ? '#fff3c4' : '#fffdf5'} stroke="#17140e" strokeWidth="3" />
              {tl.kind === 'prop' && <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={col} stroke="#17140e" strokeWidth="3" />}
              {ownerStrip}
              {built}
              {tl.kind === 'prop' && <>{ln.map((l, k) => <text key={k} x={cx} y={cy - 6 + k * 17 - (ln.length === 1 ? -6 : 0)} textAnchor="middle" fontSize="15" fontWeight="800" fill="#17140e">{l}</text>)}
                <text x={cx} y={cy + 32} textAnchor="middle" fontSize="15" fontWeight="700" fill="#555">{tl.price}</text></>}
              {(tl.kind === 'rail' || tl.kind === 'util' || tl.kind === 'chance' || tl.kind === 'chest' || tl.kind === 'tax') && <>
                <TileIcon name={tl.kind === 'util' ? (tl.util === 'air' ? 'drop' : 'bolt') : (ICON_OF[tl.kind] as string)} x={cx - 17} y={c.y + 8} size={34} color={tl.kind === 'chance' ? '#d9480f' : tl.kind === 'chest' ? '#0b7285' : tl.kind === 'util' ? (tl.util === 'air' ? '#1c7ed6' : '#e67700') : '#17140e'} />
                {ln.map((l, k) => <text key={k} x={cx} y={c.y + 58 + k * 16} textAnchor="middle" fontSize="14" fontWeight="800" fill="#17140e">{l}</text>)}
                {tl.price > 0 && <text x={cx} y={c.y + c.h - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="#555">{tl.price}</text>}</>}
              {tl.id === 0 && <><rect x={r.x + 6} y={r.y + 6} width={r.w - 12} height={r.h - 12} rx="10" fill="#d7263d" /><TileIcon name="go" x={r.x + 30} y={r.y + 12} size={58} color="#fff" /><text x={r.x + r.w / 2} y={r.y + 98} textAnchor="middle" fontSize="22" fontWeight="900" fill="#fff">MULAI</text></>}
              {tl.id === 10 && <><rect x={r.x + 8} y={r.y + 8} width="62" height="62" fill="#f08c00" stroke="#17140e" strokeWidth="3" />{[24, 39, 54].map((x) => <line key={x} x1={r.x + x} y1={r.y + 8} x2={r.x + x} y2={r.y + 70} stroke="#17140e" strokeWidth="4" />)}
                <text x={r.x + 90} y={r.y + 30} textAnchor="middle" fontSize="13" fontWeight="800" fill="#17140e">Sekadar</text><text x={r.x + 90} y={r.y + 45} textAnchor="middle" fontSize="13" fontWeight="800" fill="#17140e">Lewat</text><text x={r.x + 40} y={r.y + 92} textAnchor="middle" fontSize="18" fontWeight="900" fill="#17140e">PENJARA</text></>}
              {tl.id === 20 && <><TileIcon name="park" x={r.x + 29} y={r.y + 14} size={60} color="#1c7ed6" /><text x={r.x + r.w / 2} y={r.y + 98} textAnchor="middle" fontSize="17" fontWeight="900" fill="#17140e">PARKIR</text><text x={r.x + r.w / 2} y={r.y + 113} textAnchor="middle" fontSize="13" fontWeight="800" fill="#17140e">BEBAS</text></>}
              {tl.id === 30 && <><TileIcon name="police" x={r.x + 29} y={r.y + 14} size={60} color="#2a4bff" /><text x={r.x + r.w / 2} y={r.y + 98} textAnchor="middle" fontSize="15" fontWeight="900" fill="#17140e">MASUK</text><text x={r.x + r.w / 2} y={r.y + 113} textAnchor="middle" fontSize="15" fontWeight="900" fill="#17140e">PENJARA</text></>}
              {s.mort[tl.id] && <><rect x={r.x} y={r.y} width={r.w} height={r.h} fill="url(#mnmort)" /><text x={cx} y={cy + 6} textAnchor="middle" fontSize="20" fontWeight="900" fill="#d7263d" stroke="#fff" strokeWidth="3" paintOrder="stroke">GADAI</text></>}
              <rect className="glow" x={r.x + 3} y={r.y + 3} width={r.w - 6} height={r.h - 6} fill="none" stroke="#ffc414" strokeWidth="8" opacity="0" />
            </g>
          );
        })}
      </svg>
      {disp.map((t, i) => {
        if (s.out[i]) return null;
        const group = pawnsAt[t] as number[], k = group.indexOf(i), [x, y] = pawnXY(t, k, group.length, (s.jail[i] as number) > 0 && t === 10);
        return <span key={i} className={`mn-pawn ${s.cur === i && s.win < 0 ? 'now' : ''} ${warp ? 'warp' : ''}`} style={{ left: `${(x / VB) * 100}%`, top: `${(y / VB) * 100}%` }}><PawnArt kind={PAWNS[i % 6] as string} color={PCOL[i % 6] as string} size={64} /></span>;
      })}
      <div className="mn-center">
        <div className="mn-logo">MONOPOLI<small>NUSANTARA</small></div>
        <div className="mn-decks"><div><DeckArt deck="chance" w={50} />Kejutan</div><div><DeckArt deck="chest" w={50} />Kas Warga</div></div>
        <div className="mn-dice">{[0, 1].map((k) => <span key={k} className={`mn-die ${tumble ? 'tumble' : ''}`} style={tumble ? { animationDelay: `${k * 0.1}s` } : undefined}><DieFace v={tumble ? 1 + ((hop + k * 3) % 6) : (dice[k] as number)} size={46} /></span>)}</div>
        {msg && <div className="mn-msg">{msg}</div>}
      </div>
      {s.win >= 0 && <div className="mn-win" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} className="mn-conf" style={{ left: `${(i * 37) % 100}%`, background: PCOL[i % 6], animationDelay: `${(i % 9) * 0.12}s` }} />)}</div>}
    </div></div>
  );
}

// ---------- Tampilan utama ----------
interface ViewProps { s: MonoState; viewer: number; names: string[]; onMove: (m: number) => void; active: boolean; bots?: boolean[]; autoplay?: (s: MonoState) => number | null }
type Sheet = null | 'aset' | 'dagang' | 'tantangan' | 'catatan';

export function MonopolyView({ s, viewer, names, onMove, active, bots, autoplay }: ViewProps) {
  const [disp, setDisp] = useState<number[]>(() => s.pos.slice());
  const [busy, setBusy] = useState(false), [tumble, setTumble] = useState(false), [warp, setWarp] = useState(false), [hop, setHop] = useState(0);
  const [dice, setDice] = useState<[number, number]>(s.dice), [msg, setMsg] = useState('');
  const [card, setCard] = useState<{ deck: 'chance' | 'chest'; idx: number; who: number } | null>(null);
  const [floats, setFloats] = useState<{ id: number; who: number; amt: number }[]>([]);
  const [deed, setDeed] = useState<number | null>(null), [sheet, setSheet] = useState<Sheet>(null), [zoom, setZoom] = useState(1), [confirmBk, setConfirmBk] = useState(false);
  const doneRef = useRef<string[]>(CHALLENGES.filter((c) => c.value(s, viewer) >= c.target).map((c) => c.id));
  const [toastCh, setToastCh] = useState('');
  const seen = useRef(s.moves), alive_ = useRef(true), fid = useRef(0), cardRes = useRef<(() => void) | null>(null), mv = useRef(onMove);
  useEffect(() => { mv.current = onMove; });
  useEffect(() => { alive_.current = true; return () => { alive_.current = false; }; }, []);

  useEffect(() => {
    if (s.moves === seen.current) return;
    seen.current = s.moves;
    const evs = s.ev, snap = s;
    void (async () => {
      setBusy(true); setConfirmBk(false);
      let coinDone = false, payDone = false;
      for (const e of evs) {
        if (!alive_.current) return;
        const text = describe(e, names); if (text) setMsg(text);
        switch (e.t) {
          case 'roll': setDice(e.d); mono.step(); await sleep(520); break;
          case 'move': {
            if (e.warp) { setWarp(true); setDisp((d) => d.map((v, i) => (i === e.who ? e.to : v))); if (e.to === 10) mono.jail(); await sleep(700); setWarp(false); break; }
            const path: number[] = []; for (let p = (e.from + 1) % 40; ; p = (p + 1) % 40) { path.push(p); if (p === e.to || path.length > 40) break; }
            for (const p of path) { if (!alive_.current) return; setDisp((d) => d.map((v, i) => (i === e.who ? p : v))); setHop((h) => h + 1); mono.step(); await sleep(190); }
            if (e.go) mono.go();
            break;
          }
          case 'cash': if (e.amt !== 0) { const id = ++fid.current; setFloats((f) => [...f, { id, who: e.who, amt: e.amt }]); setTimeout(() => { if (alive_.current) setFloats((f) => f.filter((x) => x.id !== id)); }, 1400); if (e.amt > 0 && !coinDone) { coinDone = true; mono.coin(); } else if (e.amt < 0 && !payDone) { payDone = true; mono.pay(); } } break;
          case 'rent': case 'tax': await sleep(450); break;
          case 'buy': case 'sold': mono.buy(); await sleep(450); break;
          case 'card': setCard({ deck: e.deck, idx: e.idx, who: e.who }); mono.card(); await new Promise<void>((res) => { cardRes.current = res; setTimeout(res, 3600); }); setCard(null); break;
          case 'build': case 'sell': mono.build(); await sleep(250); break;
          case 'auction': mono.gavel(); await sleep(400); break;
          case 'bid': mono.bid(); await sleep(250); break;
          case 'jail': await sleep(250); break;
          case 'bankrupt': mono.bankrupt(); await sleep(900); break;
          case 'win': sfx.win(); break;
          default: await sleep(150);
        }
      }
      if (!alive_.current) return;
      setDisp(snap.pos.slice()); setWarp(false); setBusy(false);
      const nowDone = CHALLENGES.filter((c) => c.value(snap, viewer) >= c.target).map((c) => c.id);
      const fresh = nowDone.filter((x) => !doneRef.current.includes(x));
      doneRef.current = nowDone;
      if (fresh.length) { setToastCh(CHALLENGES.find((c) => c.id === fresh[0])?.title ?? ''); setTimeout(() => { if (alive_.current) setToastCh(''); }, 3200); mono.go(); }
    })();
  }, [s.moves]); // eslint-disable-line react-hooks/exhaustive-deps

  const actor = monopoly.actor(s), can = active && !busy && !tumble && s.win < 0;
  const doRoll = () => { if (tumble) return; setTumble(true); mono.dice(); let n = 0; const id = setInterval(() => { n++; setHop((h) => h + 1); if (n >= 7 || !alive_.current) { clearInterval(id); if (alive_.current) { setTumble(false); mv.current(MV.ROLL); } } }, 100); };
  useEffect(() => {
    if (!autoplay || busy || tumble || s.win >= 0) return;
    const m = autoplay(s); if (m === null) return;
    const t = setTimeout(() => { if (m === MV.ROLL) doRoll(); else mv.current(m); }, m === MV.ROLL || m === MV.END ? 700 : 950);
    return () => clearTimeout(t);
  }, [s.moves, busy, tumble, autoplay]); // eslint-disable-line react-hooks/exhaustive-deps

  const me = viewer, tile = s.pos[actor] as number, tl = TILES[tile] as Tile, myCash = s.cash[me] as number;
  const send = (m: number) => { if (can) mv.current(m); };
  const okMove = (m: number) => monopoly.apply(s, m) !== null;
  const lim = MODES[s.mode].rounds, cur = actor;
  const botTag = (i: number) => !!bots?.[i];

  // Panel aksi
  let panel: ReactNode;
  if (s.win >= 0) panel = <div className="mn-act turn"><h4>{nm(names, s.win)} menang!</h4><p>Kekayaan akhir: {money(Math.round(netWorth(s, s.win)))}</p></div>;
  else if (!can && !(active && busy)) panel = <div className="mn-act"><h4>{s.phase === 'auction' ? `Lelang: giliran ${nm(names, actor)} menawar` : s.phase === 'trade' ? `${nm(names, actor)} menimbang tawaran dagang` : `Giliran ${nm(names, actor)}`}</h4><p className="muted">{botTag(actor) ? 'Pemain AI sedang berpikir…' : busy ? 'Menunggu animasi…' : 'Menunggu pemain lain.'}</p></div>;
  else if (!can) panel = <div className="mn-act turn"><p className="muted">Sebentar…</p></div>;
  else if (s.phase === 'roll') {
    const j = s.jail[me] as number;
    panel = <div className="mn-act turn"><h4>{j > 0 ? `Kamu di penjara (percobaan ${j}/3)` : s.again ? 'Dadu kembar! Lempar lagi' : 'Giliranmu'}</h4>
      <Button size="lg" onClick={doRoll}>Lempar Dadu</Button>
      {j > 0 && <div className="mn-row"><Button size="sm" variant="soft" disabled={!okMove(MV.PAY_JAIL)} onClick={() => send(MV.PAY_JAIL)}>Bayar denda {money(50)}</Button><Button size="sm" variant="soft" disabled={(s.free[me] as number) < 1} onClick={() => send(MV.USE_FREE)}>Pakai kartu bebas ({s.free[me]})</Button></div>}
      {j > 0 && <p className="muted">Lempar dadu kembar untuk keluar. Percobaan ke-3 gagal = denda paksa.</p>}</div>;
  } else if (s.phase === 'buy') {
    const afford = myCash >= tl.price;
    panel = <div className="mn-act turn"><h4>Beli {tl.name}?</h4><Deed t={tile} s={s} names={names} />
      <div className="mn-row"><Button disabled={!afford} onClick={() => send(MV.BUY)}>Beli {money(tl.price)}</Button><Button variant="soft" onClick={() => send(MV.AUCTION)}>Lelang</Button></div>
      {!afford && <p className="muted center">Uangmu kurang. Gadai aset lewat tombol Aset, atau lelang.</p>}</div>;
  } else if (s.phase === 'auction' && s.auction) {
    const a = s.auction, at = TILES[a.tile] as Tile;
    panel = <div className="mn-act turn"><div className="mn-auc"><small>LELANG · {at.name} (harga {money(at.price)})</small><div className="bid">{money(a.bid)}</div><small>{a.top >= 0 ? `Tertinggi: ${nm(names, a.top)}` : 'Belum ada penawaran'}</small></div>
      <div className="mn-row">{BID_STEPS.map((st, k) => <Button key={k} size="sm" disabled={myCash < a.bid + st} onClick={() => send(mvBid(k))}>+{st}</Button>)}<Button size="sm" variant="ghost" onClick={() => send(MV.PASS)}>Lewati</Button></div></div>;
  } else if (s.phase === 'debt' && s.debt) {
    const d = s.debt, enough = myCash >= d.amount;
    panel = <div className="mn-act turn"><h4>Kamu berutang {money(d.amount)}{d.to >= 0 ? ` ke ${nm(names, d.to)}` : d.to === -2 ? ' ke semua pemain' : ''}</h4>
      <p>Uangmu {money(myCash)}. {enough ? 'Cukup untuk membayar.' : 'Jual bangunan atau gadai properti dulu.'}</p>
      <div className="mn-row"><Button disabled={!enough} onClick={() => send(MV.SETTLE)}>Bayar sekarang</Button><Button variant="soft" onClick={() => setSheet('aset')}>Aset</Button></div>
      {!enough && (confirmBk ? <div className="mn-row"><Button variant="danger" size="sm" onClick={() => send(MV.BANKRUPT)}>Ya, aku bangkrut</Button><Button variant="ghost" size="sm" onClick={() => setConfirmBk(false)}>Batal</Button></div> : <Button variant="ghost" size="sm" onClick={() => setConfirmBk(true)}>Menyerah / bangkrut</Button>)}</div>;
  } else if (s.phase === 'trade' && s.trade) {
    const t = s.trade, g = t.give >= 0 ? tn(t.give) : null, w = t.get >= 0 ? tn(t.get) : null;
    panel = <div className="mn-act turn"><h4>{nm(names, t.from)} menawarkan dagang</h4>
      <p>Kamu menerima: <b>{[g, t.cash > 0 ? money(t.cash) : null].filter(Boolean).join(' + ') || 'tidak ada'}</b><br />Kamu memberi: <b>{[w, t.cash < 0 ? money(-t.cash) : null].filter(Boolean).join(' + ') || 'tidak ada'}</b></p>
      <div className="mn-row"><Button disabled={!okMove(MV.ACCEPT)} onClick={() => send(MV.ACCEPT)}>Terima</Button><Button variant="ghost" onClick={() => send(MV.REJECT)}>Tolak</Button></div></div>;
  } else {
    panel = <div className="mn-act turn"><h4>Selesaikan giliranmu</h4><p className="muted">Bangun, gadai, atau berdagang dulu bila perlu.</p>
      <Button size="lg" onClick={() => send(MV.END)}>Selesai Giliran</Button>
      {s.mode === 'klasik' && s.round >= FINISH_ROUND && <Button size="sm" variant="ghost" onClick={() => send(MV.FINISH)}>Akhiri game & hitung kekayaan</Button>}</div>;
  }
  const manage = can && ['roll', 'end', 'buy', 'debt'].includes(s.phase), tradeOk = can && (s.phase === 'roll' || s.phase === 'end') && alive(s).length > 1;
  const tileHint = (t: number): string => { const k = (TILES[t] as Tile).kind; return k === 'go' ? 'Lewati MULAI untuk menerima gaji.' : k === 'jail' ? 'Sekadar lewat bila tidak sedang ditahan.' : k === 'park' ? 'Istirahat. Tidak terjadi apa-apa.' : k === 'gojail' ? 'Mendarat di sini = langsung masuk penjara.' : k === 'tax' ? `Bayar ${money(t === 4 ? 200 : 100)} ke bank.` : k === 'chance' ? 'Ambil satu kartu Kejutan.' : 'Ambil satu kartu Kas Warga.'; };

  return (
    <div className="mn">
      <div className="mn-top">{names.map((n, i) => (
        <div key={i} className={`mn-pl ${s.cur === i && s.win < 0 ? 'turn' : ''} ${s.out[i] ? 'out' : ''}`}>
          <PawnArt kind={PAWNS[i % 6] as string} color={PCOL[i % 6] as string} size={30} /><b>{n}</b><span className="cash">{money(s.cash[i] as number)}</span>
          {botTag(i) && <span className="tag">AI</span>}{(s.jail[i] as number) > 0 && <span className="tag" style={{ background: '#f08c00', left: -4, right: 'auto' }}>Penjara</span>}
          {floats.filter((f) => f.who === i).map((f) => <span key={f.id} className={`mn-float ${f.amt > 0 ? 'up' : 'dn'}`}>{f.amt > 0 ? '+' : ''}{f.amt}</span>)}
        </div>))}</div>
      <div className="mn-info"><span>Putaran {Math.min(s.round, lim || s.round)}{lim ? ` / ${lim}` : ''} · {MODES[s.mode].label}</span>
        <button className="chip" onClick={() => setZoom(zoom === 1 ? 1.9 : 1)} aria-label="Perbesar papan"><MonoIcon name="zoom" size={14} /> {zoom === 1 ? 'Zoom' : 'Normal'}</button></div>
      <Board s={s} disp={disp} now={disp[cur] as number} warp={warp} hop={hop} tumble={tumble} dice={dice} zoom={zoom} msg={msg} onTile={setDeed} />
      {toastCh && <div className="expl" style={{ marginTop: 8, textAlign: 'center' }}><b>Tantangan selesai: {toastCh}</b></div>}
      {panel}
      <div className="mn-tabs">
        <button className="chip" disabled={!manage} onClick={() => setSheet('aset')}><MonoIcon name="home" size={15} /> Aset</button>
        <button className="chip" disabled={!tradeOk} onClick={() => setSheet('dagang')}><MonoIcon name="swap" size={15} /> Dagang</button>
        <button className="chip" onClick={() => setSheet('tantangan')}><MonoIcon name="flag" size={15} /> Tantangan</button>
        <button className="chip" onClick={() => setSheet('catatan')}><MonoIcon name="list" size={15} /> Catatan</button>
      </div>

      <Modal open={deed !== null} title={deed !== null ? tn(deed) : ''} onClose={() => setDeed(null)}>{deed !== null && ((TILES[deed] as Tile).kind === 'prop' || (TILES[deed] as Tile).kind === 'rail' || (TILES[deed] as Tile).kind === 'util' ? <Deed t={deed} s={s} names={names} /> : <p className="center">{tileHint(deed)}</p>)}</Modal>
      <Modal open={sheet === 'aset'} title="Asetku" onClose={() => setSheet(null)}>
        <p className="small muted">Uang: {money(myCash)} · Kekayaan: {money(Math.round(netWorth(s, me)))}{(s.free[me] as number) > 0 ? ` · Kartu bebas: ${s.free[me]}` : ''}</p>
        <div className="mn-assets">{ownedBy(s, me).length === 0 && <p className="muted center">Belum punya properti.</p>}
          {ownedBy(s, me).map((t) => { const x = TILES[t] as Tile, g = x.group >= 0 ? (GROUPS[x.group] as (typeof GROUPS)[number]) : null, lv = s.lvl[t] as number;
            return <div key={t} className={`mn-as ${s.mort[t] ? 'mort' : ''}`}><span className="sw" style={{ background: g?.color ?? (x.kind === 'rail' ? '#455a64' : '#f08c00') }} />
              <div className="nm">{x.name}<small>{s.mort[t] ? `Digadai (tebus ${money(unmortCost(t))})` : lv === 5 ? 'Hotel' : lv > 0 ? `${lv} rumah` : money(x.price)}</small></div>
              <div className="bt">
                {g && <button disabled={!can || !canBuild(s, me, t)} onClick={() => send(mvBuild(t))} aria-label={`Bangun di ${x.name}`}><HouseArt size={14} />+</button>}
                {g && <button disabled={!can || !canSell(s, me, t)} onClick={() => send(mvSell(t))} aria-label={`Jual bangunan ${x.name}`}><HouseArt size={14} />-</button>}
                <button disabled={!can || !(s.mort[t] ? canUnmortgage(s, me, t) : canMortgage(s, me, t))} onClick={() => send(s.mort[t] ? mvUnmort(t) : mvMort(t))} aria-label={s.mort[t] ? `Tebus ${x.name}` : `Gadai ${x.name}`}><MonoIcon name={s.mort[t] ? 'check' : 'lock'} size={14} />{s.mort[t] ? 'Tebus' : 'Gadai'}</button>
              </div></div>; })}</div>
        <p className="small muted">Bangun butuh satu set warna penuh dan harus merata. Jual bangunan mengembalikan setengah harga.</p>
      </Modal>
      {sheet === 'dagang' && <TradeSheet s={s} me={me} names={names} onClose={() => setSheet(null)} onSend={(m) => { send(m); setSheet(null); }} />}
      <Modal open={sheet === 'tantangan'} title="Tantangan" onClose={() => setSheet(null)}>
        {CHALLENGES.map((c) => { const v = Math.min(c.target, c.value(s, me)), ok = v >= c.target; return (
          <div key={c.id} className={`mn-ch ${ok ? 'done' : ''}`}><MonoIcon name={ok ? 'check' : 'flag'} size={22} color={ok ? '#0b8a4d' : '#17140e'} /><div><b>{c.title}</b><small>{c.desc}</small><div className="mn-prog"><i style={{ width: `${(v / c.target) * 100}%` }} /></div></div><b>+{c.xp} XP</b></div>); })}
      </Modal>
      <Modal open={sheet === 'catatan'} title="Catatan permainan" onClose={() => setSheet(null)}>
        <div className="mn-log">{s.log.slice().reverse().map((e, i) => { const t = describe(e, names); return t ? <div key={i}>{t}</div> : null; })}{s.log.length === 0 && <p className="muted">Belum ada kejadian.</p>}</div>
      </Modal>
      {card && <div className="mn-card-bg" onClick={() => cardRes.current?.()} role="dialog" aria-label="Kartu">
        <div className="mn-flip"><div className="mn-face front" style={{ borderColor: '#17140e' }}>
          <div className="hd" style={{ background: card.deck === 'chance' ? '#f28c28' : '#2a9d8f' }}><h3>{card.deck === 'chance' ? 'KEJUTAN' : 'KAS WARGA'}</h3></div>
          <MonoIcon name={card.deck} size={54} color={card.deck === 'chance' ? '#d9480f' : '#0b7285'} />
          <p>{(card.deck === 'chance' ? CHANCE : CHEST)[card.idx]?.text}</p><small className="muted">{nm(names, card.who)} · ketuk untuk lanjut</small></div></div></div>}
    </div>
  );
}

function TradeSheet({ s, me, names, onClose, onSend }: { s: MonoState; me: number; names: string[]; onClose: () => void; onSend: (m: number) => void }) {
  const others = alive(s).filter((i) => i !== me);
  const [to, setTo] = useState(others[0] ?? 0), [give, setGive] = useState(-1), [get, setGet] = useState(-1), [cash, setCash] = useState(0);
  const mine = ownedBy(s, me), theirs = ownedBy(s, to);
  const opt = (ids: number[]) => [{ value: '-1', label: '(tidak ada)' }, ...ids.map((t) => ({ value: String(t), label: `${tn(t)}${s.mort[t] ? ' (gadai)' : ''}` }))];
  const ok = validTrade(s, me, to, give, get, cash);
  return (
    <Modal open title="Ajukan dagang" onClose={onClose}>
      <Select label="Dagang dengan" value={String(to)} options={others.map((i) => ({ value: String(i), label: nm(names, i) }))} onChange={(v) => { setTo(Number(v)); setGet(-1); }} />
      <div className="gap"><Select label="Aku berikan" value={String(give)} options={opt(mine)} onChange={(v) => setGive(Number(v))} /></div>
      <div className="gap"><Select label="Aku minta" value={String(get)} options={opt(theirs)} onChange={(v) => setGet(Number(v))} /></div>
      <div className="mn-row gap"><Button size="sm" variant="soft" onClick={() => setCash(Math.max(-1000, cash - 25))}>-25</Button><b className="center" style={{ flex: 2 }}>{cash === 0 ? 'Tanpa uang' : cash > 0 ? `Aku bayar ${money(cash)}` : `Aku terima ${money(-cash)}`}</b><Button size="sm" variant="soft" onClick={() => setCash(Math.min(1000, cash + 25))}>+25</Button></div>
      <p className="small muted">Petak yang ada bangunannya tidak bisa didagangkan. {nm(names, to)} akan memilih terima atau tolak.</p>
      <Button size="lg" disabled={!ok} onClick={() => onSend(tradeMove(to, give < 0 ? 40 : give, get < 0 ? 40 : get, Math.abs(cash) / 25, cash < 0))}>Kirim tawaran</Button>
    </Modal>
  );
}

// ---------- Ringkasan hasil ----------
export function MonoSummary({ s, names, humans }: { s: MonoState; names: string[]; humans: number }) {
  return (
    <div className="card">
      <h3>Kekayaan akhir</h3>
      {names.map((n, i) => <div key={i} className="score-row"><span className="mn-own"><PawnArt kind={PAWNS[i % 6] as string} color={PCOL[i % 6] as string} size={22} />{n}{s.out[i] ? ' (bangkrut)' : ''}</span><span>{money(Math.round(netWorth(s, i)))}</span></div>)}
      <h3 className="gap">Tantangan {humans > 1 ? `(${nm(names, 0)})` : ''}</h3>
      {CHALLENGES.map((c) => { const ok = c.value(s, 0) >= c.target; return <div key={c.id} className="mn-ch" style={{ background: ok ? '#e6f9ee' : '#fff' }}><MonoIcon name={ok ? 'check' : 'flag'} size={20} color={ok ? '#0b8a4d' : '#999'} /><div><b>{c.title}</b><small>{c.desc}</small></div><b>{ok ? `+${c.xp}` : '-'}</b></div>; })}
    </div>
  );
}

// ---------- Mode offline: solo (lawan AI), duo, squad ----------
const BOT_NAMES = ['Pak Bowo', 'Bu Sari', 'Mas Dimas', 'Mbak Rina', 'Om Joko'];
export function MonopolyMech({ game, players, seed, onDone }: MechProps) {
  const humans = players.length, maxBots = 6 - humans;
  const [bots, setBots] = useState<number | null>(null), [lvl, setLvl] = useState<0 | 1>(1);
  const [pick, setPick] = useState(humans === 1 ? Math.min(2, maxBots) : 0);
  const names = useMemo(() => [...players, ...BOT_NAMES.slice(0, bots ?? 0)], [players, bots]);
  const isBot = useMemo(() => names.map((_, i) => i >= humans), [names, humans]);
  const mode = game.bank ?? 'klasik';
  const engSeed = `${seed}~${mode}`;
  const [s, setS] = useState<MonoState | null>(null);
  const finished = useRef(false);
  useEffect(() => {
    if (!s || s.win < 0 || finished.current) return;
    finished.current = true;
    const t = setTimeout(() => {
      const w = s.win, sc = monoScores(s), hum0 = challengeXp(s, 0), won = w < humans;
      onDone({ scores: sc, correct: CHALLENGES.filter((c) => c.value(s, 0) >= c.target).length, total: CHALLENGES.length, headline: `${names[w]} menang dengan kekayaan ${money(sc[w] as number)}`, xp: 30 + (won ? 25 : 0) + hum0, summary: <MonoSummary s={s} names={names} humans={humans} /> });
    }, 2600);
    return () => clearTimeout(t);
  }, [s?.win]); // eslint-disable-line react-hooks/exhaustive-deps
  if (bots === null || !s) return (
    <div className="card mn-setup">
      <h3>Siapkan Monopoli Nusantara</h3>
      <p className="small muted">{MODES[mode as keyof typeof MODES]?.desc}</p>
      <p className="small"><b>{humans === 1 ? 'Solo' : humans === 2 ? 'Duo' : 'Squad'}</b>: {humans} pemain manusia{humans > 1 ? ' main bergiliran di satu ponsel' : ''}. Tambah lawan AI bila mau (maksimal total 6 pemain).</p>
      <div className="mn-pick gap"><span className="small">Lawan AI:</span>{Array.from({ length: maxBots + 1 }, (_, k) => k).filter((k) => humans + k >= 2).map((k) => <button key={k} className={`chip ${pick === k ? 'on' : ''}`} onClick={() => setPick(k)}>{k}</button>)}</div>
      <div className="mn-pick gap"><span className="small">Tingkat AI:</span><button className={`chip ${lvl === 0 ? 'on' : ''}`} onClick={() => setLvl(0)}>Santai</button><button className={`chip ${lvl === 1 ? 'on' : ''}`} onClick={() => setLvl(1)}>Cerdas</button></div>
      <div className="mn-pick gap">{Array.from({ length: humans + pick }, (_, i) => <span key={i} title={PAWN_NAME[PAWNS[i % 6] as string]} className="mn-pawnpick"><PawnArt kind={PAWNS[i % 6] as string} color={PCOL[i % 6] as string} size={34} /></span>)}</div>
      <Button size="lg" className="gap" onClick={() => { const n = Math.max(pick, humans === 1 ? 1 : 0); setBots(n); setS(monopoly.init(humans + n, engSeed)); }}>Mulai</Button>
    </div>
  );
  const actor = monopoly.actor(s), humanActor = actor < humans;
  const viewer = humanActor ? actor : 0;
  const move = (m: number) => { setS((cur) => (cur ? monopoly.apply(cur, m) ?? cur : cur)); };
  return <MonopolyView s={s} viewer={viewer} names={names} onMove={move} active={humanActor && s.win < 0} bots={isBot} autoplay={(st) => (monopoly.actor(st) >= humans ? botMove(st, lvl) : null)} />;
}
