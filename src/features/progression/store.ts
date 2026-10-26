import { useSyncExternalStore } from 'react';
import type { GameResult } from '../../types';
import { levelInfo } from '../games/engine';
import { todayKey } from '../../utils/rng';

export interface Settings { music: boolean; musicVol: number; pause: number; sound: boolean; animations: boolean; theme: 'terang' | 'gelap' | 'sistem'; shareProfile: boolean; showOnline: boolean }
export interface Progress {
  name: string; xp: number; xpToday: { date: string; amount: number };
  history: GameResult[]; seen: string[]; badges: string[];
  streak: { last: string | null; count: number; best: number }; dailyDone: string | null;
  onboarded: boolean; theme: string; settings: Settings;
  seenQ: string[]; levels: Record<string, number>;
}
export const DAILY_XP_CAP = 600;
export const BADGES: { id: string; title: string; desc: string; test: (p: Progress) => boolean }[] = [
  { id: 'pemula', title: 'Langkah Pertama', desc: 'Selesaikan 1 permainan.', test: (p) => p.history.length >= 1 },
  { id: 'rajin', title: 'Rajin Bermain', desc: 'Selesaikan 10 permainan.', test: (p) => p.history.length >= 10 },
  { id: 'sempurna', title: 'Sempurna!', desc: 'Jawab semua benar dalam satu permainan (min. 5 soal).', test: (p) => p.history.some((h) => h.total >= 5 && h.correct === h.total) },
  { id: 'streak3', title: 'Streak 3 Hari', desc: 'Main tantangan harian 3 hari beruntun.', test: (p) => p.streak.best >= 3 },
  { id: 'streak7', title: 'Streak 7 Hari', desc: 'Main tantangan harian 7 hari beruntun.', test: (p) => p.streak.best >= 7 },
  { id: 'level5', title: 'Level 5', desc: 'Capai level 5.', test: (p) => levelInfo(p.xp).level >= 5 },
  { id: 'serbabisa', title: 'Serba Bisa', desc: 'Mainkan 5 jenis game berbeda.', test: (p) => new Set(p.history.map((h) => h.gameId)).size >= 5 },
  { id: 'pasangan', title: 'Pasangan Kompak', desc: 'Mainkan 3 game pasangan.', test: (p) => p.history.filter((h) => ['howwell', 'thisorthat', 'matchmy', 'predict', 'lovelang', 'memory', 'deeptalk', 'likely'].includes(h.gameId)).length >= 3 },
];
export const THEMES = [
  { id: 'biru', name: 'Biru Tinta', color: '#2a4bff', min: 1 }, { id: 'merah', name: 'Merah Tomat', color: '#e0401f', min: 2 },
  { id: 'hijau', name: 'Hijau Daun', color: '#0f8f5f', min: 3 }, { id: 'jingga', name: 'Jingga Jeruk', color: '#d9610c', min: 5 },
];
const KEY = 'duopop:v1';
const fresh = (): Progress => ({
  name: '', xp: 0, xpToday: { date: todayKey(), amount: 0 }, history: [], seen: [], badges: [], streak: { last: null, count: 0, best: 0 },
  dailyDone: null, seenQ: [], levels: {}, onboarded: false, theme: 'biru', settings: { music: true, musicVol: 0.55, pause: 6, sound: true, animations: true, theme: 'sistem', shareProfile: true, showOnline: true },
});
function load(): Progress {
  try { const raw = localStorage.getItem(KEY); if (raw) return { ...fresh(), ...(JSON.parse(raw) as Partial<Progress>) }; } catch { /* abaikan */ }
  return fresh();
}
let state = load();
const subs = new Set<() => void>();
function commit(next: Progress) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* penyimpanan penuh/diblokir */ }
  subs.forEach((f) => f());
}
export const getProgress = () => state;
export function useProgress(): Progress { return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => state); }
export function patchProgress(p: Partial<Progress>) { commit({ ...state, ...p }); }
export function patchSettings(s: Partial<Settings>) { commit({ ...state, settings: { ...state.settings, ...s } }); }
/** Menandai soal yang sudah dilihat agar soal baru didahulukan pada sesi berikutnya. */
export function markSeen(ids: string[]) { commit({ ...state, seenQ: [...new Set([...state.seenQ, ...ids])].slice(-3000) }); }
/** Level tertinggi yang lulus per game (membuka level berikutnya). */
export function unlockLevel(gameId: string, level: number) { if ((state.levels[gameId] ?? 0) >= level) return; commit({ ...state, levels: { ...state.levels, [gameId]: level } }); }
export function resetProgress() { commit(fresh()); }

/** Mencatat hasil sesi. XP hanya diberikan sekali per sessionId dan dibatasi per hari. Mengembalikan XP yang diberikan. */
export function recordResult(r: GameResult, now = new Date()): { xp: number; newBadges: string[] } {
  if (state.seen.includes(r.sessionId)) return { xp: 0, newBadges: [] };
  const date = todayKey(now);
  const today = state.xpToday.date === date ? state.xpToday : { date, amount: 0 };
  const xp = Math.max(0, Math.min(r.xp, DAILY_XP_CAP - today.amount));
  const next: Progress = {
    ...state, xp: state.xp + xp, xpToday: { date, amount: today.amount + xp },
    seen: [...state.seen, r.sessionId].slice(-300), history: [{ ...r, xp }, ...state.history].slice(0, 100),
  };
  const have = new Set(next.badges);
  const newBadges = BADGES.filter((b) => !have.has(b.id) && b.test(next)).map((b) => b.id);
  next.badges = [...next.badges, ...newBadges];
  commit(next);
  return { xp, newBadges };
}
/** Klaim tantangan harian: sekali sehari, streak naik bila kemarin juga main. */
export function claimDaily(now = new Date()): boolean {
  const today = todayKey(now);
  if (state.dailyDone === today) return false;
  const y = new Date(now); y.setDate(y.getDate() - 1);
  const count = state.streak.last === todayKey(y) ? state.streak.count + 1 : 1;
  const next: Progress = { ...state, dailyDone: today, streak: { last: today, count, best: Math.max(state.streak.best, count) } };
  const newBadges = BADGES.filter((b) => !next.badges.includes(b.id) && b.test(next)).map((b) => b.id);
  next.badges = [...next.badges, ...newBadges];
  commit(next);
  return true;
}
