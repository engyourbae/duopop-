import { rng, seedFrom } from './rng';

/** Mesin musik prosedural: akor sungguhan, beberapa instrumen, gaung + echo, drum berayun, dan melodi yang berubah tiap putaran. */
export type Track = 'lobi' | 'game' | 'arkade';
export const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);
type Ctx = BaseAudioContext;
interface Style {
  bpm: number; swing: number; root: number; chords: number[][]; scale: number[]; leadOct: number;
  drums: 'lofi' | 'pop' | 'arc'; rhythms: number[][]; rest: number; leadProb: number; level: number;
}
export const STYLES: Record<Track, Style> = {
  // Lo-fi santai: Cmaj7 – Am7 – Dm7 – G7
  lobi: { bpm: 80, swing: 0.22, root: 48, chords: [[0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]], scale: [0, 2, 4, 7, 9], leadOct: 24, drums: 'lofi',
    rhythms: [[0, 6, 10], [2, 8, 11], [0, 3, 6, 12], [4, 10, 14]], rest: 0.25, leadProb: 0.55, level: 1 },
  // Pop riang: G – D – Em – C
  game: { bpm: 116, swing: 0.07, root: 55, chords: [[0, 4, 7], [7, 11, 14], [4, 7, 11], [5, 9, 12]], scale: [0, 2, 4, 7, 9], leadOct: 24, drums: 'pop',
    rhythms: [[0, 3, 6, 8, 10, 12], [2, 4, 8, 11, 14], [0, 4, 6, 10, 12, 14]], rest: 0.15, leadProb: 0.7, level: 0.9 },
  // Arkade cepat: Am – F – C – G
  arkade: { bpm: 148, swing: 0, root: 57, chords: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]], scale: [0, 3, 5, 7, 10], leadOct: 24, drums: 'arc',
    rhythms: [[0, 2, 4, 6, 8, 10, 12, 14], [0, 3, 6, 8, 11, 14], [0, 2, 3, 6, 8, 10, 11, 14]], rest: 0.1, leadProb: 0.85, level: 0.85 },
};
const DR = {
  lofi: { k: [1, 0, 0, 0, 0, 0, 0, .55, 0, 0, .8, 0, 0, 0, 0, 0], s: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, .25], h: [.5, 0, .3, 0, .5, 0, .3, .15, .5, 0, .3, 0, .5, 0, .3, .15] },
  pop: { k: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, .4, 1, 0, 0, 0], s: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], h: [0, 0, .6, 0, 0, 0, .6, 0, 0, 0, .6, 0, 0, 0, .6, .3] },
  arc: { k: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, .6, 1, 0, 0, 0], s: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, .5, 0], h: [.4, .2, .4, .2, .4, .2, .4, .2, .4, .2, .4, .2, .4, .2, .4, .35] },
} as const;

export interface Bus { ctx: Ctx; dry: GainNode; rev: GainNode; echo: GainNode; noise: AudioBuffer; melodies: Map<string, (number | null)[]> }
/** Membuat jalur suara ringan: dry, ruang kecil (dua delay pendek), dan echo bertempo. Tanpa convolver agar tidak membebani CPU HP. */
export function makeBus(ctx: Ctx, out: AudioNode, bpm: number): Bus {
  const dry = ctx.createGain(); dry.connect(out);
  const rev = ctx.createGain(), roomOut = ctx.createGain(), roomLp = ctx.createBiquadFilter(); roomOut.gain.value = 0.3; roomLp.type = 'lowpass'; roomLp.frequency.value = 2600;
  for (const t of [0.029, 0.047]) { const d = ctx.createDelay(0.2), fb = ctx.createGain(); d.delayTime.value = t; fb.gain.value = 0.28; rev.connect(d); d.connect(fb); fb.connect(d); d.connect(roomLp); }
  roomLp.connect(roomOut); roomOut.connect(out);
  const echo = ctx.createGain(), dl = ctx.createDelay(2), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
  dl.delayTime.value = (60 / bpm) * 0.75; fb.gain.value = 0.28; lp.type = 'lowpass'; lp.frequency.value = 2200;
  echo.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(out);
  const noise = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate)), ctx.sampleRate), nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return { ctx, dry, rev, echo, noise, melodies: new Map() };
}
const send = (b: Bus, src: AudioNode, dry: number, rev: number, echo: number) => {
  for (const [lvl, dst] of [[dry, b.dry], [rev, b.rev], [echo, b.echo]] as const) if (lvl > 0) { const g = b.ctx.createGain(); g.gain.value = lvl; src.connect(g); g.connect(dst); }
};
const adsr = (g: GainNode, t: number, a: number, peak: number, dur: number) => {
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
};
const osc = (b: Bus, type: OscillatorType, f: number, t: number, dur: number, detune = 0): OscillatorNode => {
  const o = b.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune; o.start(t); o.stop(t + dur + 0.1); return o;
};
const filter = (b: Bus, type: BiquadFilterType, f: number, q = 0.7) => { const x = b.ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; };

