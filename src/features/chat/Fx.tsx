import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import '../../styles/fx.css';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/ui';
import type { ChatMsg } from '../../services/chat';

/** Emoji bawaan perangkat, ditampilkan apa adanya (bukan diganti ikon). */
export const EMOTES = ['👍', '😂', '😮', '🔥', '❤️', '👏', '🎉', '😭', '🤔', '😎'];
export function NativeEmoji({ t }: { t: string }) { return <span className="emo-native" role="img" aria-label={t}>{t}</span>; }

/** Stiker teks kustom datar. */
export const STICKERS: { id: string; label: string; bg: string; fg: string; icon: string; rot: number }[] = [
  { id: 'gg', label: 'GG!', bg: '#2a4bff', fg: '#fff', icon: 'trophy', rot: -4 }, { id: 'mantap', label: 'Mantap!', bg: '#ffc414', fg: '#17140e', icon: 'star', rot: 3 },
  { id: 'wkwk', label: 'Wkwk', bg: '#ff9ec0', fg: '#17140e', icon: 'sparkle', rot: -3 }, { id: 'awas', label: 'Awas!', bg: '#e0401f', fg: '#fff', icon: 'bolt', rot: 4 },
  { id: 'sabar', label: 'Sabar ya', bg: '#0f8f5f', fg: '#fff', icon: 'heart', rot: -2 }, { id: 'ayo', label: 'Ayo!', bg: '#f2eadb', fg: '#17140e', icon: 'fire', rot: 3 },
  { id: 'hebat', label: 'Hebat!', bg: '#2a4bff', fg: '#fff', icon: 'check', rot: 2 }, { id: 'yah', label: 'Yaaah…', bg: '#6a6252', fg: '#fff', icon: 'x', rot: -3 },
  { id: 'wow', label: 'Wow!', bg: '#ffc414', fg: '#17140e', icon: 'sun', rot: -4 }, { id: 'siap', label: 'Siap!', bg: '#0f8f5f', fg: '#fff', icon: 'flag', rot: 3 },
  { id: 'rematch', label: 'Sekali lagi!', bg: '#e0401f', fg: '#fff', icon: 'repeat', rot: -2 }, { id: 'lanjut', label: 'Lanjut', bg: '#ff9ec0', fg: '#17140e', icon: 'play', rot: 2 },
];

