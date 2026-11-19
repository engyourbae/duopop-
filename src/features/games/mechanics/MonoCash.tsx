import { useEffect, useRef, useState } from 'react';
import { CASH_MAX, CASH_MIN, money } from '../engines/monopolyData';

/** Pilihan uang awal & batas putaran Monopoli, terpisah dari varian. Disimpan di id varian sebagai "<varian>@<juta>:<putaran>" (mis. "bursa@2000:50"); tanpa "@" = bawaan mode; tanpa ":" = putaran bawaan mode; ":0" = tanpa batas (sampai semua bangkrut). */
export const CASH_OPTS = [0, 500, 1000, 1500, 2000, 3000, 5000]; // dalam juta; 0 = bawaan mode
export const ROUND_OPTS: (number | null)[] = [null, 30, 50, 100, 0]; // null = bawaan mode; 0 = tanpa batas
/** Satuan untuk isian bebas. mult = berapa juta dalam satu satuan (satuan dasar game = juta). */
export const UNITS = [
  { id: 'jt', short: 'JT', name: 'juta', mult: 1 },
  { id: 'm', short: 'M', name: 'miliar', mult: 1_000 },
  { id: 't', short: 'T', name: 'triliun', mult: 1_000_000 },
  { id: 'kd', short: 'Kd', name: 'kuadriliun', mult: 1_000_000_000 },
] as const;
type UnitId = (typeof UNITS)[number]['id'];
const multOf = (u: UnitId) => UNITS.find((x) => x.id === u)?.mult ?? 1;

export const baseOf = (variant: string) => variant.split('@')[0] as string;
export const cashOf = (variant: string) => { const c = Number((variant.split('@')[1] ?? '').split(':')[0]); return Number.isFinite(c) && c > 0 ? c : 0; };
export const roundsOf = (variant: string): number | null => { const r = variant.split('@')[1]?.split(':')[1]; if (r === undefined || r === '') return null; const n = Number(r); return Number.isInteger(n) && n >= 0 ? n : null; };
const build = (base: string, cash: number, rounds: number | null) => (cash > 0 || rounds !== null ? `${base}@${cash > 0 ? cash : 0}${rounds !== null ? `:${rounds}` : ''}` : base);
export const withCash = (variant: string, cash: number) => build(baseOf(variant), cash, roundsOf(variant));
export const withRounds = (variant: string, rounds: number | null) => build(baseOf(variant), cashOf(variant), rounds);
/** Ganti varian/mode dengan mempertahankan pilihan uang awal dan putaran. */
export const rebase = (id: string, variant: string) => build(id, cashOf(variant), roundsOf(variant));

/** Membaca isian angka. Koma atau titik = desimal ("2,5"); pola ribuan Indonesia ("1.500") dibaca sebagai 1500. null = tidak valid. */
export function parseAmount(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, '');
  if (!t) return null;
  const x = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(',', '.');
  if (!/^(\d*\.\d+|\d+\.?)$/.test(x)) return null;
  const n = Number(x);
  return Number.isFinite(n) && n > 0 ? n : null;
}
/** Angka + satuan menjadi juta rupiah (bulat). */
export const toJuta = (amount: number, unit: UnitId) => Math.round(amount * multOf(unit));
/** Juta rupiah menjadi angka + satuan terbesar yang pas (1500 -> "1,5" M). */
export function fromJuta(juta: number): { text: string; unit: UnitId } {
  const u = [...UNITS].reverse().find((x) => juta >= x.mult) ?? UNITS[0];
  return { text: String(Number((juta / u.mult).toFixed(6))).replace('.', ','), unit: u.id };
}

const label = (n: number) => (n === 0 ? 'Bawaan mode' : money(n));
const rLabel = (n: number | null) => (n === null ? 'Bawaan mode' : n === 0 ? 'Tanpa batas' : `${n}x putaran`);
export function MonoCash({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cur = cashOf(value), rc = roundsOf(value);
  const start = cur > 0 ? fromJuta(cur) : { text: '', unit: 'm' as UnitId };
  const [txt, setTxt] = useState(start.text), [unit, setUnit] = useState<UnitId>(start.unit);
  const last = useRef(cur); // nilai terakhir yang dikirim dari isian ini; beda = berubah dari luar (chip/ganti mode)
  useEffect(() => {
    if (cur === last.current) return;
    last.current = cur;
    if (cur > 0) { const f = fromJuta(cur); setTxt(f.text); setUnit(f.unit); } else setTxt('');
  }, [cur]);
  const amount = parseAmount(txt), juta = amount === null ? null : toJuta(amount, unit);
  const inRange = juta !== null && juta >= CASH_MIN && juta <= CASH_MAX;
  const edit = (t: string, u: UnitId) => {
    setTxt(t); setUnit(u);
    const a = parseAmount(t), j = a === null ? null : toJuta(a, u);
    if (j !== null && j >= CASH_MIN && j <= CASH_MAX) { last.current = j; onChange(withCash(value, j)); }
  };
  return (
    <div className="gap">
      <div className="row wrap gap"><span className="small">Uang awal:</span>
        {CASH_OPTS.map((c) => <button key={c} type="button" className={`chip ${cur === c ? 'on' : ''}`} onClick={() => onChange(withCash(value, c))}>{label(c)}</button>)}
      </div>
      <div className="row wrap gap"><span className="small">Atur sendiri:</span>
        <input className="input" style={{ width: 130, flex: 'none' }} inputMode="decimal" autoComplete="off" placeholder="mis. 2,5" aria-label="Jumlah uang awal" value={txt} onChange={(e) => edit(e.target.value, unit)} />
        {UNITS.map((u) => <button key={u.id} type="button" className={`chip ${unit === u.id ? 'on' : ''}`} title={u.name} aria-label={u.name} onClick={() => edit(txt, u.id)}>{u.short}</button>)}
      </div>
      {txt.trim() !== '' && (inRange
        ? <p className="small muted" style={{ margin: '6px 0 0' }}>Uang awal tiap pemain: <b>{money(juta as number)}</b></p>
        : <p className="field-err">{amount === null ? 'Isi angka yang benar, mis. 2,5 lalu pilih satuannya.' : `Jumlah harus antara ${money(CASH_MIN)} dan ${money(CASH_MAX)}.`}</p>)}
      <p className="small muted" style={{ margin: '6px 0 0' }}>JT = juta, M = miliar, T = triliun, Kd = kuadriliun. Pakai koma untuk desimal (2,5 M = Rp2,5 miliar).</p>
      <div className="row wrap gap"><span className="small">Batas putaran:</span>
        {ROUND_OPTS.map((r) => <button key={String(r)} type="button" className={`chip ${rc === r ? 'on' : ''}`} onClick={() => onChange(withRounds(value, r))}>{rLabel(r)}</button>)}
      </div>
      {rc === 0 && <p className="small muted" style={{ margin: 0 }}>Tanpa batas: main sampai tinggal satu pemain (semua lawan bangkrut). Tombol "Akhiri game" muncul mulai putaran 40.</p>}
    </div>
  );
}
