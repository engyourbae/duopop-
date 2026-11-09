import { getProgress } from '../features/progression/store';
import type { GameGroup } from '../types';

/** Musik latar memakai berkas mp3 buatanmu di public/audio/music/<kategori>-<nomor>.mp3 (nomor mulai dari 1). */
export type Track = 'utama' | 'cozy' | 'party' | 'quiz' | 'board';
/** Jumlah berkas tiap kategori. Ubah angka ini bila kamu menambah/mengurangi mp3. */
export const TRACK_COUNT: Record<Track, number> = { utama: 4, cozy: 7, party: 2, quiz: 3, board: 3 };

/** Kategori musik untuk sebuah game. */
export function trackForGame(g: { group: GameGroup; mechanic?: string }): Track {
  if (g.group === 'kartu' || g.mechanic === 'tictactoe' || g.mechanic === 'connect4') return 'board';
  if (g.group === 'pengetahuan') return 'quiz';
  if (g.group === 'pasangan') return 'cozy';
  return 'party'; // grup & arkade
}

const XF_SWITCH = 0.35; // detik: fade cepat saat pindah kategori
const XF_FIRST = 0.25;  // detik: fade-in saat musik pertama kali mulai
const MASTER = 0.8;
const FADE_MS = 30;     // langkah fade pada mode langsung

/**
 * Dua mode putar:
 * - LANGSUNG (Android, desktop): mp3 diputar langsung oleh pemutar bawaan perangkat (dekoder perangkat keras) tanpa melewati Web Audio.
 *   Ini yang paling bersih di HP kelas bawah: tidak ada resampling/buffer Web Audio yang bisa memunculkan bunyi kresek-kresek.
 * - WEB AUDIO (iPhone/iPad): iOS tidak mengizinkan volume elemen audio diubah, jadi lewat graf Web Audio dengan buffer besar (latencyHint 'playback').
 */
interface Deck { el: HTMLAudioElement; g: GainNode | null; f: number; to: number; rate: number }
let ctx: AudioContext | null = null, master: GainNode | null = null, decks: Deck[] = [];
let want: Track | null = null, cur: Track | null = null, started = false, act = 0, fails = 0;
let queue: number[] = [], last = -1, timer: ReturnType<typeof setInterval> | undefined;
let fadeTimer: ReturnType<typeof setInterval> | undefined, lastTick = 0;
const enabled = () => getProgress().settings.music !== false;
const volume = () => Math.max(0, Math.min(1, getProgress().settings.musicVol ?? 0.7));
const level = () => MASTER * volume();
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const url = (t: Track, n: number) => `${import.meta.env.BASE_URL}audio/music/${t}-${n}.mp3`;
const isIOS = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
const audible = (d: Deck) => (d.g ? d.g.gain.value > 0.01 : d.f > 0.01);