/** Reaksi kustom: wajah & simbol digambar sendiri dengan SVG. Id berawalan "r-" dikirim sebagai jenis 'sticker'. */
export const CUSTOM_REACTS = [
  { id: 'r-tawa', label: 'Ngakak' }, { id: 'r-kaget', label: 'Kaget' }, { id: 'r-nangis', label: 'Nangis' }, { id: 'r-keren', label: 'Keren' },
  { id: 'r-marah', label: 'Marah' }, { id: 'r-cinta', label: 'Cinta' }, { id: 'r-mikir', label: 'Mikir' }, { id: 'r-ngantuk', label: 'Ngantuk' },
  { id: 'r-hati', label: 'Hati' }, { id: 'r-api', label: 'Api' },
] as const;
const INK = '#17140e';
export function CustomReact({ id, size = 44 }: { id: string; size?: number }) {
  const face = (a: string, b: string) => (<><defs><radialGradient id={`f${id}`} cx=".35" cy=".3" r=".9"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></radialGradient></defs><circle cx="32" cy="32" r="28" fill={`url(#f${id})`} stroke={INK} strokeWidth="3.5" /></>);
  const st = { fill: 'none', stroke: INK, strokeWidth: 3.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const dot = (x: number, y: number, r = 3.4) => <circle cx={x} cy={y} r={r} fill={INK} />;
  let g: ReactNode;
  switch (id) {
    case 'r-tawa': g = (<>{face('#ffe27a', '#f5a800')}<path d="M16 26q5-7 11 0M37 26q5-7 11 0" {...st} /><path d="M15 36q17 24 34 0z" fill="#7a1f1f" stroke={INK} strokeWidth="3" strokeLinejoin="round" /><path d="M24 47q8-7 16 0q-8 5-16 0z" fill="#ff7a8a" /><path d="M8 30q-3 5 0 8q3-3 0-8zM56 30q3 5 0 8q-3-3 0-8z" fill="#5cc8ff" stroke={INK} strokeWidth="1.8" /></>); break;
    case 'r-kaget': g = (<>{face('#ffe27a', '#f5a800')}<circle cx="22" cy="28" r="7.5" fill="#fff" stroke={INK} strokeWidth="2.8" /><circle cx="42" cy="28" r="7.5" fill="#fff" stroke={INK} strokeWidth="2.8" />{dot(22, 29, 3)}{dot(42, 29, 3)}<path d="M14 15q8-6 15-1M35 14q8-5 15 1" {...st} /><ellipse cx="32" cy="46" rx="6" ry="8" fill="#7a1f1f" stroke={INK} strokeWidth="3" /><path d="M54 12q4 5 0 9q-4-4 0-9z" fill="#5cc8ff" stroke={INK} strokeWidth="1.8" /></>); break;
    case 'r-nangis': g = (<>{face('#ffe27a', '#f5a800')}<path d="M16 28q5 5 11 0M37 28q5 5 11 0" {...st} /><path d="M23 47q9-9 18 0" {...st} /><path d="M20 33q-3 10-1 18q5-3 5-10zM44 33q3 10 1 18q-5-3-5-10z" fill="#5cc8ff" stroke={INK} strokeWidth="2" strokeLinejoin="round" /></>); break;
    case 'r-keren': g = (<>{face('#ffe27a', '#f5a800')}<path d="M9 25h46v4q0 11-12 11q-8 0-9-8h-4q-1 8-9 8q-12 0-12-11z" fill={INK} /><path d="M14 27l6 0M36 27l6 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".6" /><path d="M22 47q10 6 20-2" {...st} /></>); break;
    case 'r-marah': g = (<>{face('#ff9a7a', '#d7263d')}<path d="M13 19l16 7M51 19l-16 7" {...st} strokeWidth="4" />{dot(22, 33)}{dot(42, 33)}<path d="M21 49q11-9 22 0" {...st} /><path d="M50 8q3-4 6 0M10 8q-3-4-6 0" {...st} strokeWidth="2.5" /></>); break;
    case 'r-cinta': g = (<>{face('#ffe27a', '#f5a800')}{[20, 44].map((x) => <path key={x} d={`M${x} 38c-12-8-9-18 0-14c9-4 12 6 0 14z`} fill="#e0204a" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />)}<path d="M20 43q12 12 24 0" {...st} /></>); break;
    case 'r-mikir': g = (<>{face('#ffe27a', '#f5a800')}<path d="M13 22q7-5 14-1" {...st} /><path d="M36 17l14-2" {...st} />{dot(22, 29)}{dot(43, 29)}<path d="M23 46q9-3 18-1" {...st} /><text x="50" y="14" fontSize="16" fontWeight="900" fill={INK} fontFamily="inherit">?</text></>); break;
    case 'r-ngantuk': g = (<>{face('#ffe27a', '#f5a800')}<path d="M15 29h12M37 29h12" {...st} /><ellipse cx="32" cy="46" rx="4.5" ry="5.5" fill="#7a1f1f" stroke={INK} strokeWidth="2.6" /><text x="44" y="18" fontSize="13" fontWeight="900" fill="#2a4bff" stroke={INK} strokeWidth=".8" fontFamily="inherit">Z</text><text x="51" y="10" fontSize="9" fontWeight="900" fill="#2a4bff" stroke={INK} strokeWidth=".6" fontFamily="inherit">z</text></>); break;
    case 'r-hati': g = (<><path d="M32 56C6 38 6 12 22 10c7-1 10 4 10 8c0-4 3-9 10-8c16 2 16 28-10 46z" fill="#e0204a" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" /><path d="M16 20q3-6 9-4" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" opacity=".7" /></>); break;
    case 'r-api': g = (<><path d="M32 4c2 10 14 16 14 30a14 14 0 0 1-28 0c0-6 3-9 6-12c0 5 3 7 5 7c-3-9 0-18 3-25z" fill="#ff7a1a" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" /><path d="M32 30c1 6 7 8 7 16a7 7 0 0 1-14 0c0-5 5-8 7-16z" fill="#ffd23f" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" /></>); break;
    default: return <span>{id}</span>;
  }
  const label = CUSTOM_REACTS.find((c) => c.id === id)?.label ?? id;
  return <svg className="fx-custom" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={label}>{g}</svg>;
}

export function Sticker({ id, size = 1 }: { id: string; size?: number }) {
  if (id.startsWith('r-')) return <CustomReact id={id} size={44 * size} />;
  const s = STICKERS.find((x) => x.id === id);
  if (!s) return <span>{id}</span>;
  return <span className="sticker" style={{ background: s.bg, color: s.fg, transform: `rotate(${s.rot}deg) scale(${size})` }}><Icon name={s.icon} size={18} />{s.label}</span>;
}

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h; };
/** Lapisan animasi: reaksi muncul lalu melayang naik. */
export function FxLayer({ events }: { events: ChatMsg[] }) {
  return (
    <div className="fx-layer" aria-hidden="true">
      {events.map((e) => (
        <div key={e.id} className="fx-bubble" style={{ left: `${8 + (hash(e.id) % 74)}%` }}>
          {e.kind === 'sticker' ? <Sticker id={e.text} size={e.text.startsWith('r-') ? 1.5 : 1.4} /> : <span className="fx-emoji"><NativeEmoji t={e.text} /></span>}
          {e.name && <small>{e.name}</small>}
        </div>))}
    </div>
  );
}

/** Lembar pilihan: emoji bawaan, reaksi kustom, stiker. */
export function ReactSheet({ open, onClose, onFire }: { open: boolean; onClose: () => void; onFire: (kind: 'react' | 'sticker', v: string) => void }) {
  return (
    <Modal open={open} title="Stiker & emote" onClose={onClose}>
      <p className="small muted">Emoji bawaan</p>
      <div className="row wrap">{EMOTES.map((em) => <button key={em} className="fx-btn big" aria-label={`Kirim ${em}`} onClick={() => { onFire('react', em); onClose(); }}><NativeEmoji t={em} /></button>)}</div>
      <p className="small muted gap">Reaksi kustom</p>
      <div className="row wrap">{CUSTOM_REACTS.map((c) => <button key={c.id} className="fx-btn big" aria-label={`Kirim ${c.label}`} onClick={() => { onFire('sticker', c.id); onClose(); }}><CustomReact id={c.id} size={36} /></button>)}</div>
      <p className="small muted gap">Stiker</p>
      <div className="sticker-grid">{STICKERS.map((s) => <button key={s.id} className="sticker-btn" onClick={() => { onFire('sticker', s.id); onClose(); }}><Sticker id={s.id} /></button>)}</div>
    </Modal>
  );
}

/** Peristiwa reaksi lokal (tanpa server) untuk permainan offline / satu perangkat. */
export function useLocalFx(name = '') {
  const [events, setEvents] = useState<ChatMsg[]>([]);
  const n = useRef(0);
  const fire = useCallback((kind: 'react' | 'sticker', text: string) => {
    const e: ChatMsg = { id: `l${++n.current}-${text}`, uid: 'local', name, kind, text, at: Date.now() };
    setEvents((cur) => [...cur.slice(-11), e]);
    setTimeout(() => setEvents((cur) => cur.filter((x) => x.id !== e.id)), 4200);
  }, [name]);
  return { events, fire };
}

const DOCK = 48, POS_KEY = 'duopop:fxdock';
const clampPos = (x: number, y: number) => ({ x: Math.min(Math.max(6, x), Math.max(6, window.innerWidth - DOCK - 6)), y: Math.min(Math.max(70, y), Math.max(70, window.innerHeight - DOCK - 6)) });
const loadPos = (): { x: number; y: number } | null => { try { const v = JSON.parse(localStorage.getItem(POS_KEY) ?? 'null') as { x: number; y: number } | null; return v && Number.isFinite(v.x) && Number.isFinite(v.y) ? clampPos(v.x, v.y) : null; } catch { return null; } };

/** Tombol reaksi mengambang untuk semua permainan offline: ketuk emoji lalu melayang. Tombolnya bisa ditahan dan digeser ke mana saja. */
export function LocalReactDock() {
  const { events, fire } = useLocalFx();
  const [open, setOpen] = useState(false), [sheet, setSheet] = useState(false), [drag, setDrag] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(loadPos);
  const st = useRef({ sx: 0, sy: 0, ox: 0, oy: 0, moved: false, id: -1 });
  const dockRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onResize = () => setPos((p) => (p ? clampPos(p.x, p.y) : p));
    window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize);
  }, []);
  const down = (e: RPointerEvent<HTMLButtonElement>) => {
    const r = dockRef.current?.getBoundingClientRect(); if (!r) return;
    st.current = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false, id: e.pointerId };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* tidak didukung */ }
  };
  const move = (e: RPointerEvent<HTMLButtonElement>) => {
    const s = st.current; if (s.id !== e.pointerId) return;
    const dx = e.clientX - s.sx, dy = e.clientY - s.sy;
    if (!s.moved && Math.hypot(dx, dy) < 8) return;
    s.moved = true; setDrag(true); setPos(clampPos(s.ox + dx, s.oy + dy));
  };
  const up = (e: RPointerEvent<HTMLButtonElement>) => {
    const s = st.current; if (s.id !== e.pointerId) return;
    s.id = -1; setDrag(false);
    if (s.moved) { setPos((p) => { if (p) { try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch { /* penyimpanan penuh */ } } return p; }); }
  };
  const click = () => { if (st.current.moved) { st.current.moved = false; return; } setOpen((o) => !o); };
  const right = !pos || pos.x > window.innerWidth / 2, bottom = !pos || pos.y > window.innerHeight / 2;
  return (
    <>
      <FxLayer events={events} />
      <div ref={dockRef} className={`fx-dock ${pos ? '' : 'def'}`} style={pos ? { left: pos.x, top: pos.y } : undefined}>
        {open && (
          <div className={`fx-tray ${right ? 'r' : 'l'} ${bottom ? 'b' : 't'}`} role="group" aria-label="Reaksi">
            {EMOTES.slice(0, 6).map((em) => <button key={em} className="fx-btn" onClick={() => fire('react', em)} aria-label={`Reaksi ${em}`}><NativeEmoji t={em} /></button>)}
            {CUSTOM_REACTS.slice(0, 4).map((c) => <button key={c.id} className="fx-btn" onClick={() => fire('sticker', c.id)} aria-label={`Reaksi ${c.label}`}><CustomReact id={c.id} size={28} /></button>)}
            <button className="fx-btn" onClick={() => setSheet(true)} aria-label="Stiker"><Icon name="sparkle" size={20} /></button>
          </div>)}
        <button className={`fx-fab ${drag ? 'drag' : ''}`} title="Tahan dan geser untuk memindahkan" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={click} aria-label={open ? 'Tutup reaksi' : 'Reaksi'} aria-expanded={open}>{open ? <Icon name="x" size={20} /> : <NativeEmoji t="😄" />}</button>
      </div>
      <ReactSheet open={sheet} onClose={() => setSheet(false)} onFire={fire} />
    </>
  );
}
