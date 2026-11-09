import { getProgress } from '../features/progression/store';
/** Efek suara Monopoli (sintesis WebAudio, tanpa berkas audio). Mengikuti pengaturan suara aplikasi. */
let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === 'undefined' || !getProgress().settings.sound) return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try { ctx = ctx ?? new AC(); if (ctx.state === 'suspended') void ctx.resume(); return ctx; } catch { return null; }
}
function tone(f: number, d: number, at = 0, vol = 0.14, type: OscillatorType = 'sine', slide = 0) {
  const c = ac(); if (!c) return;
  try {
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.05);
  } catch { /* audio tidak tersedia */ }
}
function click(at: number, vol = 0.2) {
  const c = ac(); if (!c) return;
  try {
    const len = Math.floor(c.sampleRate * 0.03), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const s = c.createBufferSource(), g = c.createGain(), bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1500 + Math.random() * 1200; g.gain.value = vol; s.buffer = b;
    s.connect(bp); bp.connect(g); g.connect(c.destination); s.start(c.currentTime + at);
  } catch { /* audio tidak tersedia */ }
}
export const mono = {
  dice: () => { for (let i = 0; i < 7; i++) click(i * 0.08 + Math.random() * 0.02, 0.22); tone(180, 0.1, 0.6, 0.1, 'triangle'); },
  step: () => tone(620, 0.04, 0, 0.07, 'triangle'),
  buy: () => { tone(880, 0.08, 0, 0.12, 'square'); tone(1320, 0.14, 0.08, 0.1, 'square'); },
  coin: () => { tone(1568, 0.07, 0, 0.1, 'triangle'); tone(2093, 0.16, 0.07, 0.1, 'triangle'); },
  pay: () => { tone(330, 0.12, 0, 0.14, 'sawtooth', -120); tone(220, 0.18, 0.1, 0.12, 'sawtooth', -80); },
  card: () => { tone(500, 0.06, 0, 0.1, 'triangle', 500); tone(900, 0.1, 0.06, 0.08, 'triangle'); },
  build: () => { tone(140, 0.07, 0, 0.2, 'square', -60); tone(140, 0.07, 0.14, 0.2, 'square', -60); tone(200, 0.1, 0.28, 0.12, 'triangle'); },
  jail: () => { tone(110, 0.35, 0, 0.2, 'sawtooth', -50); tone(82, 0.4, 0.15, 0.16, 'square'); },
  gavel: () => { tone(160, 0.12, 0, 0.25, 'square', -80); tone(160, 0.12, 0.18, 0.25, 'square', -80); },
  bid: () => tone(740, 0.08, 0, 0.1, 'triangle'),
  bankrupt: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, i * 0.18, 0.15, 'sawtooth')); },
  go: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, i * 0.07, 0.12, 'triangle')); },
};
