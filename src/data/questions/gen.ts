import { rng, seedFrom, shuffle } from '../../utils/rng';

/** Generator soal tak terbatas dari dataset kecil atau aritmetika. Mengembalikan item siap-main. */
export interface GenItem { id: string; prompt: string; options: string[]; correct: number; explanation: string }

export const WORLD_CAPITALS: [string, string][] = [
  ['Indonesia', 'Jakarta'], ['Malaysia', 'Kuala Lumpur'], ['Singapura', 'Singapura'], ['Thailand', 'Bangkok'], ['Vietnam', 'Hanoi'], ['Filipina', 'Manila'], ['Jepang', 'Tokyo'],
  ['Korea Selatan', 'Seoul'], ['Tiongkok', 'Beijing'], ['India', 'New Delhi'], ['Australia', 'Canberra'], ['Selandia Baru', 'Wellington'], ['Inggris', 'London'], ['Prancis', 'Paris'],
  ['Jerman', 'Berlin'], ['Italia', 'Roma'], ['Spanyol', 'Madrid'], ['Portugal', 'Lisboa'], ['Belanda', 'Amsterdam'], ['Brasil', 'Brasília'], ['Argentina', 'Buenos Aires'],
  ['Meksiko', 'Meksiko City'], ['Kanada', 'Ottawa'], ['Amerika Serikat', 'Washington, D.C.'], ['Mesir', 'Kairo'], ['Arab Saudi', 'Riyadh'], ['Turki', 'Ankara'], ['Rusia', 'Moskow'],
  ['Swiss', 'Bern'], ['Swedia', 'Stockholm'], ['Norwegia', 'Oslo'], ['Kenya', 'Nairobi'], ['Nigeria', 'Abuja'], ['Pakistan', 'Islamabad'], ['Bangladesh', 'Dhaka'],
  ['Timor Leste', 'Dili'], ['Brunei', 'Bandar Seri Begawan'], ['Chile', 'Santiago'], ['Kolombia', 'Bogotá'], ['Peru', 'Lima'], ['Kuba', 'Havana'], ['Yunani', 'Athena'],
  ['Polandia', 'Warsawa'], ['Austria', 'Wina'], ['Belgia', 'Brussel'], ['Irlandia', 'Dublin'], ['Finlandia', 'Helsinki'], ['Denmark', 'Kopenhagen'], ['Ukraina', 'Kyiv'],
  ['Iran', 'Teheran'], ['Irak', 'Baghdad'], ['Yordania', 'Amman'], ['Maroko', 'Rabat'], ['Etiopia', 'Addis Ababa'], ['Ghana', 'Accra'], ['Kamboja', 'Phnom Penh'],
  ['Laos', 'Vientiane'], ['Myanmar', 'Naypyidaw'], ['Nepal', 'Kathmandu'], ['Sri Lanka', 'Sri Jayawardenepura Kotte'], ['Mongolia', 'Ulaanbaatar'],
];
export const PROVINCES: [string, string][] = [
  ['Aceh', 'Banda Aceh'], ['Sumatera Utara', 'Medan'], ['Sumatera Barat', 'Padang'], ['Riau', 'Pekanbaru'], ['Kepulauan Riau', 'Tanjung Pinang'], ['Jambi', 'Jambi'],
  ['Sumatera Selatan', 'Palembang'], ['Kepulauan Bangka Belitung', 'Pangkal Pinang'], ['Bengkulu', 'Bengkulu'], ['Lampung', 'Bandar Lampung'], ['DKI Jakarta', 'Jakarta'],
  ['Banten', 'Serang'], ['Jawa Barat', 'Bandung'], ['Jawa Tengah', 'Semarang'], ['DI Yogyakarta', 'Yogyakarta'], ['Jawa Timur', 'Surabaya'], ['Bali', 'Denpasar'],
  ['Nusa Tenggara Barat', 'Mataram'], ['Nusa Tenggara Timur', 'Kupang'], ['Kalimantan Barat', 'Pontianak'], ['Kalimantan Tengah', 'Palangka Raya'], ['Kalimantan Selatan', 'Banjarmasin'],
  ['Kalimantan Timur', 'Samarinda'], ['Kalimantan Utara', 'Tanjung Selor'], ['Sulawesi Utara', 'Manado'], ['Gorontalo', 'Gorontalo'], ['Sulawesi Tengah', 'Palu'],
  ['Sulawesi Barat', 'Mamuju'], ['Sulawesi Selatan', 'Makassar'], ['Sulawesi Tenggara', 'Kendari'], ['Maluku', 'Ambon'], ['Maluku Utara', 'Sofifi'], ['Papua', 'Jayapura'],
  ['Papua Barat', 'Manokwari'], ['Papua Barat Daya', 'Sorong'], ['Papua Selatan', 'Merauke'], ['Papua Tengah', 'Nabire'], ['Papua Pegunungan', 'Wamena'],
];
export const ELEMENTS: [string, string][] = [
  ['H', 'Hidrogen'], ['He', 'Helium'], ['Li', 'Litium'], ['C', 'Karbon'], ['N', 'Nitrogen'], ['O', 'Oksigen'], ['F', 'Fluor'], ['Ne', 'Neon'], ['Na', 'Natrium'], ['Mg', 'Magnesium'],
  ['Al', 'Aluminium'], ['Si', 'Silikon'], ['P', 'Fosfor'], ['S', 'Belerang'], ['Cl', 'Klor'], ['Ar', 'Argon'], ['K', 'Kalium'], ['Ca', 'Kalsium'], ['Fe', 'Besi'], ['Cu', 'Tembaga'],
  ['Zn', 'Seng'], ['Ag', 'Perak'], ['Sn', 'Timah'], ['Au', 'Emas'], ['Hg', 'Raksa'], ['Pb', 'Timbal'], ['U', 'Uranium'], ['I', 'Iodium'], ['Br', 'Brom'], ['Ni', 'Nikel'],
];
/** Pasangan dua arah dari sebuah dataset. */
function pairQuestions(kind: string, data: [string, string][], qa: (a: string) => string, qb: (b: string) => string, expl: (a: string, b: string) => string, r: () => number, count: number): GenItem[] {
  const list: GenItem[] = [];
  const idx = shuffle(data.map((_, i) => i), r);
  for (let n = 0; n < count; n++) {
    const i = idx[n % idx.length] as number, [a, b] = data[i] as [string, string];
    const forward = (Math.floor(n / idx.length) + n) % 2 === 0;
    const pool = data.filter((_, k) => k !== i);
    const wrong = shuffle(pool, r).slice(0, 3).map((x) => (forward ? x[1] : x[0]));
    const correct = forward ? b : a;
    const options = shuffle([correct, ...wrong], r);
    list.push({ id: `gen-${kind}-${i}-${forward ? 'f' : 'b'}`, prompt: forward ? qa(a) : qb(b), options, correct: options.indexOf(correct), explanation: expl(a, b) });
  }
  return list;
}
const near = (v: number, r: () => number): number[] => {
  const s = new Set<number>();
  const steps = [1, 2, 10, -1, -2, -10, 5, -5, 11, -11];
  for (const st of shuffle(steps, r)) { const c = v + st * (Math.abs(v) > 40 ? 2 : 1); if (c !== v) s.add(c); if (s.size === 3) break; }
  let k = 3; while (s.size < 3) s.add(v + k++);
  return [...s];
};
function mathItem(level: number, n: number, r: () => number): GenItem {
  const L = Math.max(1, Math.min(10, level));
  const rnd = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const type = rnd(0, L < 3 ? 2 : L < 6 ? 5 : 7);
  let prompt: string, ans: number, expl: string;
  const hi = 10 ** Math.min(4, 1 + Math.ceil(L / 3));
  if (type === 0) { const a = rnd(2, hi), b = rnd(2, hi); prompt = `${a} + ${b} = …`; ans = a + b; expl = `${a} ditambah ${b} sama dengan ${ans}.`; }
  else if (type === 1) { const a = rnd(hi / 2, hi), b = rnd(2, hi / 2); prompt = `${a} − ${b} = …`; ans = a - b; expl = `${a} dikurangi ${b} sama dengan ${ans}.`; }
  else if (type === 2) { const a = rnd(2, 6 + L * 2), b = rnd(2, 9 + L); prompt = `${a} × ${b} = …`; ans = a * b; expl = `${a} dikali ${b} sama dengan ${ans}.`; }
  else if (type === 3) { const b = rnd(2, 9), q = rnd(2, 10 + L * 3); prompt = `${b * q} ÷ ${b} = …`; ans = q; expl = `${b * q} dibagi ${b} sama dengan ${q}.`; }
  else if (type === 4) { const p = [10, 20, 25, 50][rnd(0, 3)] as number, base = rnd(2, 40) * 20; prompt = `${p}% dari ${base} = …`; ans = (p * base) / 100; expl = `${p}/100 × ${base} = ${ans}.`; }
  else if (type === 5) { const a = rnd(1, 20), d = rnd(2, 3 + L), len = 4; const seq = Array.from({ length: len }, (_, i) => a + d * i); prompt = `Deret: ${seq.join(', ')}, …`; ans = a + d * len; expl = `Beda tiap suku ${d}, suku berikutnya ${ans}.`; }
  else if (type === 6) { const b = rnd(2, 12 + L), e = rnd(2, 3); prompt = `${b}${e === 2 ? '²' : '³'} = …`; ans = b ** e; expl = `${b} dipangkatkan ${e} sama dengan ${ans}.`; }
  else { const a = rnd(2, 6), start = rnd(1, 4); const seq = Array.from({ length: 4 }, (_, i) => start * a ** i); prompt = `Deret: ${seq.join(', ')}, …`; ans = start * a ** 4; expl = `Setiap suku dikali ${a}; berikutnya ${ans}.`; }
  const options = shuffle([ans, ...near(ans, r)], r);
  return { id: `gen-math-${n}-${prompt}`, prompt, options: options.map(String), correct: options.indexOf(ans), explanation: expl };
}
/** Titik masuk: kind ∈ capital | provinsi | unsur | math. */
export function genItems(kind: string, count: number, seed: string, level = 1): GenItem[] {
  const r = rng(seedFrom(`${kind}:${seed}`));
  switch (kind) {
    case 'capital': return pairQuestions('capital', WORLD_CAPITALS, (a) => `Ibu kota ${a} adalah…`, (b) => `${b} adalah ibu kota negara…`, (a, b) => `Ibu kota ${a} adalah ${b}.`, r, count);
    case 'provinsi': return pairQuestions('provinsi', PROVINCES, (a) => `Ibu kota Provinsi ${a} adalah…`, (b) => `${b} adalah ibu kota Provinsi…`, (a, b) => `${b} adalah ibu kota Provinsi ${a}.`, r, count);
    case 'unsur': return pairQuestions('unsur', ELEMENTS, (a) => `Lambang unsur “${a}” adalah unsur…`, (b) => `Lambang kimia untuk ${b} adalah…`, (a, b) => `${a} adalah lambang unsur ${b}.`, r, count);
    default: return Array.from({ length: count }, (_, n) => mathItem(level, n, r));
  }
}
export const GEN_KINDS = ['capital', 'provinsi', 'unsur', 'math'] as const;
