import fs from 'node:fs';
import { loadedPacks, initPacks } from '../data/questions/packs';
import { allQuestions } from '../data/questions';
import { validateQuestions } from '../data/questions/validate';
import { QUIZ_VARIANTS } from '../features/games/registry';

beforeAll(() => {
  const w = window as unknown as { DUOPOP_PACKS?: unknown };
  w.DUOPOP_PACKS = [];
  for (const f of ['upgrade-1', 'upgrade-2']) new Function('window', fs.readFileSync(`public/packs/${f}.js`, 'utf8'))(w);
  initPacks(); // meniru urutan: <script> paket dulu, lalu aplikasi
});
const bank = () => allQuestions.filter((q) => q.id.startsWith('pk-upgrade-2-'));
describe('paket upgrade-2 (bank soal 3.150)', () => {
  it('terdaftar dan membawa 3.150 soal tertulis', () => {
    expect(loadedPacks.find((p) => p.id === 'upgrade-2')?.questions).toBe(3150);
    expect(bank().length).toBe(3150);
  });
  it('21 kategori, masing-masing tepat 150 soal', () => {
    const n = new Map<string, number>();
    for (const q of bank()) n.set(q.category, (n.get(q.category) ?? 0) + 1);
    expect(n.size).toBe(21);
    for (const v of n.values()) expect(v).toBe(150);
  });
  it('seluruh soal valid: tanpa pertanyaan ganda, opsi ganda, atau penjelasan kosong', () => {
    expect(validateQuestions(allQuestions.filter((q) => q.id.startsWith('pk-')))).toEqual([]);
  });
  it('setiap soal memiliki 4 opsi unik dengan kunci di indeks 0 dan ketiga tingkat kesulitan terwakili', () => {
    for (const q of bank()) { expect(q.options.length).toBe(4); expect(q.correctAnswer).toBe(0); }
    for (const d of ['mudah', 'sedang', 'sulit']) expect(bank().some((q) => q.difficulty === d)).toBe(true);
  });
  it('varian topik baru terdaftar di Duel Pengetahuan', () => {
    for (const id of ['hitung-bank', 'ibukota-bank', 'provinsi-bank', 'tabel-periodik']) expect(QUIZ_VARIANTS.some((v) => v.id === id)).toBe(true);
  });
});
