import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Social, STICKERS, EMOTES } from '../features/chat/Social';
import { dmId } from '../services/chat';
import { ToastProvider } from '../components/ui';

afterEach(cleanup);
describe('chat, reaksi, stiker', () => {
  it('id percakapan langsung konsisten dua arah', () => { expect(dmId('b', 'a')).toBe(dmId('a', 'b')); expect(dmId('a', 'b')).toBe('a_b'); });
  it('stiker dan emote unik', () => { expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length); expect(new Set(EMOTES).size).toBe(EMOTES.length); expect(STICKERS.length).toBeGreaterThanOrEqual(10); });
  it('panel chat dan lembar stiker terbuka tanpa Firebase (aman, tidak error)', () => {
    localStorage.setItem('duopop:chat:room:ABCDE', JSON.stringify([{ id: '1', uid: 'u2', name: '@bee', kind: 'text', text: 'halo!', at: 1 }]));
    render(<ToastProvider><Social scope={{ kind: 'room', id: 'ABCDE' }} me={{ uid: 'u1', displayName: '@aku' }} title="Chat ruang ABCDE" /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Chat' }));
    expect(screen.getByText('halo!')).toBeInTheDocument(); expect(screen.getByText(/numpang lewat/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus riwayat lokal' })); expect(screen.getByText('Belum ada pesan.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stiker' })); expect(screen.getByText('Mantap!')).toBeInTheDocument();
  });
});
