import { useEffect, useState } from 'react';
import { Button } from './ui';

/** Muncul saat versi baru aplikasi sudah diunduh. Tombol "Muat ulang" mengaktifkan versi baru. */
export function UpdateBanner() {
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const f = (e: Event) => setReg((e as CustomEvent<ServiceWorkerRegistration>).detail ?? null);
    window.addEventListener('duopop:update-ready', f);
    return () => window.removeEventListener('duopop:update-ready', f);
  }, []);
  if (!reg) return null;
  const apply = () => {
    setBusy(true);
    if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING'); else window.location.reload();
    setTimeout(() => window.location.reload(), 2500); // cadangan bila halaman tidak berganti otomatis
  };
  return <div className="banner-update" role="status"><span>Versi baru tersedia</span><Button size="sm" variant="soft" onClick={apply} disabled={busy}>{busy ? 'Memuat…' : 'Muat ulang'}</Button><Button size="sm" variant="ghost" onClick={() => setReg(null)} aria-label="Tutup">Nanti</Button></div>;
}
