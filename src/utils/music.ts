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

const XF_SONG = 1.0;    // detik: lagu berikutnya masuk saat lagu lama tinggal sekian detik (tumpang-tindih => tanpa jeda). Kecilkan = lebih cepat/rapat.
const XF_SWITCH = 0.35; // detik: fade cepat saat pindah kategori
const XF_FIRST = 0.25;  // detik: fade-in saat musik pertama kali mulai
const MASTER = 0.8;

interface Deck { el: HTMLAudioElement; g: GainNode }
let ctx: AudioContext | null = null, master: GainNode | null = null, decks: Deck[] = [];
let want: Track | null = null, cur: Track | null = null, started = false, act = 0, fails = 0;
let queue: number[] = [], last = -1, timer: ReturnType<typeof setInterval> | undefined;
const enabled = () => getProgress().settings.music !== false;
const volume = () => Math.max(0, Math.min(1, getProgress().settings.musicVol ?? 0.7));
const url = (t: Track, n: number) => `${import.meta.env.BASE_URL}audio/music/${t}-${n}.mp3`;

function ensure(): boolean {
  if (typeof window === 'undefined') return false;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  try {
    if (!ctx) {
      const c = new AC(); const m = c.createGain(); m.connect(c.destination);
      // dua elemen audio bergantian => lagu berikutnya bisa masuk sebelum lagu lama habis (crossfade, tanpa jeda)
      decks = [0, 1].map(() => { const el = new Audio(); el.preload = 'auto'; const g = c.createGain(); g.gain.value = 0; c.createMediaElementSource(el).connect(g); g.connect(m); return { el, g }; });
      ctx = c; master = m;
    }
    master?.gain.setTargetAtTime(MASTER * volume(), ctx.currentTime, 0.05);
    if (ctx.state === 'suspended') void ctx.resume();
    return true;
  } catch { return false; }
}
function fade(d: Deck, to: number, sec: number) {
  if (!ctx) return;
  const t = ctx.currentTime, p = d.g.gain;
  p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(to, t + Math.max(0.02, sec));
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
  if (!ctx || !cur) return;
  const t = cur, from = decks[act] as Deck, ni = 1 - act, to = decks[ni] as Deck;
  to.el.onerror = () => { if (act === ni && cur === t && ++fails <= TRACK_COUNT[t]) advance(0.05); }; // berkas hilang => lompat ke berikutnya
  to.el.onended = () => { if (act === ni && cur === t) advance(0.05); };
  to.el.src = url(t, nextIndex(t));
  to.g.gain.cancelScheduledValues(ctx.currentTime); to.g.gain.setValueAtTime(0, ctx.currentTime);
  try { void to.el.play()?.then(() => { fails = 0; }).catch(() => undefined); } catch { /* abaikan */ }
  fade(to, 1, sec); fade(from, 0, sec);
  act = ni;
  setTimeout(() => { if (decks[act]?.el !== from.el) from.el.pause(); }, sec * 1000 + 80);
}
function watch() {
  if (!ctx || !cur) return;
  const el = (decks[act] as Deck).el, dur = el.duration;
  if (!el.paused && Number.isFinite(dur) && dur > 0 && dur - el.currentTime <= XF_SONG + 0.05) advance(XF_SONG);
}
function kick() { const el = decks[act]?.el; if (cur && el?.src && el.paused && enabled()) void el.play()?.catch(() => undefined); }
function stop() {
  if (timer) clearInterval(timer); timer = undefined; cur = null;
  decks.forEach((d) => { fade(d, 0, 0.25); setTimeout(() => { if (!cur) d.el.pause(); }, 300); });
}
function apply() {
  if (!started) return;
  if (!enabled() || !want) { stop(); return; }
  if (cur === want && timer) { master?.gain.setTargetAtTime(MASTER * volume(), ctx?.currentTime ?? 0, 0.05); kick(); return; }
  if (!ensure() || !ctx) return;
  const first = !cur;
  cur = want; queue = []; fails = 0;
  if (!timer) timer = setInterval(watch, 250);
  advance(first ? XF_FIRST : XF_SWITCH);
  if (first) prime((decks[1 - act] as Deck).el, url(cur, 1));
}
/** Pilih kategori musik (null = biarkan). */
export function setTrack(t: Track | null) { if (t) { want = t; apply(); } }
/** Dipanggil pada sentuhan pertama pengguna (kebijakan autoplay browser). Aman dipanggil berulang. */
export function unlockMusic() { started = true; if (ctx && ctx.state === 'suspended') void ctx.resume(); apply(); kick(); }
export function refreshMusic() { apply(); }
export const audioRunning = () => !!ctx && ctx.state === 'running' && decks[act]?.el.paused === false;
/** Dulu jingle sintetis; kini tidak dipakai (musik utama sudah mp3). Dibiarkan agar pemanggil lama tetap jalan. */
export function playIntro() { /* tidak ada */ }
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) decks.forEach((d) => d.el.pause());
    else if (started && enabled()) decks.forEach((d) => { if (d.g.gain.value > 0.01 && d.el.src) void d.el.play()?.catch(() => undefined); });
  });
}
