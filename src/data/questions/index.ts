import type { Question } from '../../types';
import { mcqQuestions } from './mcq';
import { mythQuestions, orderQuestions, eraQuestions, estimateQuestions } from './other';
export { clueItems } from './clues';
export { MYTH_OPTIONS, ERAS, eraOf } from './other';
export const CATEGORY_LABEL: Record<string, string> = {
  'sejarah-id': 'Sejarah Indonesia', kemerdekaan: 'Perjuangan Kemerdekaan', kerajaan: 'Kerajaan Nusantara',
  'sejarah-dunia': 'Sejarah Dunia', 'geo-id': 'Geografi Indonesia', 'geo-dunia': 'Geografi Dunia', 'fakta-id': 'Fakta Indonesia',
  budaya: 'Budaya, Bahasa & Sastra', tokoh: 'Tokoh', sains: 'Sains & Alam', teknologi: 'Teknologi', antariksa: 'Antariksa',
  hewan: 'Hewan & Lingkungan', mitos: 'Fakta atau Mitos', logika: 'Logika & Teka-teki', umum: 'Pengetahuan Umum', kronologi: 'Kronologi Sejarah',
};
export const allQuestions: Question[] = [...mcqQuestions, ...mythQuestions, ...orderQuestions, ...eraQuestions, ...estimateQuestions];
export const mcqBank = mcqQuestions;
export { mythQuestions, orderQuestions, eraQuestions, estimateQuestions };
