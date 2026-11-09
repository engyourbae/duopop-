import { useId } from 'react';

/** Semua aset visual Monopoli Nusantara digambar sebagai SVG buatan sendiri (tanpa emoji / gambar luar). */
const INK = '#17140e';
function mix(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16), f = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Bidak 3D semu: alas, bayangan, gradien cahaya. */
export function PawnArt({ kind, color, size = 40 }: { kind: string; color: string; size?: number }) {
  const id = useId().replace(/:/g, ''), gid = `pg${id}`, lt = mix(color, 0.55), dk = mix(color, -0.35);
  const st = { stroke: INK, strokeWidth: 1.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const fill = `url(#${gid})`;
  let body;
  switch (kind) {
    case 'becak': body = (<>
      <circle cx="13" cy="32" r="7" fill="#fff" {...st} /><circle cx="13" cy="32" r="1.6" fill={INK} /><path d="M13 25v14M6 32h14" stroke={INK} strokeWidth=".8" />
      <circle cx="37" cy="34" r="5" fill="#fff" {...st} /><circle cx="37" cy="34" r="1.2" fill={INK} />
      <path d="M6 22a10 10 0 0 1 20 0z" fill={fill} {...st} /><path d="M8 22h16v8H8z" fill={fill} {...st} />
      <path d="M24 31l13 3M33 24h6M36 24v10" fill="none" {...st} /></>); break;
    case 'pinisi': body = (<>
      <path d="M24 6v26" stroke={INK} strokeWidth="1.8" /><path d="M24 6l3 2-3 2z" fill="#e03131" {...st} strokeWidth={1} />
      <path d="M25 10l13 20H25z" fill="#fff8e6" {...st} /><path d="M23 14L11 30h12z" fill={lt} {...st} />
      <path d="M5 30h38l-6 9H11z" fill={fill} {...st} /><path d="M9 34h30" stroke={INK} strokeWidth=".9" /></>); break;
    case 'garuda': body = (<>
      <path d="M24 26C16 24 8 18 3 6c9 2 16 4 20 11z" fill={fill} {...st} /><path d="M24 26c8-2 16-8 21-20-9 2-16 4-20 11z" fill={fill} {...st} />
      <path d="M20 34l4 9 4-9z" fill={dk} {...st} /><ellipse cx="24" cy="27" rx="5.5" ry="9" fill={fill} {...st} />
      <circle cx="24" cy="15" r="4.6" fill="#fff8e6" {...st} /><path d="M24 14l7 3-7 3z" fill="#f4c430" {...st} strokeWidth={1.2} /><circle cx="22.4" cy="14" r=".9" fill={INK} /></>); break;
    case 'motor': body = (<>
      <circle cx="10" cy="34" r="6.5" fill="#fff" {...st} /><circle cx="10" cy="34" r="1.4" fill={INK} /><circle cx="38" cy="34" r="6.5" fill="#fff" {...st} /><circle cx="38" cy="34" r="1.4" fill={INK} />
      <path d="M12 31q8-14 22-3l-6 5H16z" fill={fill} {...st} /><rect x="14" y="18" width="14" height="4.5" rx="2" fill={dk} {...st} />
      <path d="M32 26l3-12h5" fill="none" {...st} /><circle cx="40.5" cy="17" r="2.2" fill="#ffe066" {...st} strokeWidth={1.2} /></>); break;
    case 'kucing': body = (<>
      <path d="M34 38q11-2 9-15" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" /><path d="M34 38q11-2 9-15" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="24" cy="33" rx="12" ry="9" fill={fill} {...st} /><path d="M15 15L14 4l9 6zM33 15l1-11-9 6z" fill={fill} {...st} />
      <circle cx="24" cy="21" r="10" fill={fill} {...st} /><circle cx="20" cy="20" r="1.7" fill={INK} /><circle cx="28" cy="20" r="1.7" fill={INK} />
      <path d="M23 24h2l-1 1.4zM18 25l-6-1M18 26.5l-6 2M30 25l6-1M30 26.5l6 2" fill="none" stroke={INK} strokeWidth="1" strokeLinecap="round" /></>); break;
    default: body = (<>
      <path d="M24 5l15 31H9z" fill={fill} {...st} /><path d="M15 24h18M12 30h24" stroke={INK} strokeWidth=".9" opacity=".5" />
      <path d="M8 36q16 9 32 0l-2-3q-14 6-28 0z" fill="#2e9e5b" {...st} /><path d="M24 5V1l5 1.5-5 1.5" fill="#e03131" {...st} strokeWidth={1} /><circle cx="19" cy="28" r="1.5" fill="#e03131" /><circle cx="28" cy="22" r="1.5" fill="#e03131" /></>);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs><radialGradient id={gid} cx=".3" cy=".25" r=".95"><stop offset="0" stopColor={lt} /><stop offset=".55" stopColor={color} /><stop offset="1" stopColor={dk} /></radialGradient></defs>
      <ellipse cx="24" cy="43" rx="15" ry="4" fill="rgba(0,0,0,.3)" />
      <ellipse cx="24" cy="40.5" rx="13" ry="4.2" fill={dk} stroke={INK} strokeWidth="1.4" />
      {body}
    </svg>
  );
}

export function HouseArt({ size = 16, x, y }: { size?: number; x?: number; y?: number }) {
  const inner = (<g><path d="M3 12L12 3l9 9v9H3z" fill="#3fa05f" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" /><path d="M1.5 12.5L12 2.5l10.5 10" fill="none" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><rect x="10" y="14" width="4.5" height="7" fill="#fff8e6" stroke={INK} strokeWidth="1.2" /></g>);
  return x === undefined ? <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{inner}</svg> : <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24">{inner}</svg>;
}
export function HotelArt({ size = 20, x, y }: { size?: number; x?: number; y?: number }) {
  const inner = (<g><rect x="3" y="6" width="18" height="16" fill="#e03131" stroke={INK} strokeWidth="1.6" /><rect x="1.5" y="3.5" width="21" height="4" fill="#a61e1e" stroke={INK} strokeWidth="1.4" />
    {[6, 11, 16].map((a) => [9, 14.5].map((b) => <rect key={`${a}${b}`} x={a} y={b} width="3" height="3" fill="#ffe066" stroke={INK} strokeWidth=".8" />))}<rect x="10" y="18" width="4" height="4" fill="#fff8e6" stroke={INK} strokeWidth=".8" /></g>);
  return x === undefined ? <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{inner}</svg> : <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24">{inner}</svg>;
}

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]], 2: [[27, 27], [73, 73]], 3: [[27, 27], [50, 50], [73, 73]], 4: [[27, 27], [73, 27], [27, 73], [73, 73]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]], 6: [[27, 25], [73, 25], [27, 50], [73, 50], [27, 75], [73, 75]],
};
export function DieFace({ v, size = 56 }: { v: number; size?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Dadu ${v}`}>
      <defs><linearGradient id={`d${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d9d3c4" /></linearGradient></defs>
      <rect x="5" y="5" width="90" height="90" rx="20" fill={`url(#d${id})`} stroke={INK} strokeWidth="6" />
      {(PIPS[v] ?? PIPS[1] as [number, number][]).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={v === 1 ? 11 : 8.5} fill={v === 1 ? '#d7263d' : INK} />)}
    </svg>
  );
}