/** Piano elektrik hangat: sinus + overtone bel singkat. */
function epiano(b: Bus, f: number, t: number, dur: number, v: number) {
  const g = b.ctx.createGain(), lp = filter(b, 'lowpass', 2600); adsr(g, t, 0.008, v * 0.45, dur * 1.1);
  for (const [mul, lvl, d] of [[1, 1, dur * 1.1], [2, 0.22, dur * 0.6]] as const) { const o = osc(b, 'sine', f * mul, t, d), og = b.ctx.createGain(); og.gain.value = lvl; o.connect(og); og.connect(lp); }
  lp.connect(g); send(b, g, 0.9, 0.3, 0.1);
}
function pad(b: Bus, freqs: number[], t: number, dur: number, v: number) {
  for (const f of freqs) {
    const g = b.ctx.createGain(), lp = filter(b, 'lowpass', 900); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 0.06), t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.05);
    osc(b, 'triangle', f, t, dur * 1.05, -5).connect(lp); osc(b, 'sine', f, t, dur * 1.05, 5).connect(lp);
    lp.connect(g); send(b, g, 0.6, 0.4, 0);
  }
}
function pluck(b: Bus, f: number, t: number, v: number, dur = 0.38) {
  const g = b.ctx.createGain(), lp = filter(b, 'lowpass', 2800, 0.9); lp.frequency.setValueAtTime(2800, t); lp.frequency.exponentialRampToValueAtTime(450, t + 0.28);
  adsr(g, t, 0.005, v * 0.36, dur); osc(b, 'triangle', f, t, dur).connect(lp); lp.connect(g); send(b, g, 0.85, 0.2, 0.22);
}
function pulse(b: Bus, f: number, t: number, dur: number, v: number) {
  const g = b.ctx.createGain(), lp = filter(b, 'lowpass', 2300); adsr(g, t, 0.004, v * 0.14, dur); osc(b, 'square', f, t, dur).connect(lp); lp.connect(g); send(b, g, 0.95, 0.06, 0.08);
}
function bass(b: Bus, f: number, t: number, dur: number, v: number) {
  const g = b.ctx.createGain(), lp = filter(b, 'lowpass', 520); adsr(g, t, 0.008, v * 0.55, dur); osc(b, 'sine', f, t, dur).connect(lp); osc(b, 'triangle', f, t, dur).connect(lp); lp.connect(g); send(b, g, 1, 0.04, 0);
}
function kick(b: Bus, t: number, v: number) {
  const o = osc(b, 'sine', 150, t, 0.2), g = b.ctx.createGain(); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); send(b, g, 1, 0, 0);
}
function noiseHit(b: Bus, t: number, v: number, type: BiquadFilterType, f: number, d: number, rev = 0) {
  const s = b.ctx.createBufferSource(), g = b.ctx.createGain(), x = filter(b, type, f, type === 'bandpass' ? 0.9 : 0.7);
  s.buffer = b.noise; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(x); x.connect(g); s.start(t); s.stop(t + d + 0.05); send(b, g, 1, rev, 0);
}
function snare(b: Bus, t: number, v: number) { noiseHit(b, t, v * 0.32, 'bandpass', 1700, 0.13, 0.15); const o = osc(b, 'triangle', 190, t, 0.1), g = b.ctx.createGain(); g.gain.setValueAtTime(v * 0.28, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); o.connect(g); send(b, g, 1, 0.08, 0); }

