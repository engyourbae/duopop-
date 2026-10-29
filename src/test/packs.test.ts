import fs from 'node:fs';
import { datasets, fromDatasets, loadedPacks, registerPack, initPacks, type Pack } from '../data/questions/packs';
import { allQuestions, mythQuestions } from '../data/questions';
import { validateQuestions } from '../data/questions/validate';
import { QUIZ_VARIANTS } from '../features/games/registry';
import { buildItems } from '../features/games/engine';
import { gameById } from '../features/games/registry';
import { rng } from '../utils/rng';

beforeAll(() => {
  const code = fs.readFileSync('public/packs/upgrade-1.js', 'utf8');
  const w = window as unknown as { DUOPOP_PACKS?: unknown };
  w.DUOPOP_PACKS = []; new Function('window', code)(w); initPacks(); // meniru urutan: <script> paket dulu, lalu aplikasi
});
describe('paket upgrade (dimuat lewat window.DUOPOP_PACKS)', () => {
  it('terdaftar sekali, membawa dataset, varian, dan mitos', () => {
    expect(loadedPacks.map((p) => p.id)).toContain('upgrade-1'); expect(datasets.length).toBeGreaterThanOrEqual(5);
    expect(QUIZ_VARIANTS.some((v) => v.id === 'negara')).toBe(true); expect(mythQuestions.some((q) => q.id.startsWith('pk-upgrade-1'))).toBe(true);
    expect(registerPack({ id: 'upgrade-1' } as Pack)).toBe(false); // tidak ganda
  });
  it('paket yang dimuat belakangan juga terdaftar lewat push', () => {
    (window as unknown as { DUOPOP_PACKS: { push: (p: Pack) => void } }).DUOPOP_PACKS.push({ id: 't', questions: [{ c: 'umum', q: 'Uji paket?', o: ['Ya', 'Tidak'], e: 'ok' }, { c: 'umum', q: 'rusak', o: ['x'], e: '' } as never] });
    expect(allQuestions.some((q) => q.question === 'Uji paket?')).toBe(true); expect(allQuestions.some((q) => q.question === 'rusak')).toBe(false);
  });
  it('seluruh soal tertulis valid (struktur, ID unik, tanpa opsi ganda)', () => { expect(validateQuestions(allQuestions.filter((q) => q.id.startsWith('pk-')))).toEqual([]); });
  it('dataset menghasilkan banyak soal unik yang valid dan deterministik', () => {
    const a = fromDatasets(undefined, 400, rng(5)), b = fromDatasets(undefined, 400, rng(5));
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id)); expect(a.length).toBeGreaterThan(300);
    expect(new Set(a.map((q) => q.id)).size).toBe(a.length);
    for (const q of a) { expect(new Set(q.options).size).toBe(q.options.length); expect(q.options.length).toBeGreaterThanOrEqual(2); expect(q.correctAnswer).toBe(0); }
    expect(fromDatasets(['negara'], 100, rng(1)).every((q) => q.category === 'negara')).toBe(true);
  });
  it('jawaban benar pada perbandingan memang benar', () => {
    const qs = fromDatasets(['negara'], 300, rng(9)).filter((q) => q.id.startsWith('dc-negara'));
    const row = (n: string) => datasets.find((d) => d.id === 'negara')!.rows.find((r) => r.name === n)!;
    expect(qs.length).toBeGreaterThan(20);
    for (const q of qs) { const f = q.question.includes('luas') ? 'area' : 'pop'; expect(Number(row(q.options[0]!)[f])).toBeGreaterThan(Number(row(q.options[1]!)[f])); }
    const ev = fromDatasets(['peristiwa'], 200, rng(2)).filter((q) => q.id.startsWith('dc-peristiwa') && q.question.includes('lebih dulu'));
    const ry = (n: string) => Number(datasets.find((d) => d.id === 'peristiwa')!.rows.find((r) => r.name === n)!.year);
    expect(ev.length).toBeGreaterThan(5); for (const q of ev) expect(ry(q.options[0]!)).toBeLessThan(ry(q.options[1]!));
  });
  it('permainan memakai soal dataset dan tidak berulang antar sesi (soal baru didahulukan)', () => {
    const g = { ...gameById('duel')!, categories: ['negara'] };
    const s1 = buildItems(g, 10, 'sesi-1'), seen = new Set(s1.map((i) => i.id)); const s2 = buildItems(g, 10, 'sesi-2', { seen });
    expect(s1.length).toBe(10); expect(s2.every((i) => !seen.has(i.id))).toBe(true);
  });
});
