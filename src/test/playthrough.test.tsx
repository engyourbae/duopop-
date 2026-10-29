import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../app/App';
import { GAMES } from '../features/games/registry';
import { patchProgress, resetProgress, patchSettings } from '../features/progression/store';

beforeAll(() => { HTMLCanvasElement.prototype.getContext = (() => new Proxy({}, { get: () => () => undefined, set: () => true })) as unknown as typeof HTMLCanvasElement.prototype.getContext; });
beforeEach(() => { localStorage.clear(); resetProgress(); patchProgress({ onboarded: true }); patchSettings({ music: false, pause: 1 }); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const btns = () => screen.queryAllByRole('button') as HTMLButtonElement[];
const byName = (re: RegExp) => btns().find((b) => !b.disabled && re.test(b.textContent ?? '') );
const click = (el: Element) => fireEvent.click(el);
const done = () => !!screen.queryByRole('heading', { name: 'Hasil' });

/** Robot: menekan tombol yang masuk akal sampai muncul layar Hasil. Mengembalikan jumlah langkah, atau -1 bila macet. */
async function bot(id: string, maxSteps = 700): Promise<number> {
  window.location.hash = `#/game/${id}`;
  render(<App />);
  await screen.findByText('Cara bermain');
  vi.useFakeTimers();
  await act(async () => { click(byName(/Mulai main|Berlatih/) as Element); });
  let memFlip = 0;
  for (let step = 0; step < maxSteps; step++) {
    if (done()) return step;
    await act(async () => {
      const q = (sel: string) => Array.from(document.querySelectorAll<HTMLButtonElement>(sel)).filter((b) => !b.disabled);
      if (step > 40) { const end = byName(/Akhiri permainan/); if (end) { click(end); return; } }
      const text = document.querySelector<HTMLInputElement>('input.input:not([disabled]), textarea.input');
      // pengisi teks
      if (text && /Ketik|Kata berikutnya|Kalimat|Perkiraan|Mulai mengetik/i.test(`${text.placeholder} ${text.getAttribute('aria-label')}`)) {
        const v = /Perkiraan/i.test(text.getAttribute('aria-label') ?? '') ? '5' : /Kata berikutnya/i.test(text.placeholder) ? `kata${step}` : /Mulai mengetik/i.test(text.placeholder) ? 'x'.repeat(60) : `kalimat uji nomor ${step}`;
        if (text.value !== v) { fireEvent.change(text, { target: { value: v } }); }
        const send = byName(/^Kirim$|Tambah kalimat|Kunci jawaban/); if (send) click(send);
        return;
      }
      const prio = [/^Aku .*(lanjut|lihat kartuku)|^Mulai$|Lihat hasil|^Selesai/, /^Lanjut|Berikutnya|Pemain berikutnya|Ronde berikutnya/, /Putar roda/, /Selesai \(\+1\)|^Berhasil|Sudah dibahas|Tantangan selesai|Benar!$|Benar ditebak/, /Mulai ronde|^Mulai/, /Periksa urutan|Kunci jawaban/];
      for (const re of prio) { const b = byName(re); if (b) { click(b); return; } }
      // wordle: ketik 5 huruf lalu kirim
      const keys = q('.wkey:not(.wide)'); if (keys.length) { const ok = byName(/^Kirim$/); if (ok) { click(ok); return; } for (let i = 0; i < 5; i++) click(keys[(step + i * 3) % keys.length] as Element); return; }
      const opts = q('.opt'); if (opts.length) { click(opts[step % opts.length] as Element); return; }
      const cards = q('.mcard:not(.up):not(.matched)'); if (cards.length) { click(cards[(memFlip++) % cards.length] as Element); return; }
      const tap = q('.tapbig'); if (tap.length) { fireEvent.pointerDown(tap[0] as Element); return; }
      const tiles = q('.ltile:not(.used)'); if (tiles.length) { click(tiles[0] as Element); return; }
      const buzz = q('.buzzbtn'); if (buzz.length) { fireEvent.pointerDown(buzz[0] as Element); return; }
      const uc = q('button.ucard:not(.dim)'); if (uc.length) { click(uc[0] as Element); const w = byName(/^(Merah|Kuning|Hijau|Biru)$/); if (w) click(w); return; }
      const d = q('.dbtn:not(.dim)'); if (d.length) { click(d[0] as Element); const k = byName(/Pasang kiri/); if (k) click(k); return; }
      if (step > 40) { const end = byName(/Akhiri permainan/); if (end) { click(end); return; } }
      const move = byName(/Lempar dadu|Ambil kartu|Lewati|Tidak ada kartu cocok/); if (move) { click(move); return; }
      const chips = q('.chip'); void chips;
      const pass = byName(/Lewati/); if (pass) click(pass);
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
  }
  return -1;
}

const SKIP = new Set(['snake', 'flappy', 'catch', 'simon', 'reflex', 'tictactoe', 'connect4', 'whack', 'stroop']); // sudah diuji khusus di arcade.test
describe('robot memainkan setiap game sampai layar Hasil', () => {
  for (const g of GAMES.filter((x) => !SKIP.has(x.id))) {
    it(g.id, async () => { const n = await bot(g.id, ['uno', 'tebakkata', 'ulartangga', 'memorymatch'].includes(g.id) ? 3000 : 700); expect(n, `${g.id} macet`).toBeGreaterThanOrEqual(0); }, 60000);
  }
});
