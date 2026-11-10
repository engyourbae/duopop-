import { useId, type CSSProperties } from 'react';

/**
 * Tangan suit buatan sendiri (SVG): kulit berwarna dengan bayangan, buku jari, kuku, dan lengan baju.
 * kind: 0 batu (kepalan), 1 gunting (dua jari), 2 kertas (telapak terbuka), -1 belum dipilih.
 */
const INK = '#4a2a1a', LINE = 3;
export function HandArt({ kind, px, className, style }: { kind: number; px?: number; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, ''), sk = `sk${id}`, sh = `sh${id}`, sl = `sl${id}`;
  const w = px ? `${px}px` : '1em', h = px ? `${Math.round(px * 1.17)}px` : '1.17em';
  const o = { stroke: INK, strokeWidth: LINE, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const fine = { fill: 'none', stroke: INK, strokeWidth: 2, strokeLinecap: 'round' as const, opacity: 0.55 };
  const skin = `url(#${sk})`, shade = `url(#${sh})`;
  const nail = (x: number, y: number, ww = 10, hh = 11) => <rect x={x} y={y} width={ww} height={hh} rx={ww / 2.2} fill="#ffe9e0" stroke={INK} strokeWidth="1.6" opacity=".95" />;
  const finger = (x: number, top: number, bottom: number, ww: number, rot: number, cx: number, creases: number[]) => (
    <g transform={`rotate(${rot} ${cx} ${bottom})`}>
      <rect x={x} y={top} width={ww} height={bottom - top} rx={ww / 2} fill={skin} {...o} />
      <rect x={x + ww * 0.62} y={top + 4} width={ww * 0.3} height={bottom - top - 10} rx={ww * 0.15} fill={shade} opacity=".35" />
      {nail(x + ww / 2 - 5, top + 3, 10, 11)}
      {creases.map((c) => <path key={c} d={`M${x + 3} ${top + c}h${ww - 6}`} {...fine} />)}
    </g>
  );
  let body;
  if (kind === 0) body = (<>
    {/* kepalan: empat jari menekuk, ibu jari melintang di depan */}
    <path d="M28 102C23 76 25 56 34 48c8-6 44-6 52 0 9 8 11 28 6 54-2 12-12 18-32 18s-28-6-32-18z" fill={skin} {...o} />
    {[29, 44.5, 60, 75.5].map((x, k) => <g key={k}><rect x={x} y={40} width={15.5} height={48} rx={7.7} fill={skin} {...o} /><rect x={x + 9} y={46} width={4} height={34} rx={2} fill={shade} opacity=".3" /><path d={`M${x + 2.5} 68h10.5`} {...fine} /><ellipse cx={x + 7.7} cy={50} rx={4} ry={2.6} fill="#fff" opacity=".35" /></g>)}
    <path d="M28 90c0-12 22-14 44-6 12 4 16 14 8 22-5 5-20 7-34 5-12-2-18-8-18-21z" fill={skin} {...o} />
    <path d="M30 98c4 5 12 8 24 9" {...fine} /><ellipse cx="38" cy="95" rx="5.5" ry="4" fill="#ffe9e0" stroke={INK} strokeWidth="1.6" transform="rotate(-18 38 95)" />
  </>);
  else if (kind === 1) body = (<>
    {finger(33, 4, 74, 17, -13, 41, [26, 44])}
    {finger(50, 0, 74, 17, 11, 58, [24, 43])}
    <path d="M28 104C24 86 28 70 36 66h52c6 6 6 24 2 38-3 11-12 16-30 16s-26-5-32-16z" fill={skin} {...o} />
    {[62, 77].map((x) => <g key={x}><rect x={x} y={64} width={14.5} height={30} rx={7.2} fill={skin} {...o} /><path d={`M${x + 2.5} 80h9.5`} {...fine} /></g>)}
    <path d="M90 104c3-10-6-18-20-16-9 1-12 10-6 15 6 6 22 8 26 1z" fill={skin} {...o} /><ellipse cx="73" cy="95" rx="5" ry="3.8" fill="#ffe9e0" stroke={INK} strokeWidth="1.6" transform="rotate(20 73 95)" />
  </>);
  else if (kind === 2) body = (<g transform="translate(12 0)">
    <g transform="rotate(-42 34 104)"><rect x="20" y="62" width="17" height="52" rx="8.5" fill={skin} {...o} />{nail(23.5, 65)}<path d="M23 90h11" {...fine} /></g>
    {finger(30, 8, 76, 15, -7, 37, [26, 46])}
    {finger(46, 0, 76, 15.5, -2, 53, [26, 46])}
    {finger(62.5, 5, 76, 15, 3, 70, [26, 46])}
    {finger(78, 20, 78, 13.5, 9, 85, [22, 40])}
    <path d="M28 104C24 88 27 76 32 70h58c5 8 5 20 2 34-3 11-12 16-32 16s-26-5-30-16z" fill={skin} {...o} />
    <path d="M40 100c8 6 22 6 34-1M48 86c8 3 18 3 26-1" {...fine} />
  </g>);
  else return (
    <svg className={className} style={style} width={w} height={h} viewBox="0 0 120 140" role="img" aria-label="Belum memilih">
      <circle cx="60" cy="62" r="46" fill="#fff8e6" stroke={INK} strokeWidth="4" strokeDasharray="10 8" /><text x="60" y="84" textAnchor="middle" fontSize="64" fontWeight="900" fill={INK}>?</text>
    </svg>
  );
  return (
    <svg className={className} style={style} width={w} height={h} viewBox="0 0 120 140" role="img" aria-label={['Batu', 'Gunting', 'Kertas'][kind]}>
      <defs>
        <linearGradient id={sk} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe3c8" /><stop offset=".55" stopColor="#f7bf93" /><stop offset="1" stopColor="#e2a073" /></linearGradient>
        <linearGradient id={sh} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#b86a3c" stopOpacity="0" /><stop offset="1" stopColor="#8e4a24" /></linearGradient>
        <linearGradient id={sl} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b63ff" /><stop offset="1" stopColor="#1f3ad1" /></linearGradient>
      </defs>
      <path d="M38 112h44l2 22H36z" fill={skin} {...o} />
      {body}
      <path d="M26 124h68l5 16H21z" fill={`url(#${sl})`} {...o} /><path d="M24 130h72" stroke="#fff" strokeWidth="2.5" opacity=".7" />
    </svg>
  );
}
