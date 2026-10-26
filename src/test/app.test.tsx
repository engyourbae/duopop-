import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../app/App';
import { GAMES } from '../features/games/registry';
import { patchProgress, resetProgress } from '../features/progression/store';

const go = (hash: string) => { window.location.hash = hash; };
beforeEach(() => { localStorage.clear(); resetProgress(); patchProgress({ onboarded: true }); go('#/'); });
afterEach(cleanup);

describe('navigasi & halaman penting', () => {
  it('beranda menampilkan game inti dan tantangan harian', async () => {
    render(<App />);
    expect(await screen.findByText('Tantangan Harian')).toBeInTheDocument();
    expect(screen.getByText('How Well Do You Know Me?')).toBeInTheDocument();
  });
  it('belum onboarding diarahkan ke layar mulai', async () => {
    patchProgress({ onboarded: false }); render(<App />);
    expect(await screen.findByText('Kenali lebih dekat')).toBeInTheDocument();
  });
  it('daftar game memuat semua game dan pencarian bekerja', async () => {
    go('#/game'); render(<App />);
    expect((await screen.findAllByLabelText(/^Buka /)).length).toBe(GAMES.length);
    fireEvent.change(screen.getByLabelText('Cari game'), { target: { value: 'kronologi' } });
    expect(screen.getAllByLabelText(/^Buka /).length).toBe(1);
    fireEvent.change(screen.getByLabelText('Cari game'), { target: { value: 'zzzz' } });
    expect(screen.getByText('Tidak ada game')).toBeInTheDocument();
  });
  it('halaman tidak ditemukan', async () => { go('#/tidak-ada'); render(<App />); expect(await screen.findByText('Halaman tidak ditemukan')).toBeInTheDocument(); });
  it.each(['#/profil', '#/statistik', '#/riwayat', '#/notifikasi', '#/pengaturan', '#/bantuan', '#/offline'])('halaman %s terbuka', async (h) => {
    go(h); const { container } = render(<App />); await screen.findByRole('navigation', { name: 'Navigasi utama' }); expect(container.querySelector('.page, .empty')).not.toBeNull();
  });
});
describe('fallback Firebase belum dikonfigurasi', () => {
  it.each([['#/lobi', 'Fitur online belum aktif'], ['#/teman', 'Fitur online belum aktif'], ['#/grup', 'Fitur online belum aktif'], ['#/ruang/ABCDE', 'Fitur online belum aktif'], ['#/masuk', 'Akun belum diaktifkan']])('%s', async (h, t) => {
    go(h); render(<App />); expect(await screen.findByText(t)).toBeInTheDocument();
  });
});
describe('semua game dapat dibuka dan dimulai', () => {
  for (const g of GAMES) {
    it(`${g.id}: setup lalu mulai`, async () => {
      go(`#/game/${g.id}`); render(<App />);
      expect(await screen.findByText('Cara bermain')).toBeInTheDocument();
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Mulai main|Berlatih/ })); });
      expect(screen.queryByText('Cara bermain')).toBeNull();
      expect(document.querySelector('.page')).not.toBeNull();
    });
  }
  it('game tidak dikenal', async () => { go('#/game/xyz'); render(<App />); expect(await screen.findByText('Game tidak ditemukan')).toBeInTheDocument(); });
});
describe('alur kuis end-to-end', () => {
  it('menjawab satu soal menampilkan penjelasan lalu bisa lanjut', async () => {
    go('#/game/fakta-mitos'); render(<App />);
    await act(async () => { fireEvent.click(await screen.findByRole('button', { name: /Mulai main/ })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^A\s*Fakta/ })); });
    expect(screen.getByRole('button', { name: /^Lanjut/ })).toBeInTheDocument();
  });
});
