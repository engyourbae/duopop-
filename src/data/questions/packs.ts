import type { ChoiceQuestion, Difficulty, GameVariant } from '../../types';
import { mcqBank, mythQuestions, allQuestions, CATEGORY_LABEL, MYTH_OPTIONS } from './index';
import { QUIZ_VARIANTS } from '../../features/games/registry';
import { shuffle } from '../../utils/rng';

/** Paket upgrade: file .js terpisah yang memanggil window.DUOPOP_PACKS.push({...}) lewat tag <script> di HTML. */
export interface PackQuestion { c: string; s?: string; d?: Difficulty; q: string; o: string[]; e: string }
export interface PackMyth { s: string; a: 0 | 1 | 2; d?: Difficulty; e: string }
export interface Template { q: string; a: string; d?: Difficulty; e?: string }
export interface Compare { q: string; field: string; max?: boolean; unit?: string }
export interface Dataset { id: string; category: string; sub?: string; rows: Record<string, string | number>[]; templates?: Template[]; compares?: Compare[]; nameField?: string }
export interface Pack { id: string; name?: string; version?: number; questions?: PackQuestion[]; myths?: PackMyth[]; datasets?: Dataset[]; variants?: GameVariant[]; categoryLabels?: Record<string, string> }

export const datasets: Dataset[] = [];
export const loadedPacks: { id: string; name: string; version: number; questions: number; datasets: number }[] = [];
const meta = { language: 'id' as const, sourceTitle: '', sourceUrl: '', verifiedAt: null, contentVersion: 1, status: 'perlu-tinjauan' as const };
const DIFFS: Difficulty[] = ['mudah', 'sedang', 'sulit'];

export function registerPack(p: Pack): boolean {
  if (!p || typeof p.id !== 'string' || loadedPacks.some((x) => x.id === p.id)) return false;
  let added = 0;
  (p.questions ?? []).forEach((r, i) => {
    if (!r || typeof r.q !== 'string' || !Array.isArray(r.o) || r.o.length < 2 || new Set(r.o).size !== r.o.length || typeof r.e !== 'string' || typeof r.c !== 'string') return;
    const q: ChoiceQuestion = { ...meta, id: `pk-${p.id}-${i}`, category: r.c, subcategory: r.s ?? '', difficulty: DIFFS.includes(r.d as Difficulty) ? (r.d as Difficulty) : 'sedang', type: 'mcq', question: r.q, options: r.o.map(String), correctAnswer: 0, explanation: r.e };
    mcqBank.push(q); allQuestions.push(q); added++;
  });
  (p.myths ?? []).forEach((m, i) => {
    if (!m || typeof m.s !== 'string' || ![0, 1, 2].includes(m.a) || typeof m.e !== 'string') return;
    const q: ChoiceQuestion = { ...meta, id: `pk-${p.id}-m${i}`, category: 'mitos', subcategory: 'Fakta atau Mitos', difficulty: DIFFS.includes(m.d as Difficulty) ? (m.d as Difficulty) : 'sedang', type: 'tf3', question: m.s, options: MYTH_OPTIONS, correctAnswer: m.a, explanation: m.e };
    mythQuestions.push(q); allQuestions.push(q); added++;
  });
  const ds = (p.datasets ?? []).filter((d) => d && typeof d.id === 'string' && Array.isArray(d.rows) && d.rows.length >= 4);
  datasets.push(...ds);
  for (const v of p.variants ?? []) if (v && v.id && v.label && !QUIZ_VARIANTS.some((x) => x.id === v.id)) QUIZ_VARIANTS.push(v);
  Object.assign(CATEGORY_LABEL, p.categoryLabels ?? {});
  loadedPacks.push({ id: p.id, name: p.name ?? p.id, version: p.version ?? 1, questions: added, datasets: ds.length });
  return true;
}
/** Menghubungkan window.DUOPOP_PACKS: paket yang sudah dimuat langsung didaftarkan; yang dimuat belakangan juga. */
export function initPacks(): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { DUOPOP_PACKS?: unknown };
  const queued = Array.isArray(w.DUOPOP_PACKS) ? (w.DUOPOP_PACKS as Pack[]) : [];
  w.DUOPOP_PACKS = { push: (...ps: Pack[]) => { ps.forEach((x) => { try { registerPack(x); } catch (e) { console.warn('Paket gagal dimuat', e); } }); return loadedPacks.length; } };
  queued.forEach((x) => { try { registerPack(x); } catch (e) { console.warn('Paket gagal dimuat', e); } });
}

