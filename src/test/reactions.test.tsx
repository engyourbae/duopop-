import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LocalReactDock, CUSTOM_REACTS, CustomReact, EMOTES } from '../features/chat/Fx';
import { ToastProvider } from '../components/ui';

afterEach(cleanup);
describe('reaksi melayang (semua permainan)', () => {
  it('emoji bawaan tampil apa adanya dan melayang saat diketuk', () => {
    const { container } = render(<ToastProvider><LocalReactDock /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Reaksi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reaksi 🔥' }));
    const b = container.querySelector('.fx-bubble');
    expect(b).toBeTruthy(); expect(b?.textContent).toContain('🔥'); expect(b?.querySelector('svg')).toBeNull();
  });
  it('reaksi kustom digambar SVG dan ikut melayang', () => {
    const { container } = render(<ToastProvider><LocalReactDock /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Reaksi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reaksi Ngakak' }));
    expect(container.querySelector('.fx-bubble svg.fx-custom')).toBeTruthy();
  });
  it('semua reaksi kustom punya gambar, id unik, emoji unik', () => {
    expect(new Set(CUSTOM_REACTS.map((c) => c.id)).size).toBe(CUSTOM_REACTS.length); expect(new Set(EMOTES).size).toBe(EMOTES.length);
    CUSTOM_REACTS.forEach((c) => { const { container, unmount } = render(<CustomReact id={c.id} />); expect(container.querySelector('svg')).toBeTruthy(); unmount(); });
  });
  it('lembar stiker memuat emoji bawaan, reaksi kustom, dan stiker', () => {
    render(<ToastProvider><LocalReactDock /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Reaksi' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stiker' }));
    expect(screen.getByRole('button', { name: 'Kirim 😭' })).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Kirim Nangis' })).toBeInTheDocument(); expect(screen.getByText('Mantap!')).toBeInTheDocument();
  });
});
