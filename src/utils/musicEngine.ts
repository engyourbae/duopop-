/** Mesin musik latar: lagu bernada TETAP (melodi 8 bar + progresi akor 8 bar yang diulang), bukan nada acak.
 *  Suara lembut (sinus/segitiga + lowpass), amplop halus tanpa klik, drum pelan, jumlah node audio kecil agar tidak pecah di HP. */
export type Track = 'lobi' | 'game' | 'arkade';
export const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);
type Ctx = BaseAudioContext;
interface Chord { b: number; v: number[] }
interface Style { bpm: number; swing: number; root: number; scale: number[]; chords: Chord[]; level: number }
const MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10];
export const STYLES: Record<Track, Style> = {
  // Lobi (C mayor, santai): C – Am – F – G | C – Em – F – G
  lobi: { bpm: 76, swing: 0.12, root: 48, scale: MAJOR, level: 1, chords: [
    { b: 48, v: [60, 64, 67, 71] }, { b: 45, v: [57, 60, 64, 67] }, { b: 41, v: [53, 57, 60, 64] }, { b: 43, v: [55, 59, 62, 65] },
    { b: 48, v: [60, 64, 67, 71] }, { b: 40, v: [52, 55, 59, 62] }, { b: 41, v: [53, 57, 60, 64] }, { b: 43, v: [55, 59, 62, 65] }] },
  // Game (G mayor, riang): G – D – Em – C | G – D – C – D
  game: { bpm: 108, swing: 0.04, root: 55, scale: MAJOR, level: 1, chords: [
    { b: 43, v: [55, 59, 62] }, { b: 50, v: [57, 62, 66] }, { b: 40, v: [55, 59, 64] }, { b: 48, v: [55, 60, 64] },
    { b: 43, v: [55, 59, 62] }, { b: 50, v: [57, 62, 66] }, { b: 48, v: [55, 60, 64] }, { b: 50, v: [57, 62, 66] }] },
  // Arkade (A minor, bersemangat): Am – F – C – G | Am – F – G – Am
  arkade: { bpm: 132, swing: 0, root: 57, scale: MINOR, level: 0.9, chords: [
    { b: 45, v: [57, 60, 64] }, { b: 41, v: [57, 60, 65] }, { b: 48, v: [55, 60, 64] }, { b: 43, v: [55, 59, 62] },
    { b: 45, v: [57, 60, 64] }, { b: 41, v: [57, 60, 65] }, { b: 43, v: [55, 59, 62] }, { b: 45, v: [57, 60, 64] }] },
};
/** Melodi per bar: [langkah 0-15, nada MIDI, panjang (langkah)]. */
type N = [number, number, number];
const MEL: Record<Track, N[][]> = {
  lobi: [
    [[0, 76, 4], [4, 79, 2], [6, 76, 2], [8, 74, 4], [12, 72, 4]],
    [[0, 76, 6], [6, 74, 2], [8, 72, 4], [12, 69, 4]],
    [[0, 69, 4], [4, 72, 4], [8, 77, 4], [12, 76, 4]],
    [[0, 74, 6], [6, 71, 2], [8, 67, 6]],
    [[0, 79, 4], [4, 76, 2], [6, 72, 2], [8, 76, 4], [12, 79, 4]],
    [[0, 79, 6], [6, 76, 2], [8, 74, 4], [12, 71, 4]],
    [[0, 77, 4], [4, 76, 2], [6, 74, 2], [8, 72, 4], [12, 69, 4]],
    [[0, 71, 4], [4, 74, 4], [8, 74, 4], [12, 67, 4]]],
  game: [
    [[0, 71, 2], [2, 74, 2], [4, 79, 4], [8, 78, 2], [10, 74, 2], [12, 71, 4]],
    [[0, 69, 2], [2, 74, 2], [4, 78, 4], [8, 76, 2], [10, 74, 2], [12, 69, 4]],
    [[0, 76, 4], [4, 79, 2], [6, 78, 2], [8, 76, 4], [12, 71, 4]],
    [[0, 72, 2], [2, 76, 2], [4, 79, 4], [8, 76, 4], [12, 74, 4]],
    [[0, 74, 4], [4, 79, 4], [8, 81, 2], [10, 79, 2], [12, 74, 4]],
    [[0, 78, 4], [4, 81, 4], [8, 78, 4], [12, 74, 4]],
    [[0, 76, 4], [4, 72, 2], [6, 76, 2], [8, 79, 4], [12, 76, 4]],
    [[0, 78, 4], [4, 76, 2], [6, 74, 2], [8, 69, 4], [12, 74, 4]]],
  arkade: [
    [[0, 69, 2], [2, 72, 2], [4, 76, 2], [6, 81, 2], [8, 79, 2], [10, 76, 2], [12, 72, 4]],
    [[0, 77, 2], [2, 76, 2], [4, 72, 2], [6, 69, 2], [8, 72, 2], [10, 77, 2], [12, 76, 4]],
    [[0, 76, 2], [2, 79, 2], [4, 79, 2], [6, 76, 2], [8, 74, 2], [10, 72, 2], [12, 76, 4]],
    [[0, 74, 2], [2, 79, 2], [4, 83, 2], [6, 79, 2], [8, 74, 4], [12, 71, 4]],
    [[0, 81, 4], [4, 79, 2], [6, 76, 2], [8, 81, 4], [12, 76, 4]],
    [[0, 81, 2], [2, 79, 2], [4, 77, 4], [8, 72, 2], [10, 77, 2], [12, 69, 4]],
    [[0, 79, 2], [2, 74, 2], [4, 71, 2], [6, 74, 2], [8, 79, 4], [12, 83, 4]],
    [[0, 81, 4], [4, 76, 4], [8, 72, 4], [12, 69, 4]]],
};
const MAPS: Record<Track, Map<number, N>[]> = { lobi: [], game: [], arkade: [] };
(Object.keys(MEL) as Track[]).forEach((t) => { MAPS[t] = MEL[t].map((bar) => new Map(bar.map((n) => [n[0], n] as [number, N]))); });
/** Melodi satu bar (16 langkah): nada MIDI atau null. Berulang tiap 8 bar. */
export function melodyFor(track: Track, bar: number): (number | null)[] {
  const out: (number | null)[] = Array(16).fill(null);
  for (const [p, m] of MEL[track][((bar % 8) + 8) % 8] as N[]) out[p] = m;
  return out;
}