/** Ikon petak & antarmuka (kotak 24). */
const ICONS: Record<string, string> = {
  go: 'M3 12h14M12 5l7 7-7 7',
  rail: 'M6 3h12a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM4 11h16M8 21l2-3M16 21l-2-3M8 15h.01M16 15h.01',
  bolt: 'M13 2L5 14h6l-1 8 9-12h-6z',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  tax: 'M7 3h10v18l-2-1.5-2 1.5-2-1.5L9 21l-2-1.5zM10 8h4M10 12h4',
  jail: 'M4 4h16v16H4zM9 4v16M15 4v16',
  park: 'M5 3h8a5 5 0 0 1 0 10H9v8M9 8h4',
  police: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6zM12 9l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z',
  chance: 'M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 18h.01M4 4l2 2M20 4l-2 2M3 12h2M19 12h2',
  chest: 'M4 10a8 8 0 0 1 16 0v9H4zM4 13h16M11 13v3h2v-3',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4',
  hammer: 'M14 4l6 6-3 3-6-6zM12 8L4 16l4 4 8-8M3 21l3-3',
  swap: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  flag: 'M5 21V4M5 4h12l-2 4 2 4H5',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
  check: 'M5 12l5 5 9-10', x: 'M6 6l12 12M18 6L6 18', plus: 'M12 5v14M5 12h14', zoom: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5M11 8v6M8 11h6',
  gavel: 'M13 3l5 5-3 3-5-5zM11 8L4 15l3 3 7-7M3 21h10',
};
export function MonoIcon({ name, size = 18, color, sw = 2 }: { name: string; size?: number; color?: string; sw?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name] ?? ICONS.coin} /></svg>;
}
/** Versi untuk dipakai langsung di dalam SVG papan. */
export function TileIcon({ name, x, y, size, color = INK }: { name: string; x: number; y: number; size: number; color?: string }) {
  return <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[name] ?? ICONS.coin} /></svg>;
}

/** Lembar uang kertas kecil. */
export function Banknote({ label, color = '#2e9e5b', w = 64 }: { label: string; color?: string; w?: number }) {
  return (
    <svg width={w} height={w * 0.5} viewBox="0 0 64 32" aria-hidden="true">
      <rect x="1.5" y="1.5" width="61" height="29" rx="4" fill={color} stroke={INK} strokeWidth="2" /><rect x="5" y="5" width="54" height="22" rx="2.5" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1" />
      <circle cx="32" cy="16" r="8" fill="#fff" fillOpacity=".25" stroke="#fff" strokeOpacity=".7" /><text x="32" y="19.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="inherit">{label}</text>
    </svg>
  );
}

/** Punggung tumpukan kartu Kejutan / Kas Warga. */
export function DeckArt({ deck, w = 56 }: { deck: 'chance' | 'chest'; w?: number }) {
  const c = deck === 'chance' ? '#f28c28' : '#2a9d8f';
  return (
    <svg width={w} height={w * 0.72} viewBox="0 0 64 46" aria-hidden="true">
      <rect x="6" y="5" width="54" height="38" rx="5" fill="#00000030" /><rect x="3" y="2" width="54" height="38" rx="5" fill={c} stroke={INK} strokeWidth="2" />
      <rect x="7" y="6" width="46" height="30" rx="3" fill="none" stroke="#fff" strokeOpacity=".7" strokeDasharray="3 2" />
      <svg x="20" y="9" width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[deck]} /></svg>
    </svg>
  );
}
