import { Component, type ErrorInfo, type ReactNode } from 'react';
import { resetApp } from '../utils/recover';

/** Menangkap galat render agar pengguna melihat penjelasan + tombol pemulihan, bukan layar putih. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('DUOPOP error', error, info.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    const box = { maxWidth: 420, margin: '12vh auto', padding: 20, background: '#fffaf0', color: '#17140e', border: '2px solid #17140e', borderRadius: 16, boxShadow: '4px 4px 0 #17140e', fontFamily: 'system-ui, sans-serif' } as const;
    const btn = { minHeight: 48, width: '100%', marginTop: 10, border: '2px solid #17140e', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: 'pointer' } as const;
    return (
      <div style={box} role="alert">
        <h2 style={{ margin: '0 0 8px' }}>Ups, aplikasi mengalami masalah</h2>
        <p style={{ margin: 0 }}>Progresmu aman. Coba muat ulang; jika tetap gagal, bersihkan cache.</p>
        <button style={{ ...btn, background: '#2a4bff', color: '#fff' }} onClick={() => location.reload()}>Muat ulang</button>
        <button style={{ ...btn, background: '#ffc414' }} onClick={() => void resetApp()}>Bersihkan cache &amp; muat ulang</button>
        <p style={{ fontSize: 12, opacity: 0.7, wordBreak: 'break-word' }}>{this.state.error.message}</p>
      </div>
    );
  }
}
