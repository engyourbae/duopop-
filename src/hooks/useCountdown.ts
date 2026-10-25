import { useEffect, useRef, useState } from 'react';
/** Timer hitung mundur dalam detik. `key` mengubah = ulang. Memanggil onEnd sekali. */
export function useCountdown(seconds: number, key: string | number, running = true, onEnd?: () => void) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  useEffect(() => { setLeft(seconds); }, [seconds, key]);
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const id = setInterval(() => {
      const l = Math.max(0, seconds - (Date.now() - start) / 1000);
      setLeft(l);
      if (l <= 0) { clearInterval(id); endRef.current?.(); }
    }, 100);
    return () => clearInterval(id);
  }, [seconds, key, running]);
  return left;
}
