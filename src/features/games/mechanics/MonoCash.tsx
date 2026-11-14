/** Pilihan uang awal Monopoli, terpisah dari varian. Disimpan di id varian sebagai "<varian>@<juta>" (mis. "bursa@2000"); tanpa "@" = uang bawaan mode. */
export const CASH_OPTS = [0, 500, 1000, 1500, 2000, 3000, 5000]; // dalam juta; 0 = bawaan mode
export const baseOf = (variant: string) => variant.split('@')[0] as string;
export const cashOf = (variant: string) => { const c = Number(variant.split('@')[1]); return Number.isFinite(c) && c > 0 ? c : 0; };
export const withCash = (variant: string, cash: number) => `${baseOf(variant)}${cash > 0 ? `@${cash}` : ''}`;
const label = (n: number) => (n === 0 ? 'Bawaan mode' : n >= 1000 ? `Rp${String(n / 1000).replace('.', ',')} M` : `Rp${n}jt`);
export function MonoCash({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cur = cashOf(value);
  return (
    <div className="gap">
      <div className="row wrap gap"><span className="small">Uang awal:</span>
        {CASH_OPTS.map((c) => <button key={c} type="button" className={`chip ${cur === c ? 'on' : ''}`} onClick={() => onChange(withCash(value, c))}>{label(c)}</button>)}
      </div>
    </div>
  );
}
