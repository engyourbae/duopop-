import { getProgress } from '../features/progression/store';
import { introFanfare, makeBus, scheduleStep, STYLES, type Bus, type Track } from './musicEngine';
export type { Track };
export { STYLES };

let ctx: AudioContext | null = null, master: GainNode | null = null, bus: Bus | null = null, busTrack: Track | null = null, timer: ReturnType<typeof setInterval> | undefined;
let want: Track | null = null, cur: Track | null = null, started = false, step = 0, nextT = 0;
const MASTER = 0.34;
const enabled = () => getProgress().settings.music !== false;
const volume = () => Math.max(0, Math.min(1, getProgress().settings.musicVol ?? 0.7));

function ensure(): boolean {
  if (typeof window === 'undefined') return false;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  try {
    if (!ctx) {
      ctx = new AC(); master = ctx.createGain();
      // rantai keluaran: lowpass (haluskan desis) -> kompresor lembut -> pembatas. Tanpa distorsi/saturasi.
      const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 7500; tone.Q.value = 0.5;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -22; comp.knee.value = 20; comp.ratio.value = 2.5; comp.attack.value = 0.01; comp.release.value = 0.25;
      const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
      master.connect(tone); tone.connect(comp); comp.connect(lim); lim.connect(ctx.destination);
    }
    master?.gain.setTargetAtTime(MASTER * volume(), ctx.currentTime, 0.05);
    if (ctx.state === 'suspended') void ctx.resume();
    return true;
  } catch { return false; }
}
const busFor = (t: Track): Bus | null => { if (!ctx || !master) return null; if (!bus || busTrack !== t) { bus = makeBus(ctx, master, STYLES[t].bpm); busTrack = t; } return bus; };
function schedule() {
  if (!ctx || !cur || !bus) return;
  const q = 60 / STYLES[cur].bpm / 4;
  while (nextT < ctx.currentTime + 0.45) { scheduleStep(bus, cur, step, nextT); nextT += q; step++; }
}
function stop() { if (timer) clearInterval(timer); timer = undefined; cur = null; }
function apply() {
  if (!started) return;
  if (!enabled() || !want) { stop(); return; }
  if (cur === want && timer) { master?.gain.setTargetAtTime(MASTER * volume(), ctx?.currentTime ?? 0, 0.05); return; }
  stop();
  if (!ensure() || !ctx) return;
  cur = want; step = 0; nextT = ctx.currentTime + 0.15; busFor(cur);
  timer = setInterval(schedule, 100); schedule();
}
/** Pilih lagu (null = biarkan). */
export function setTrack(t: Track | null) { if (t) { want = t; apply(); } }
/** Dipanggil pada sentuhan pertama pengguna (kebijakan autoplay browser). Aman dipanggil berulang. */
export function unlockMusic() { started = true; if (ctx && ctx.state === 'suspended') void ctx.resume(); apply(); }
export function refreshMusic() { apply(); }
export const audioRunning = () => !!ctx && ctx.state === 'running';
/** Jingle pembuka singkat. */
export function playIntro() {
  if (!enabled() || !ensure() || !ctx) return;
  const b = busFor(cur ?? want ?? 'lobi'); if (b) introFanfare(b, ctx.currentTime + 0.05);
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend(); else if (started && enabled()) void ctx.resume();
  });
}
