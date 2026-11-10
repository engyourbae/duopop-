import { Fragment } from 'react';
import { iconPath } from './Icon';
import { HandArt } from './HandArt';

/** Emoji bawaan perangkat diganti ikon SVG buatan sendiri (konsisten di semua HP, ikut warna & ukuran teks). */
const MAP: Record<string, { i: string; c?: string }> = {
  '✊': { i: 'rock' }, '✌': { i: 'scissors' }, '✋': { i: 'paper' },
  '🔥': { i: 'fire', c: '#f76707' }, '💥': { i: 'boom', c: '#f59f00' }, '👑': { i: 'crown', c: '#f59f00' },
  '🎲': { i: 'dice' }, '🪜': { i: 'ladder' }, '🐍': { i: 'snake', c: '#12b886' }, '❔': { i: 'help' },
  '🏆': { i: 'trophy', c: '#f59f00' }, '🔒': { i: 'lock' }, '🔊': { i: 'sound' }, '📖': { i: 'book' },
  '🎡': { i: 'wheel' }, '🃏': { i: 'cards' }, '✏': { i: 'edit' }, '❌': { i: 'x', c: '#e03131' }, '✕': { i: 'x' },
  '♥': { i: 'heart', c: '#e03131' }, '❤': { i: 'heart', c: '#e03131' },
  '👍': { i: 'thumb', c: '#228be6' }, '😂': { i: 'laugh', c: '#f59f00' }, '😮': { i: 'wow', c: '#f59f00' },
  '👏': { i: 'clap', c: '#f59f00' }, '🎉': { i: 'party', c: '#be4bdb' }, '😭': { i: 'cry', c: '#228be6' },
  '🤔': { i: 'think', c: '#f59f00' }, '😎': { i: 'cool', c: '#f59f00' },
};
const HAND: Record<string, number> = { '✊': 0, '✌': 1, '✋': 2 };
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE = new RegExp(`(${Object.keys(MAP).sort((a, b) => b.length - a.length).map(esc).join('|')})\\ufe0f?`, 'g');

export function Emo({ t }: { t: string }) {
  if (!t) return null;
  const parts = t.split(RE);
  return (
    <>{parts.map((p, i) => {
      if (i % 2 === 0) return <Fragment key={i}>{p}</Fragment>;
      const hk = HAND[p];
      if (hk !== undefined) return <HandArt key={i} kind={hk} className="emo" style={{ width: '1.25em', height: '1.46em', verticalAlign: '-0.3em' }} />;
      const m = MAP[p];
      const d = m ? iconPath(m.i) : undefined;
      if (!m || !d) return <Fragment key={i}>{p}</Fragment>;
      return <svg key={i} className="emo" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={m.c ? { color: m.c } : undefined} aria-hidden="true"><path d={d} /></svg>;
    })}</>
  );
}
