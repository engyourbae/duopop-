import type { Question } from '../../types';
/** Validasi struktur bank pertanyaan. Mengembalikan daftar masalah (kosong = lolos). */
export function validateQuestions(qs: Question[]): string[] {
  const errs: string[] = [];
  const ids = new Set<string>(), texts = new Set<string>();
  for (const q of qs) {
    if (ids.has(q.id)) errs.push(`ID ganda: ${q.id}`);
    ids.add(q.id);
    const key = (q.question + (q.type === 'order' ? '|' + q.options.join('|') : '')).trim().toLowerCase();
    if (texts.has(key)) errs.push(`Pertanyaan ganda: ${q.id}`);
    texts.add(key);
    if (!q.question.trim() || !q.explanation.trim()) errs.push(`Teks kosong: ${q.id}`);
    if (q.status === 'terverifikasi' && (!q.sourceUrl || !q.verifiedAt)) errs.push(`Ditandai terverifikasi tanpa sumber: ${q.id}`);
    if (q.type === 'mcq' || q.type === 'tf3') {
      if (q.options.length < 2) errs.push(`Opsi kurang: ${q.id}`);
      if (new Set(q.options).size !== q.options.length) errs.push(`Opsi ganda: ${q.id}`);
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) errs.push(`Kunci di luar rentang: ${q.id}`);
    } else if (q.type === 'order') {
      const sorted = q.years.every((y, i) => i === 0 || (q.years[i - 1] as number) <= y);
      if (!sorted || q.years.length !== q.options.length) errs.push(`Urutan kronologi salah: ${q.id}`);
    } else if (!Number.isFinite(q.correctAnswer)) errs.push(`Jawaban estimasi tidak valid: ${q.id}`);
  }
  return errs;
}
