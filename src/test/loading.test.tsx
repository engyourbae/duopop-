import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { LoadingScreen, LOADED_KEY, wasLoaded } from '../components/LoadingScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { patchSettings, resetProgress } from '../features/progression/store';

beforeEach(() => { localStorage.clear(); resetProgress(); sessionStorage.removeItem(LOADED_KEY); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); sessionStorage.setItem(LOADED_KEY, '1'); });
/** Maju bertahap agar React sempat merender di antara langkah (seperti waktu nyata). */
const adv = async (ms: number) => { for (let t = 0; t < ms; t += 250) await act(async () => { await vi.advanceTimersByTimeAsync(250); }); };

describe('layar loading', () => {
  it('menampilkan logo, bilah kemajuan, dan tombol ketuk saat musik aktif tetapi audio belum diizinkan', async () => {
    const done = vi.fn(); render(<LoadingScreen onDone={done} />);
    expect(screen.getByLabelText('duopop')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Memuat' })).toBeInTheDocument();
    await adv(3000);
    const btn = screen.getByRole('button', { name: /Ketuk untuk mulai/ });
    expect(done).not.toHaveBeenCalled();
    fireEvent.click(btn); await adv(600);
    expect(done).toHaveBeenCalledTimes(1); expect(wasLoaded()).toBe(true);
  });
  it('masuk otomatis bila musik dimatikan', async () => {
    patchSettings({ music: false });
    const done = vi.fn(); render(<LoadingScreen onDone={done} />);
    await adv(3500); expect(done).toHaveBeenCalledTimes(1);
  });
  it('tidak dipanggil dua kali walau diketuk berulang', async () => {
    const done = vi.fn(); render(<LoadingScreen onDone={done} />); await adv(3000);
    const btn = screen.getByRole('button', { name: /Ketuk untuk mulai/ }); fireEvent.click(btn); fireEvent.click(btn); await adv(800);
    expect(done).toHaveBeenCalledTimes(1);
  });
});
describe('penanganan galat', () => {
  it('menampilkan penjelasan dan tombol pemulihan, bukan layar kosong', () => {
    const Bomb = () => { throw new Error('contoh galat'); };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Ups, aplikasi mengalami masalah');
    expect(screen.getByRole('button', { name: /Bersihkan cache/ })).toBeInTheDocument();
    expect(screen.getByText('contoh galat')).toBeInTheDocument();
    spy.mockRestore();
  });
});