// pola drum 16 langkah (pelan)
const DR = {
  lobi: { k: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, .7, 0, 0, 0, 0, 0], s: [0, 0, 0, 0, .6, 0, 0, 0, 0, 0, 0, 0, .6, 0, 0, 0], h: [.5, 0, .3, 0, .5, 0, .3, 0, .5, 0, .3, 0, .5, 0, .3, 0] },
  pop: { k: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], s: [0, 0, 0, 0, .7, 0, 0, 0, 0, 0, 0, 0, .7, 0, 0, 0], h: [.4, 0, .4, 0, .4, 0, .4, 0, .4, 0, .4, 0, .4, 0, .4, 0] },
  arc: { k: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], s: [0, 0, 0, 0, .7, 0, 0, 0, 0, 0, 0, 0, .7, 0, 0, 0], h: [.4, 0, .3, 0, .4, 0, .3, 0, .4, 0, .3, 0, .4, 0, .3, 0] },
} as const;
const DRUM_OF: Record<Track, keyof typeof DR> = { lobi: 'lobi', game: 'pop', arkade: 'arc' };

export interface Bus { ctx: Ctx; dry: GainNode; rev: GainNode; echo: GainNode; noise: AudioBuffer }
/** Jalur suara ringan: dry, ruang kecil (dua delay pendek) dan echo bertempo. Tanpa convolver. */
export function makeBus(ctx: Ctx, out: AudioNode, bpm: number): Bus {
  const dry = ctx.createGain(); dry.connect(out);
  const rev = ctx.createGain(), roomOut = ctx.createGain(), roomLp = ctx.createBiquadFilter(); roomOut.gain.value = 0.26; roomLp.type = 'lowpass'; roomLp.frequency.value = 2400;
  for (const t of [0.031, 0.053]) { const d = ctx.createDelay(0.2), fb = ctx.createGain(); d.delayTime.value = t; fb.gain.value = 0.25; rev.connect(d); d.connect(fb); fb.connect(d); d.connect(roomLp); }
  roomLp.connect(roomOut); roomOut.connect(out);
  const echo = ctx.createGain(), dl = ctx.createDelay(2), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
  dl.delayTime.value = (60 / bpm) * 0.75; fb.gain.value = 0.24; lp.type = 'lowpass'; lp.frequency.value = 1800;
  echo.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(out);
  const noise = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate)), ctx.sampleRate), nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return { ctx, dry, rev, echo, noise };
}

