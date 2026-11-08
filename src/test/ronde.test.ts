import { buildItems, poolStats } from '../features/games/engine';
import { gameById, withVariant } from '../features/games/registry';

describe('statistik topik & filter kesulitan Duel Pengetahuan', () => {
  it('jumlah soal per tingkat konsisten dengan total', () => {
    const s = poolStats(withVariant(gameById('duel')!, 'sejarah'));
    expect(s.unlimited).toBe(false);
    expect(s.total).toBeGreaterThan(0);
    expect(s.total).toBe(s.mudah + s.sedang + s.sulit);
  });
  it('topik generator ditandai tanpa batas', () => {
    expect(poolStats(withVariant(gameById('duel')!, 'hitung')).unlimited).toBe(true);
  });
  it('filter kesulitan hanya mengambil soal bertingkat itu dan setiap soal membawa tingkatnya', () => {
    const g = withVariant(gameById('duel')!, 'semua');
    for (const diff of ['mudah', 'sedang', 'sulit'] as const) {
      const items = buildItems(g, 20, `uji-${diff}`, { difficulty: diff });
      expect(items.length).toBe(20);
      expect(items.every((i) => i.diff === diff)).toBe(true);
    }
  });
  it('ronde 30 soal tersusun penuh', () => {
    expect(buildItems(withVariant(gameById('duel')!, 'semua'), 30, 'uji-30').length).toBe(30);
  });
});
