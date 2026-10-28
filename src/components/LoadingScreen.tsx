import { useCallback, useEffect, useRef, useState } from 'react';
import { useProgress } from '../features/progression/store';
import { audioRunning, playIntro, setTrack, unlockMusic } from '../utils/music';
import { markBooted } from '../utils/recover';

export const LOADED_KEY = 'duopop:loaded';
const TIPS = [
  'Tahukah kamu? Kota Pontianak dilalui garis khatulistiwa.',
  'Mode Level: lulus dengan benar ≥ 70% untuk membuka level berikutnya.',
  'Ajak teman online — undangan langsung muncul di layarnya.',
  'Soal yang belum pernah kamu lihat selalu didahulukan.',
  'Pasang DUOPOP ke layar utama agar terasa seperti aplikasi.',
  'Mode Tanpa batas: 3 nyawa, soal tidak pernah berhenti.',
];
export const wasLoaded = () => { try { return sessionStorage.getItem(LOADED_KEY) === '1'; } catch { return false; } };

/** Layar pembuka beranimasi + musik. Musik baru bisa bunyi setelah sentuhan pertama (aturan browser), jadi bila perlu ada tombol "Ketuk untuk mulai". */
export function LoadingScreen({ onDone, minMs = 2400 }: { onDone: () => void; minMs?: number }) {
  const musicOn = useProgress().settings.music !== false;
  const [pct, setPct] = useState(4);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)] as string);
  const entered = useRef(false);
  const enter = useCallback((tapped: boolean) => {
    if (entered.current) return;
    entered.current = true;
    unlockMusic();
    if (tapped || audioRunning()) playIntro();
    setLeaving(true);
    setTimeout(() => { try { sessionStorage.setItem(LOADED_KEY, '1'); } catch { /* abaikan */ } onDone(); }, 480);
  }, [onDone]);
  useEffect(() => {
    markBooted();
    setTrack('lobi'); unlockMusic(); // coba mulai musik; bila diblokir, mulai setelah sentuhan pertama
    const t0 = Date.now();
    let loaded = false;
    const fonts: Promise<unknown> = typeof document !== 'undefined' && document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]) : Promise.resolve();
    const win = new Promise<void>((r) => { if (document.readyState === 'complete') r(); else window.addEventListener('load', () => r(), { once: true }); });
    void Promise.all([fonts, win]).finally(() => { loaded = true; });
    const id = setInterval(() => {
      const el = Date.now() - t0;
      setPct(Math.max(4, Math.min(loaded ? 100 : 92, (el / minMs) * 100)));
      if (loaded && el >= minMs) { clearInterval(id); setPct(100); setReady(true); }
    }, 50);
    const unlock = () => unlockMusic();
    window.addEventListener('pointerdown', unlock);
    return () => { clearInterval(id); window.removeEventListener('pointerdown', unlock); };
  }, [minMs]);
  const needsTap = ready && musicOn && !audioRunning();
  useEffect(() => {
    if (!ready || needsTap) return;
    const t = setTimeout(() => enter(false), 500);
    return () => clearTimeout(t);
  }, [ready, needsTap, enter]);
  return (
    <div className={`ld-root ${leaving ? 'leave' : ''}`} role="status" aria-live="polite">
      <span className="ld-sh s1" /><span className="ld-sh s2" /><span className="ld-sh s3" /><span className="ld-sh s4" /><span className="ld-sh s5" />
      <div className="ld-wrap">
        <img className="ld-logo" src={`${import.meta.env.BASE_URL}icon-512.png`} alt="" aria-hidden="true" style={{ width: 180, height: 180 }} />
        <p className="ld-tag">Play Closer, Know More</p>
        <div className="ld-bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Memuat"><div className="ld-fill" style={{ width: `${pct}%` }} /></div>
        {needsTap ? <button className="ld-btn" onClick={() => enter(true)}>Ketuk untuk mulai 🔊</button> : <p className="ld-tip">{ready ? 'Siap!' : tip}</p>}
      </div>
    </div>
  );
}