const scaleNotes = (root: number, scale: number[]) => [-12, 0, 12, 24].flatMap((o) => scale.map((s) => root + o + s)).sort((a, b) => a - b);
/** Melodi satu bar (16 langkah), deterministik per (lagu, bar) — berbeda tiap bar dan tiap putaran. */
export function melodyFor(track: Track, bar: number): (number | null)[] {
  const S = STYLES[track], r = rng(seedFrom(`${track}:${bar}`)), chord = S.chords[bar % S.chords.length] as number[];
  const notes = scaleNotes(S.root + S.leadOct, S.scale), out: (number | null)[] = Array(16).fill(null);
  const target = S.root + S.leadOct + (chord[Math.floor(r() * chord.length)] as number);
  let idx = 0; notes.forEach((n, i) => { if (Math.abs(n - target) < Math.abs((notes[idx] as number) - target)) idx = i; });
  const pat = S.rhythms[Math.floor(r() * S.rhythms.length)] as number[], steps = [-2, -1, -1, 0, 1, 1, 2];
  pat.forEach((st, k) => { if (k > 0 && r() < S.rest) return; out[st] = notes[idx] as number; idx = Math.max(0, Math.min(notes.length - 1, idx + (steps[Math.floor(r() * steps.length)] as number))); });
  return out;
}
/** Menjadwalkan semua suara untuk satu langkah 16 per ketukan pada waktu t. */
export function scheduleStep(b: Bus, track: Track, step: number, t0: number) {
  const S = STYLES[track], q = 60 / S.bpm / 4, bar = Math.floor(step / 16), pos = step % 16, chord = S.chords[bar % S.chords.length] as number[];
  const loop = Math.floor(bar / S.chords.length), sectionB = Math.floor(loop / 2) % 2 === 1;
  const hr = rng(seedFrom(`${track}:h:${step}`)), t = t0 + (pos % 2 === 1 ? S.swing * q : 0) + (hr() - 0.5) * 0.012, vel = (x: number) => x * (0.85 + hr() * 0.3) * S.level;
  const d = DR[S.drums], notesOf = (oct = 0) => chord.map((c) => mtof(S.root + c + oct));
  if (d.k[pos]) kick(b, t, vel(d.k[pos] as number) * 0.85);
  if (d.s[pos]) snare(b, t, vel(d.s[pos] as number));
  if (d.h[pos]) noiseHit(b, t, vel(d.h[pos] as number) * 0.13, 'bandpass', S.drums === 'lofi' ? 5200 : 6200, S.drums === 'arc' ? 0.035 : 0.045);
  const bassF = mtof(S.root + (chord[0] as number) - 12);
  if (track === 'lobi') {
    if (pos === 0) { pad(b, notesOf(0), t, q * 16, 0.9); chord.forEach((c, i) => epiano(b, mtof(S.root + c + 12), t + i * 0.018, q * 7, vel(0.5))); bass(b, bassF, t, q * 6, vel(0.9)); }
    if (pos === 10 && hr() > 0.3) { chord.slice(1).forEach((c) => epiano(b, mtof(S.root + c + 12), t, q * 3, vel(0.28))); bass(b, bassF * 1.5, t, q * 2, vel(0.6)); }
  } else if (track === 'game') {
    if (pos === 0) pad(b, notesOf(0), t, q * 16, 0.7);
    if (pos % 2 === 0) { const arp = [0, 1, 2, 1][(pos / 2) % 4] as number; pluck(b, mtof(S.root + (chord[arp % chord.length] as number) + 12), t, vel(0.34), 0.3); }
    if (pos === 0 || pos === 8 || pos === 12) bass(b, pos === 12 ? bassF * 1.5 : bassF, t, q * 3, vel(0.9));
  } else {
    const arp = [0, 1, 2, 1][pos % 4] as number; pulse(b, mtof(S.root + (chord[arp % chord.length] as number) + (pos % 8 >= 4 ? 24 : 12)), t, q * 0.9, vel(0.34));
    if (pos % 2 === 0) bass(b, pos % 4 === 2 ? bassF * 2 : bassF, t, q * 1.6, vel(0.8));
  }
  const key = `${track}:${bar}`; let mel = b.melodies.get(key);
  if (!mel) { mel = melodyFor(track, bar); b.melodies.set(key, mel); if (b.melodies.size > 8) b.melodies.delete(b.melodies.keys().next().value as string); }
  const n = mel[pos];
  if (n != null && (sectionB || hr() < S.leadProb * 0.35)) { if (track === 'lobi') epiano(b, mtof(n), t, q * 3, vel(0.34)); else if (track === 'game') pluck(b, mtof(n), t, vel(0.5), 0.45); else pulse(b, mtof(n + 12), t, q * 1.5, vel(0.55)); }
}
/** Jingle pembuka: arpeggio naik berkilau + akor hangat. */
export function introFanfare(b: Bus, t: number) {
  [72, 76, 79, 83, 86].forEach((m, i) => pluck(b, mtof(m), t + i * 0.085, 1, 0.9));
  pad(b, [60, 64, 67, 71].map(mtof), t + 0.4, 1.6, 1.2); [72, 76, 79].forEach((m) => epiano(b, mtof(m), t + 0.45, 1.4, 0.9)); bass(b, mtof(48), t + 0.4, 1.4, 1); kick(b, t + 0.42, 0.7);
}
