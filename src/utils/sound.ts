import { getProgress } from '../features/progression/store';
let ctx: AudioContext | null = null;
export function beep(freq: number, dur: number, delay = 0) { tone(freq, dur, delay); }
function tone(freq: number, dur: number, delay = 0) {
  const s = getProgress().settings;
  if (!s.sound || typeof window === 'undefined') return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  try {
    ctx = ctx ?? new AC();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + delay + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
    o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + delay); o.stop(ctx.currentTime + delay + dur + 0.05);
  } catch { /* audio tidak tersedia */ }
}
export const sfx = {
  right: () => { tone(660, 0.12); tone(880, 0.18, 0.1); },
  wrong: () => { tone(220, 0.25); },
  tick: () => tone(520, 0.05),
  win: () => { tone(523, 0.15); tone(659, 0.15, 0.15); tone(784, 0.3, 0.3); },
};
