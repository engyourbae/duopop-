/** Pemilih aturan UNO Custom. Nilai = id varian "custom-<huruf>" (s tumpuk, 7, 0, j jump-in, d ambil sampai cocok, b mulai 10 kartu). */
const OPTS: [string, string, string][] = [
  ['s', 'Tumpuk hukuman', 'Hukuman +2/+4 bisa ditumpuk kartu sejenis. Mati = pemain langsung mengambil.'],
  ['7', '7 tukar tangan', 'Memainkan angka 7: pilih pemain lalu tukar seluruh kartu.'],
  ['0', '0 putar tangan', 'Memainkan angka 0: semua tangan berpindah searah putaran.'],
  ['j', 'Jump-in', 'Online: boleh memainkan kartu yang persis sama (warna & angka) di luar giliran.'],
  ['d', 'Ambil sampai cocok', 'Tidak ada kartu cocok? Ambil terus sampai dapat yang bisa dimainkan.'],
  ['b', 'Mulai 10 kartu', 'Tiap pemain mendapat 10 kartu, bukan 7.'],
];
export const isUnoCustom = (v: string) => v === 'custom' || v.startsWith('custom-');
export function UnoRules({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const flags = value.startsWith('custom-') ? value.slice(7) : '';
  const toggle = (k: string) => onChange(`custom-${OPTS.map(([x]) => x).filter((x) => (x === k ? !flags.includes(x) : flags.includes(x))).join('')}`);
  return (
    <div className="gap">
      <span className="small">Aturan Custom:</span>
      <div className="row wrap">{OPTS.map(([k, t]) => <button key={k} type="button" className={`chip ${flags.includes(k) ? 'on' : ''}`} onClick={() => toggle(k)}>{t}</button>)}</div>
      <p className="small muted">{OPTS.filter(([k]) => flags.includes(k)).map(([, t, d]) => `${t}: ${d}`).join(' ') || 'Tanpa aturan tambahan: UNO dasar.'}</p>
    </div>
  );
}
