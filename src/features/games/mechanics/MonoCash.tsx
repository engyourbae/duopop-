/** Pilihan uang awal & batas putaran Monopoli, terpisah dari varian. Disimpan di id varian sebagai "<varian>@<juta>:<putaran>" (mis. "bursa@2000:50"); tanpa "@" = bawaan mode; tanpa ":" = putaran bawaan mode; ":0" = tanpa batas (sampai semua bangkrut). */
export const CASH_OPTS = [0, 500, 1000, 1500, 2000, 3000, 5000]; // dalam juta; 0 = bawaan mode
export const ROUND_OPTS: (number | null)[] = [null, 30, 50, 100, 0]; // null = bawaan mode; 0 = tanpa batas
export const baseOf = (variant: string) => variant.split('@')[0] as string;
export const cashOf = (variant: string) => { const c = Number((variant.split('@')[1] ?? '').split(':')[0]); return Number.isFinite(c) && c > 0 ? c : 0; };
export const roundsOf = (variant: string): number | null => { const r = variant.split('@')[1]?.split(':')[1]; if (r === undefined || r === '') return null; const n = Number(r); return Number.isInteger(n) && n >= 0 ? n : null; };
const build = (base: string, cash: number, rounds: number | null) => (cash > 0 || rounds !== null ? `${base}@${cash > 0 ? cash : 0}${rounds !== null ? `:${rounds}` : ''}` : base);
export const withCash = (variant: string, cash: number) => build(baseOf(variant), cash, roundsOf(variant));
export const withRounds = (variant: string, rounds: number | null) => build(baseOf(variant), cashOf(variant), rounds);
/** Ganti varian/mode dengan mempertahankan pilihan uang awal dan putaran. */
export const rebase = (id: string, variant: string) => build(id, cashOf(variant), roundsOf(variant));
const label = (n: number) => (n === 0 ? 'Bawaan mode' : n >= 1000 ? `Rp${String(n / 1000).replace('.', ',')} M` : `Rp${n}jt`);
const rLabel = (n: number | null) => (n === null ? 'Bawaan mode' : n === 0 ? 'Tanpa batas' : `${n}x putaran`);
export function MonoCash({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cur = cashOf(value), rc = roundsOf(value);
  return (
    <div className="gap">
      <div className="row wrap gap"><span className="small">Uang awal:</span>
        {CASH_OPTS.map((c) => <button key={c} type="button" className={`chip ${cur === c ? 'on' : ''}`} onClick={() => onChange(withCash(value, c))}>{label(c)}</button>)}
      </div>
      <div className="row wrap gap"><span className="small">Batas putaran:</span>
        {ROUND_OPTS.map((r) => <button key={String(r)} type="button" className={`chip ${rc === r ? 'on' : ''}`} onClick={() => onChange(withRounds(value, r))}>{rLabel(r)}</button>)}
      </div>
      {rc === 0 && <p className="small muted" style={{ margin: 0 }}>Tanpa batas: main sampai tinggal satu pemain (semua lawan bangkrut). Tombol "Akhiri game" muncul mulai putaran 40.</p>}
    </div>
  );
}
