import { getProgress } from '../features/progression/store';

/** Musik latar disintesis dengan WebAudio (tanpa berkas audio): tiga lagu pendek berulang. */
export type Track = 'lobi' | 'game' | 'arkade';
interface Def { bpm: number; root: number; wave: OscillatorType; prog: number[]; lead: (number | null)[]; bass: (number | null)[]; drums: boolean; gain: number }
const SCALE = [0, 2, 4, 7, 9]; // pentatonik mayor: selalu enak didengar
export const TRACKS: Record<Track, Def> = {
  lobi: { bpm: 96, root: 196, wave: 'triangle', prog: [0, -3, -5, -7], drums: false, gain: 0.5,
    lead: [4, null, 5, null, 7, null, 5, null, 4, null, 2, null, 0, null, 2, null], bass: [0, null, null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null] },
  game: { bpm: 124, root: 220, wave: 'square', prog: [0, -5, -3, -7], drums: true, gain: 0.22,
    lead: [4, 5, 7, 5, 4, 2, 4, null, 7, 9, 7, 5, 4, 5, 2, null], bass: [0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null] },
  arkade: { bpm: 156, root: 247, wave: 'square', prog: [0, -3, -5, -2], drums: true, gain: 0.2,
    lead: [0, 2, 4, 7, 4, 2, 0, 2, 4, 7, 9, 7, 4, 2, 4, 2], bass: [0, 0, null, 0, 0, 0, null, 0, 0, 0, null, 0, 0, 0, null, 0] },
};
export const degreeFreq = (root: number, rootOff: number, degree: number) => root * 2 ** ((rootOff + (SCALE[degree % 5] as number) + 12 * Math.floor(degree / 5)) / 12);

let ctx: AudioContext | null = null, master: GainNode | null = null, timer: ReturnType<typeof setInterval> | undefined;
let want: Track | null = null, cur: Track | null = null, started = false, step = 0, nextT = 0;
const enabled = () => getProgress().settings.music !== false;

function ensure(): boolean {
  if (typeof window === 'undefined') return false;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  try {
    if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.11; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') void ctx.resume();
    return true;
  } catch { return false; }
}
function voice(f: number, t: number, dur: number, type: OscillatorType, g: number) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator(), a = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(a); a.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function kick(t: number) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator(), a = ctx.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  a.gain.setValueAtTime(0.9, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(a); a.connect(master); o.start(t); o.stop(t + 0.2);
}
function hat(t: number) {
  if (!ctx || !master) return;
  const buf = ctx.createBuffer(1, 441, 44100), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(), a = ctx.createGain();
  s.buffer = buf; a.gain.setValueAtTime(0.25, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  s.connect(a); a.connect(master); s.start(t); s.stop(t + 0.05);
}
function playStep(def: Def, s: number, t: number) {
  const pos = s % 16, off = def.prog[Math.floor(s / 16) % def.prog.length] as number, eighth = 60 / def.bpm / 2;
  const lead = def.lead[pos], bass = def.bass[pos];
  if (lead != null) voice(degreeFreq(def.root * 2, off, lead), t, eighth * 1.6, def.wave, 0.12 * def.gain);
  if (bass != null) voice(def.root / 2 * 2 ** (off / 12), t, eighth * 1.8, 'triangle', 0.5 * def.gain);
  if (def.drums) { if (pos % 4 === 0) kick(t); if (pos % 2 === 1) hat(t); }
}
function schedule() {
  if (!ctx || !cur) return;
  const def = TRACKS[cur], eighth = 60 / def.bpm / 2;
  while (nextT < ctx.currentTime + 0.4) { playStep(def, step, nextT); nextT += eighth; step++; }
}
function stop() { if (timer) clearInterval(timer); timer = undefined; cur = null; }
function apply() {
  if (!started) return;
  if (!enabled() || !want) { stop(); return; }
  if (cur === want && timer) return;
  stop();
  if (!ensure() || !ctx) return;
  cur = want; step = 0; nextT = ctx.currentTime + 0.1;
  timer = setInterval(schedule, 100); schedule();
}
/** Pilih lagu (null = biarkan). */
export function setTrack(t: Track | null) { if (t) { want = t; apply(); } }
/** Dipanggil pada sentuhan pertama pengguna (kebijakan autoplay browser). Aman dipanggil berulang: juga melanjutkan konteks audio yang tertunda. */
export function unlockMusic() { started = true; if (ctx && ctx.state === 'suspended') void ctx.resume(); apply(); }
/** true bila audio sudah diizinkan browser dan sedang berjalan. */
export const audioRunning = () => !!ctx && ctx.state === 'running';
/** Jingle pembuka singkat (arpeggio naik + akor). */
export function playIntro() {
  if (!enabled() || !ensure() || !ctx) return;
  const t = ctx.currentTime + 0.05;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => voice(f, t + i * 0.11, 0.3, 'triangle', 0.9));
  [523.25, 659.25, 783.99].forEach((f) => voice(f, t + 0.52, 1, 'triangle', 0.6));
  kick(t + 0.52);
}
export function refreshMusic() { apply(); }
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend(); else if (started && enabled()) void ctx.resume();
  });
}
