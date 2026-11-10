import { useId, type CSSProperties } from 'react';

/**
 * Tangan suit buatan sendiri (SVG), gaya ilustrasi datar: kulit, garis tepi, sedikit bayangan, lengan baju.
 * kind: 0 batu (kepalan), 1 gunting (dua jari), 2 kertas (telapak terbuka), -1 belum dipilih.
 */
const INK = '#5a3420';
export function HandArt({ kind, px, className, style }: { kind: number; px?: number; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, ''), sk = `sk${id}`;
  const w = px ? `${px}px` : '1em', h = px ? `${Math.round(px * 1.17)}px` : '1.17em';
  const o = { stroke: INK, strokeWidth: 3.2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const fine = { fill: 'none', stroke: INK, strokeWidth: 2.2, strokeLinecap: 'round' as const, opacity: 0.5 };
  const skin = `url(#${sk})`, SH = '#d98d5f';
  // jari lurus: kapsul dengan sedikit bayangan di sisi kanan
  const finger = (x: number, top: number, bottom: number, ww: number, rot: number) => (
    <g transform={`rotate(${rot} ${x + ww / 2} ${bottom})`}>
      <rect x={x} y={top} width={ww} height={bottom - top} rx={ww / 2} fill={skin} {...o} />
      <path d={`M${x + ww - 4.5} ${top + ww / 2}v${bottom - top - ww - 6}`} stroke={SH} strokeWidth="3" strokeLinecap="round" opacity=".45" />
    </g>
  );
  let body;
  if (kind === 0) body = (<>
    {/* kepalan: badan, empat ujung jari terlipat, ibu jari melintang di depan */}
    <path d="M24 66C24 44 34 36 60 36s36 8 36 30v26c0 16-12 24-36 24S24 108 24 92z" fill={skin} {...o} />
    {[0, 1, 2, 3].map((k) => <rect key={k} x={27 + k * 17.5} y={52} width={16.5} height={32} rx={8} fill={skin} {...o} />)}
    {[0, 1, 2, 3].map((k) => <path key={k} d={`M${31 + k * 17.5} 46v-4`} {...fine} opacity={0} />)}
    <path d="M24 98c0-12 10-18 26-18h26c12 0 18 6 18 14s-6 14-18 14H46c-14 0-22-3-22-10z" fill={skin} {...o} />
    <path d="M36 92c6-3 14-3 22-1" {...fine} />
  </>);
  else if (kind === 1) body = (<>
    {/* gunting: telunjuk & jari tengah membentuk V, jari manis & kelingking terlipat */}
    {finger(33, 12, 78, 18, -11)}
    {finger(54, 6, 78, 18, 9)}
    <path d="M26 104c-2-16 0-28 8-36h50c8 8 12 20 10 36-2 12-12 18-34 18s-32-6-34-18z" fill={skin} {...o} />
    <rect x="61" y="64" width="17" height="32" rx="8.5" fill={skin} {...o} /><rect x="77" y="68" width="16" height="30" rx="8" fill={skin} {...o} />
    <path d="M30 102c0-9 7-14 17-13l24 3c8 1 9 11 1 14l-22 5c-12 2-20-1-20-9z" fill={skin} {...o} transform="rotate(-10 56 100)" />
  </>);
  else if (kind === 2) body = (<>
    {/* kertas: telapak terbuka, empat jari, ibu jari keluar ke kiri */}
    <g transform="rotate(-48 36 104)"><rect x="22" y="70" width="19" height="42" rx="9.5" fill={skin} {...o} /></g>
    {finger(30, 22, 78, 15.5, -6)}
    {finger(46, 10, 78, 16, -2)}
    {finger(62.5, 14, 78, 15.5, 2)}
    {finger(78, 30, 80, 14, 7)}
    <path d="M28 104c-2-12-1-24 4-34h60c5 10 6 22 4 34-2 12-12 18-34 18s-32-6-34-18z" fill={skin} {...o} />
    <path d="M40 98c8 6 24 6 36 0" {...fine} />
  </>);
  else return (
    <svg className={className} style={style} width={w} height={h} viewBox="0 0 120 140" role="img" aria-label="Belum memilih">
      <circle cx="60" cy="66" r="44" fill="#fff8e6" stroke={INK} strokeWidth="4" strokeDasharray="10 8" /><text x="60" y="88" textAnchor="middle" fontSize="62" fontWeight="900" fill={INK}>?</text>
    </svg>
  );
  return (
    <svg className={className} style={style} width={w} height={h} viewBox="0 0 120 140" role="img" aria-label={['Batu', 'Gunting', 'Kertas'][kind]}>
      <defs><linearGradient id={sk} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fbd7b3" /><stop offset="1" stopColor="#f0b588" /></linearGradient></defs>
      <path d="M32 108h56l2 22H30z" fill={skin} {...o} />
      {body}
      <path d="M22 124h76l6 16H16z" fill="#2f55f0" {...o} /><path d="M20 131h80" stroke="#fff" strokeWidth="2.5" opacity=".6" />
    </svg>
  );
}
