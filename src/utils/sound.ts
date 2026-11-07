import { getProgress } from '../features/progression/store';
let ctx: AudioContext | null = null, noise: AudioBuffer | null = null, flip = false;
function ac(): AudioContext | null {
  if (!getProgress().settings.sound || typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try { ctx = ctx ?? new AC(); if (ctx.state === 'suspended') void ctx.resume(); return ctx; } catch { return null; }
}
export function beep(freq: number, dur: number, delay = 0) { tone(freq, dur, delay); }
function tone(freq: number, dur: number, delay = 0, vol = 0.16, type: OscillatorType = 'sine') {
  const c = ac(); if (!c) return;
  try {
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
    o.frequency.value = freq; o.type = type;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  } catch { /* audio tidak tersedia */ }
}
/** Ketukan jam: letupan derau singkat + nada segitiga pendek, bergantian "tik" (tinggi) dan "tok" (rendah). */
function clock(urgent: boolean) {
  const c = ac(); if (!c) return;
  try {
    flip = !flip;
    const f = (flip ? 1900 : 1350) * (urgent ? 1.18 : 1), v = urgent ? 1 : 0.65;
    noise = noise ?? (() => { const b = c.createBuffer(1, Math.floor(c.sampleRate * 0.05), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3; return b; })();
    const s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noise; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 2.5; g.gain.value = 2.2 * v;
    s.connect(bp); bp.connect(g); g.connect(c.destination); s.start(c.currentTime);
    tone(f * 0.6, 0.045, 0, 0.1 * v, 'triangle');
  } catch { /* audio tidak tersedia */ }
}
export const sfx = {
  right: (d = 0) => { tone(660, 0.12, d); tone(880, 0.18, d + 0.1); },
  wrong: (d = 0) => { tone(220, 0.25, d); },
  tick: () => tone(520, 0.05),
  win: () => { tone(523, 0.15); tone(659, 0.15, 0.15); tone(784, 0.3, 0.3); },
  /** Ketukan detik jam untuk timer. urgent = true pada 5 detik terakhir (lebih tinggi & keras). */
  clock: (urgent = false) => clock(urgent),
  /** "Ting" kecil saat jawaban muncul. */
  reveal: () => { tone(784, 0.09, 0, 0.12); tone(1175, 0.18, 0.07, 0.12); },
};
