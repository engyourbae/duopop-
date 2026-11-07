import { useEffect, useRef, useState } from 'react';
import { sfx } from '../utils/sound';
/** Timer hitung mundur dalam detik. `key` mengubah = ulang. Memanggil onEnd sekali. `tick` = bunyikan ketukan jam tiap detik. */
export function useCountdown(seconds: number, key: string | number, running = true, onEnd?: () => void, tick = false) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  useEffect(() => { setLeft(seconds); }, [seconds, key]);
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    let lastSec = Math.ceil(seconds);
    const id = setInterval(() => {
      const l = Math.max(0, seconds - (Date.now() - start) / 1000);
      setLeft(l);
      if (tick && l > 0) { const w = Math.ceil(l); if (w !== lastSec) { lastSec = w; sfx.clock(w <= 5); } }
      if (l <= 0) { clearInterval(id); endRef.current?.(); }
    }, 100);
    return () => clearInterval(id);
  }, [seconds, key, running, tick]);
  return left;
}
