import { useEffect } from 'react';
import { useProgress } from '../features/progression/store';
/** Jeda penjelasan setelah menjawab: detik dari pengaturan (0 = manual). */
export function usePauseSecs(): number { const p = useProgress().settings.pause; return typeof p === 'number' ? p : 6; }
/** Menjalankan next() otomatis setelah `secs` detik saat `active`. secs=0 → manual. */
export function useAutoNext(active: boolean, secs: number, next: () => void, key: string | number) {
  useEffect(() => {
    if (!active || secs <= 0) return;
    const t = setTimeout(next, secs * 1000);
    return () => clearTimeout(t);
  }, [active, secs, key]); // eslint-disable-line react-hooks/exhaustive-deps
}