/** Satu suara: osilator -> lowpass -> amplop halus -> dry (+ send gaung/echo). */
function tone(b: Bus, type: OscillatorType, f: number, t: number, dur: number, vol: number, atk: number, lp: number, wet = 0, echo = 0) {
  const o = b.ctx.createOscillator(), fl = b.ctx.createBiquadFilter(), g = b.ctx.createGain();
  o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = lp; fl.Q.value = 0.4;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, vol), t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dur);
  o.connect(fl); fl.connect(g); g.connect(b.dry);
  if (wet > 0) { const s = b.ctx.createGain(); s.gain.value = wet; g.connect(s); s.connect(b.rev); }
  if (echo > 0) { const s = b.ctx.createGain(); s.gain.value = echo; g.connect(s); s.connect(b.echo); }
  o.start(t); o.stop(t + atk + dur + 0.05);
}
const epiano = (b: Bus, f: number, t: number, dur: number, v: number) => { tone(b, 'sine', f, t, dur, v, 0.012, 3200, 0.3, 0.12); tone(b, 'sine', f * 2, t, dur * 0.4, v * 0.16, 0.008, 3800); };
const bell = (b: Bus, f: number, t: number, dur: number, v: number) => tone(b, 'triangle', f, t, dur, v, 0.006, 2800, 0.25, 0.2);
const softLead = (b: Bus, f: number, t: number, dur: number, v: number) => { tone(b, 'triangle', f, t, dur, v, 0.01, 3200, 0.12, 0.08); tone(b, 'sine', f * 2, t, dur * 0.5, v * 0.12, 0.01, 3500); };
const bass = (b: Bus, f: number, t: number, dur: number, v: number) => tone(b, 'sine', f, t, dur, v, 0.012, 420);
const pad = (b: Bus, notes: number[], t: number, dur: number, v: number) => notes.forEach((n) => tone(b, 'triangle', mtof(n), t, dur * 0.7, v, dur * 0.25, 700, 0.35));
function kick(b: Bus, t: number, v: number) {
  const o = b.ctx.createOscillator(), g = b.ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.1);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(b.dry); o.start(t); o.stop(t + 0.22);
}
function noiseHit(b: Bus, t: number, v: number, type: BiquadFilterType, f: number, d: number) {
  const s = b.ctx.createBufferSource(), g = b.ctx.createGain(), x = b.ctx.createBiquadFilter(); x.type = type; x.frequency.value = f;
  s.buffer = b.noise; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(x); x.connect(g); g.connect(b.dry); s.start(t); s.stop(t + d + 0.03);
}

/** Menjadwalkan semua suara untuk satu langkah 16 per bar pada waktu t0. Deterministik (tanpa nada acak). */
export function scheduleStep(b: Bus, track: Track, step: number, t0: number) {
  const S = STYLES[track], q = 60 / S.bpm / 4, bar = Math.floor(step / 16) % 8, pos = step % 16;
  const t = t0 + (pos % 2 === 1 ? S.swing * q : 0), ch = S.chords[bar] as Chord, d = DR[DRUM_OF[track]], lv = S.level;
  if (d.k[pos]) kick(b, t, (d.k[pos] as number) * 0.55 * lv);
  if (d.s[pos]) noiseHit(b, t, (d.s[pos] as number) * 0.16 * lv, 'bandpass', 1800, 0.12);
  if (d.h[pos]) noiseHit(b, t, (d.h[pos] as number) * 0.05 * lv, 'highpass', 7000, 0.04);
  if (track === 'lobi') {
    if (pos === 0) { pad(b, ch.v, t, q * 16, 0.05); ch.v.forEach((n, i) => epiano(b, mtof(n), t + i * 0.025, q * 6, 0.1)); bass(b, mtof(ch.b), t, q * 7, 0.4); }
    if (pos === 8) bass(b, mtof(ch.b + 7), t, q * 3, 0.25);
    if (pos === 10) ch.v.slice(1).forEach((n) => epiano(b, mtof(n), t, q * 3, 0.06));
  } else if (track === 'game') {
    if (pos === 0) { pad(b, ch.v, t, q * 16, 0.04); bass(b, mtof(ch.b), t, q * 5, 0.38); }
    if (pos === 8) bass(b, mtof(ch.b + 7), t, q * 3, 0.28);
    if (pos === 12) bass(b, mtof(ch.b), t, q * 3, 0.26);
    if (pos % 4 === 2) bell(b, mtof((ch.v[(pos >> 2) % ch.v.length] as number) + 12), t, q * 2, 0.07);
  } else {
    if (pos % 2 === 0) bell(b, mtof((ch.v[(pos >> 1) % 3] as number) + 12), t, q * 1.6, 0.06);
    if (pos % 4 === 0) bass(b, mtof(ch.b), t, q * 3, 0.36);
    if (pos % 4 === 2) bass(b, mtof(ch.b + 12), t, q * 1.5, 0.2);
    if (pos === 0) pad(b, ch.v, t, q * 16, 0.03);
  }
  const n = (MAPS[track][bar] as Map<number, N>).get(pos);
  if (n) {
    const f = mtof(n[1]), dur = n[2] * q * 1.1;
    if (track === 'lobi') epiano(b, f, t, dur, 0.3); else if (track === 'game') bell(b, f, t, dur, 0.26); else softLead(b, f, t, dur, 0.22);
  }
}
/** Jingle pembuka: arpeggio C mayor yang lembut + akor hangat. */
export function introFanfare(b: Bus, t: number) {
  [72, 76, 79, 84].forEach((m, i) => bell(b, mtof(m), t + i * 0.11, 0.9, 0.3));
  pad(b, [60, 64, 67, 71], t + 0.3, 1.6, 0.06); [72, 76, 79].forEach((m) => epiano(b, mtof(m), t + 0.45, 1.2, 0.18)); bass(b, mtof(48), t + 0.35, 1.3, 0.4);
}
