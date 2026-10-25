import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../app/App';
import { patchProgress, resetProgress } from '../features/progression/store';

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => new Proxy({}, { get: () => () => undefined, set: () => true })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});
beforeEach(() => { localStorage.clear(); resetProgress(); patchProgress({ onboarded: true }); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

async function open(id: string) {
  window.location.hash = `#/game/${id}`;
  render(<App />);
  await screen.findByText('Cara bermain');
  vi.useFakeTimers();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Mulai main/ })); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Mulai' })); });
}
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

describe('game arkade berjalan sampai selesai', () => {
  it('Pukul Tikus: waktu habis menampilkan skor', async () => { await open('whack'); expect(screen.getByLabelText('Lubang 1')).toBeInTheDocument(); await advance(31000); expect(screen.getByText(/Skor Pemain 1/)).toBeInTheDocument(); });
  it('Tebak Warna: menjawab mengubah skor dan waktu habis menutup ronde', async () => {
    await open('stroop'); fireEvent.pointerDown(screen.getByLabelText('merah')); await advance(31000); expect(screen.getByText(/Skor Pemain 1/)).toBeInTheDocument();
  });
  it('Ular Lapar: menabrak dinding mengakhiri giliran', async () => { await open('snake'); await advance(4000); expect(screen.getByText(/Skor Pemain 1/)).toBeInTheDocument(); });
  it('Terbang: ketuk lalu jatuh mengakhiri giliran', async () => {
    await open('flappy'); const cv = document.querySelector('canvas') as HTMLCanvasElement; fireEvent.pointerDown(cv); await advance(4000); expect(screen.getByText(/Skor Pemain 1/)).toBeInTheDocument();
  });
  it('Tangkap Bintang: waktu habis mengakhiri giliran', async () => { await open('catch'); await advance(50000); expect(screen.getByText(/Skor Pemain 1/)).toBeInTheDocument(); });
  it('Ikuti Urutan: salah pad mengakhiri giliran', async () => {
    await open('simon'); await advance(2500);
    const pads = [1, 2, 3, 4].map((n) => screen.getByLabelText(`Pad ${n}`));
    for (const p of pads) { fireEvent.pointerDown(p); await advance(1200); if (screen.queryByText(/Skor Pemain 1/)) break; }
    expect(screen.getByText(/Skor Pemain 1/)).toBeInTheDocument();
  });
});
describe('game papan', () => {
  it('Tic-Tac-Toe: X menang satu ronde', async () => {
    window.location.hash = '#/game/tictactoe'; render(<App />); await screen.findByText('Cara bermain');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Mulai main/ })); });
    for (const i of [1, 4, 2, 5, 3]) fireEvent.click(screen.getByLabelText(`Petak ${i}`)); // X: 1,2,3
    expect(screen.getByText(/Pemain 1 menang ronde ini/)).toBeInTheDocument();
  });
  it('Empat Sejajar: empat cakram vertikal menang', async () => {
    window.location.hash = '#/game/connect4'; render(<App />); await screen.findByText('Cara bermain');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Mulai main/ })); });
    for (const c of [1, 2, 1, 2, 1, 2, 1]) fireEvent.click(screen.getByLabelText(`Jatuhkan di kolom ${c}`));
    expect(screen.getByText(/Pemain 1 menang ronde ini/)).toBeInTheDocument();
  });
  it('Pasangan Kartu: membalik dua kartu tidak error', async () => {
    window.location.hash = '#/game/memorymatch'; render(<App />); await screen.findByText('Cara bermain');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Mulai main/ })); });
    const cards = screen.getAllByLabelText('Kartu tertutup'); expect(cards.length).toBe(16);
    fireEvent.click(cards[0] as HTMLElement); fireEvent.click(cards[1] as HTMLElement);
  });
  it('Adu Refleks: menyentuh sebelum hijau memberi poin ke lawan', async () => {
    window.location.hash = '#/game/reflex'; render(<App />); await screen.findByText('Cara bermain');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Mulai main/ })); });
    fireEvent.click(screen.getByRole('button', { name: 'Mulai ronde' }));
    fireEvent.pointerDown(screen.getByLabelText('Area Pemain 1'));
    expect(screen.getByText(/terlalu cepat/)).toBeInTheDocument();
  });
});