const fill = (s: string, row: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(row[k] ?? ''));
const ratioDiff = (a: number, b: number): Difficulty => { const r = Math.max(a, b) / Math.max(1e-9, Math.min(a, b)); return r < 1.35 ? 'sulit' : r < 2.2 ? 'sedang' : 'mudah'; };
/** Menghasilkan kandidat soal dari dataset (dua arah + perbandingan). ID stabil agar pelacakan "sudah dilihat" bekerja. */
export function fromDatasets(cats: string[] | undefined, n: number, r: () => number): ChoiceQuestion[] {
  const sets = datasets.filter((d) => !cats || cats.includes(d.category));
  if (!sets.length) return [];
  const per = Math.ceil(n / sets.length), out: ChoiceQuestion[] = [], ids = new Set<string>();
  for (const d of sets) {
    const nameF = d.nameField ?? 'name', tpl = d.templates ?? [], cmp = d.compares ?? [];
    let guard = per * 6, made = 0;
    while (made < per && guard-- > 0) {
      const useCmp = cmp.length > 0 && (tpl.length === 0 || r() < 0.4);
      let q: ChoiceQuestion;
      if (useCmp) {
        const k = Math.floor(r() * cmp.length), c = cmp[k] as Compare, i = Math.floor(r() * d.rows.length), j = Math.floor(r() * d.rows.length);
        if (i === j) continue;
        const A = d.rows[i] as Record<string, string | number>, B = d.rows[j] as Record<string, string | number>, va = Number(A[c.field]), vb = Number(B[c.field]);
        if (!Number.isFinite(va) || !Number.isFinite(vb) || va === vb || Math.max(va, vb) / Math.max(1e-9, Math.min(va, vb)) < 1.12) continue;
        const winA = c.max === false ? va < vb : va > vb, win = winA ? A : B, lose = winA ? B : A, u = c.unit ? ` ${c.unit}` : '';
        q = { ...meta, id: `dc-${d.id}-${Math.min(i, j)}-${Math.max(i, j)}-${k}`, category: d.category, subcategory: d.sub ?? '', difficulty: ratioDiff(va, vb), type: 'mcq', question: c.q, options: [String(win[nameF]), String(lose[nameF])], correctAnswer: 0, explanation: `${win[nameF]}: ${win[c.field]}${u}; ${lose[nameF]}: ${lose[c.field]}${u}.` };
      } else {
        const k = Math.floor(r() * tpl.length), t = tpl[k] as Template, i = Math.floor(r() * d.rows.length), row = d.rows[i] as Record<string, string | number>;
        const ans = fill(t.a, row), prompt = fill(t.q, row);
        if (!ans || !prompt) continue;
        const wrong = [...new Set(shuffle(d.rows, r).map((x) => fill(t.a, x)).filter((x) => x && x !== ans))].slice(0, 3);
        if (wrong.length < 2) continue;
        q = { ...meta, id: `ds-${d.id}-${i}-${k}`, category: d.category, subcategory: d.sub ?? '', difficulty: t.d ?? 'sedang', type: 'mcq', question: prompt, options: [ans, ...wrong], correctAnswer: 0, explanation: t.e ? fill(t.e, row) : `${prompt.replace(/…$/, '')} ${ans}.` };
      }
      if (ids.has(q.id)) continue;
      ids.add(q.id); out.push(q); made++;
    }
  }
  return out;
}