function ensure(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (!decks.length) {
      if (isIOS()) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return false;
        let c: AudioContext;
        try { c = new AC({ latencyHint: 'playback' }); } catch { c = new AC(); } // buffer besar = tidak putus-putus
        const m = c.createGain();
        // penghalus suara: redam treble yang cempreng di speaker HP, lalu kompresor sangat lembut mencegah pecah
        const shelf = c.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 5000; shelf.gain.value = -3;
        const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 24; comp.ratio.value = 2; comp.attack.value = 0.03; comp.release.value = 0.3;
        m.connect(shelf); shelf.connect(comp); comp.connect(c.destination);
        decks = [0, 1].map(() => { const el = new Audio(); el.preload = 'auto'; const g = c.createGain(); g.gain.value = 0; c.createMediaElementSource(el).connect(g); g.connect(m); return { el, g, f: 0, to: 0, rate: 0 }; });
        ctx = c; master = m;
      } else {
        // dua elemen audio bergantian => lagu berikutnya bisa masuk sebelum lagu lama habis (crossfade, tanpa jeda)
        decks = [0, 1].map(() => { const el = new Audio(); el.preload = 'auto'; el.volume = 0; return { el, g: null, f: 0, to: 0, rate: 0 }; });
      }
    }
    applyLevel();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    return true;
  } catch { return false; }
}
function applyLevel() {
  if (ctx && master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.05);
  else for (const d of decks) if (!d.g) d.el.volume = clamp01(d.f * level());
}
function tickFade() {
  const now = performance.now(), dt = Math.min(0.2, (now - lastTick) / 1000); lastTick = now;
  let busy = false;
  for (const d of decks) {
    if (d.g || d.f === d.to) continue;
    d.f += d.rate * dt;
    if ((d.rate > 0 && d.f >= d.to) || (d.rate < 0 && d.f <= d.to)) d.f = d.to; else busy = true;
    d.el.volume = clamp01(d.f * level());
  }
  if (!busy && fadeTimer) { clearInterval(fadeTimer); fadeTimer = undefined; }
}
function fade(d: Deck, to: number, sec: number) {
  const s = Math.max(0.02, sec);
  if (d.g && ctx) { const t = ctx.currentTime, p = d.g.gain; p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(to, t + s); return; }
  d.to = to; d.rate = (to - d.f) / s;
  if (!fadeTimer) { lastTick = performance.now(); fadeTimer = setInterval(tickFade, FADE_MS); }
}
/** Acak urutan lagu satu kategori; tidak mengulang lagu yang sama berturut-turut. */
function nextIndex(t: Track): number {
  if (!queue.length) {
    queue = Array.from({ length: TRACK_COUNT[t] }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    if (queue.length > 1 && queue[0] === last) queue.push(queue.shift() as number);
  }
  last = queue.shift() as number;
  return last;
}
/** Pancing elemen audio saat ada sentuhan pengguna supaya iOS mengizinkan ia berbunyi nanti tanpa sentuhan. */
function prime(el: HTMLAudioElement, src: string) {
  try { el.src = src; void el.play()?.then(() => { if (decks[act]?.el !== el) el.pause(); }).catch(() => undefined); } catch { /* abaikan */ }
}
/** Masukkan lagu berikutnya (crossfade `sec` detik) dan keluarkan lagu lama. */
function advance(sec: number) {
  if (!decks.length || !cur) return;
  const t = cur, from = decks[act] as Deck, ni = 1 - act, to = decks[ni] as Deck;
  to.el.onerror = () => { if (act === ni && cur === t && ++fails <= TRACK_COUNT[t]) advance(0.05); }; // berkas hilang => lompat ke berikutnya
  to.el.onended = () => { if (act === ni && cur === t) advance(0.05); };
  to.el.src = url(t, nextIndex(t));
  if (to.g && ctx) { to.g.gain.cancelScheduledValues(ctx.currentTime); to.g.gain.setValueAtTime(0, ctx.currentTime); }
  else { to.f = 0; to.to = 0; to.el.volume = 0; }
  try { void to.el.play()?.then(() => { fails = 0; }).catch(() => undefined); } catch { /* abaikan */ }
  fade(to, 1, sec); fade(from, 0, sec);
  act = ni;
  setTimeout(() => { if (decks[act]?.el !== from.el) from.el.pause(); }, sec * 1000 + 80);
}
/** Tanpa tumpang-tindih dua lagu: dua dekoder sekaligus bikin HP kelas bawah kresek-kresek. Lagu berikutnya baru jalan setelah lagu lama selesai. */
function watch() {
  if (!decks.length || !cur) return;
  const el = (decks[act] as Deck).el;
  if (el.ended) advance(0.05);
}
function kick() { const el = decks[act]?.el; if (cur && el?.src && el.paused && enabled()) void el.play()?.catch(() => undefined); }
function stop() {
  if (timer) clearInterval(timer); timer = undefined; cur = null;
  decks.forEach((d) => { fade(d, 0, 0.25); setTimeout(() => { if (!cur) d.el.pause(); }, 300); });
}
function apply() {
  if (!started) return;
  if (!enabled() || !want) { stop(); return; }
  if (cur === want && timer) { applyLevel(); kick(); return; }
  if (!ensure()) return;
  const first = !cur;
  cur = want; queue = []; fails = 0;
  if (!timer) timer = setInterval(watch, 250);
  advance(first ? XF_FIRST : XF_SWITCH);
  if (first && ctx) prime((decks[1 - act] as Deck).el, url(cur, 1)); // hanya iOS; di Android tidak perlu dan menambah beban dekoder
}
/** Pilih kategori musik (null = biarkan). */
export function setTrack(t: Track | null) { if (t) { want = t; apply(); } }
/** Dipanggil pada sentuhan pertama pengguna (kebijakan autoplay browser). Aman dipanggil berulang. */
export function unlockMusic() { started = true; if (ctx && ctx.state === 'suspended') void ctx.resume(); apply(); kick(); }
export function refreshMusic() { apply(); }
export const audioRunning = () => decks.length > 0 && (!ctx || ctx.state === 'running') && decks[act]?.el.paused === false;
/** Dulu jingle sintetis; kini tidak dipakai (musik utama sudah mp3). Dibiarkan agar pemanggil lama tetap jalan. */
export function playIntro() { /* tidak ada */ }
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!decks.length) return;
    if (document.hidden) decks.forEach((d) => d.el.pause());
    else if (started && enabled()) decks.forEach((d) => { if (audible(d) && d.el.src) void d.el.play()?.catch(() => undefined); });
  });
}
