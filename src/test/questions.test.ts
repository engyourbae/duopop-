import { allQuestions, clueItems, mythQuestions, orderQuestions } from '../data/questions';
import { validateQuestions } from '../data/questions/validate';

describe('bank pertanyaan', () => {
  it('lolos validasi struktur', () => { expect(validateQuestions(allQuestions)).toEqual([]); });
  it('minimal 200 pertanyaan unik', () => {
    expect(allQuestions.length).toBeGreaterThanOrEqual(200);
    expect(new Set(allQuestions.map((q) => q.id)).size).toBe(allQuestions.length);
    expect(new Set(allQuestions.map((q) => (q.question + (q.type === 'order' ? q.options.join('|') : '')).toLowerCase())).size).toBe(allQuestions.length);
  });
  it('tidak ada yang ditandai terverifikasi tanpa sumber', () => {
    expect(allQuestions.filter((q) => q.status === 'terverifikasi')).toEqual([]);
    expect(allQuestions.every((q) => q.sourceUrl === '')).toBe(true);
  });
  it('urutan kronologi benar', () => { for (const q of orderQuestions) expect([...q.years].sort((a, b) => a - b)).toEqual(q.years); });
  it('fakta/mitos punya tiga opsi', () => { expect(mythQuestions.every((q) => q.options.length === 3)).toBe(true); });
  it('tebakan bertahap punya jawaban di luar daftar salah', () => { for (const c of clueItems) expect(c.wrong).not.toContain(c.answer); });
  it('validator mendeteksi ID ganda dan kunci rusak', () => {
    const a = allQuestions[0]!;
    expect(validateQuestions([a, a]).length).toBeGreaterThan(0);
    expect(validateQuestions([{ ...a, id: 'x', question: 'unik?', correctAnswer: 99 } as typeof a]).some((e) => e.includes('Kunci'))).toBe(true);
  });
});
