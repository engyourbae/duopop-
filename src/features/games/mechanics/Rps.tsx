import { Fragment, useEffect, useRef, useState } from 'react';
import { Button, ProgressBar } from '../../../components/ui';
import { sfx } from '../../../utils/sound';
import { rpsOutcome } from '../logic';
import { Scoreboard } from './Quiz';
import { Cover } from './Social';
import type { MechProps } from './types';
import { Emo } from '../../../components/Emo';
import { HandArt } from '../../../components/HandArt';

export const HANDS = [{ e: '✊', n: 'Batu' }, { e: '✌️', n: 'Gunting' }, { e: '✋', n: 'Kertas' }] as const;
const COUNT_TEXT = ['Siap…', 'Batu!', 'Gunting!', 'Kertas!'];
const TAG = { win: '👑 MENANG', lose: 'Kalah', draw: 'Seri', none: 'Tidak memilih' } as const;

/**
 * Adu tangan: kepalan bergoyang tiga kali (Batu… Gunting… Kertas…), lalu semua tangan terbuka bersamaan.
 * Dipakai di mode lokal dan ruang online. Ketuk area tangan untuk melewati animasi.
 */
export function RpsArena({ names, picks, streaks, onReveal }: { names: string[]; picks: (number | undefined)[]; streaks?: number[]; onReveal?: () => void }) {
  const [beat, setBeat] = useState(0); // 0 siap, 1-3 hitungan, 4 terbuka
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { status } = rpsOutcome(picks);
  const anyWin = status.includes('win');
  useEffect(() => {
    timers.current = [250, 800, 1350, 1900].map((ms, k) => setTimeout(() => {
      setBeat((b) => (b >= 4 ? b : Math.max(b, k + 1)));
      if (k < 3) sfx.tick(); else if (anyWin) sfx.win(); else sfx.reveal();
    }, ms));
    return () => timers.current.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (beat === 4) onReveal?.(); }, [beat]); // eslint-disable-line react-hooks/exhaustive-deps
  const skip = () => { if (beat >= 4) return; timers.current.forEach(clearTimeout); setBeat(4); if (anyWin) sfx.win(); else sfx.reveal(); };
  const shown = beat >= 4;
  const two = names.length === 2;
  const winners = names.filter((_, i) => status[i] === 'win');
  const answered = status.filter((s) => s !== 'none').length;
  return (
    <div>
      <div className="rps-count" key={beat} aria-live="polite"><Emo t={shown ? 'SUIT! 💥' : (COUNT_TEXT[beat] ?? '')} /></div>
      <div className={`rps-stage ${two ? 'two' : ''}`} onClick={skip} role="presentation">
        {names.map((nm, i) => {
          const st = status[i] ?? 'none';
          const pick = picks[i];
          const hand = shown ? (pick === undefined ? -1 : pick) : 0;
          const streak = (streaks?.[i] ?? 0) + 1;
          return (
            <Fragment key={i}>
              {two && i === 1 && <div className="rps-vs">VS</div>}
              <div className={`rps-card ${shown ? st : ''}`}>
                <div className="rps-name">{nm}</div>
                <span className={`rps-flip ${two && i === 1 ? 'mirror' : ''}`}>
                  <span key={shown ? 'p' : 's'} className={`rps-hand ${shown ? 'pop' : 'shake'}`} style={{ animationDelay: shown ? '0s' : `${i * 0.08}s` }} aria-label={shown && pick !== undefined ? HANDS[pick]?.n : undefined}><HandArt kind={hand} px={96} /></span>
                </span>
                <div className="rps-pname">{shown && pick !== undefined ? HANDS[pick]?.n : ''}</div>
                <div className="rps-tag"><Emo t={shown ? `${TAG[st]}${st === 'win' && streak >= 2 ? ` · 🔥${streak}` : ''}` : ''} /></div>
              </div>
            </Fragment>
          );
        })}
      </div>
      {!shown && <p className="center muted small">Ketuk untuk lewati animasi</p>}
      {shown && <div className={`expl rps-banner ${winners.length ? '' : 'bad'}`}><b>{winners.length ? `${winners.join(' & ')} menang ronde ini!` : answered < 2 ? 'Menunggu pemain lain memilih.' : 'Seri! Semua imbang, ulangi di ronde berikutnya.'}</b></div>}
    </div>
  );
}

/** Suit lokal 2–8 pemain: pilih bergantian (layar ditutup), lalu adu tangan beranimasi. */
export function RpsMech({ players, count, onDone }: MechProps) {
  const [round, setRound] = useState(0);
  const [voter, setVoter] = useState(0);
  const [covered, setCovered] = useState(true);
  const [picks, setPicks] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [streaks, setStreaks] = useState<number[]>(() => players.map(() => 0));
  const [decisive, setDecisive] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const revealing = picks.length === players.length;
  const out = revealing ? rpsOutcome(picks) : null;
  const shownScores = revealed && out ? scores.map((v, k) => v + (out.pts[k] ?? 0)) : scores;
  const choose = (c: number) => { sfx.tick(); setPicks([...picks, c]); setVoter(voter + 1); setCovered(true); };
  const next = () => {
    if (!out) return;
    const ns = scores.map((v, k) => v + (out.pts[k] ?? 0));
    const nd = decisive + (out.status.includes('win') ? 1 : 0);
    if (round + 1 >= count) { onDone({ scores: ns, correct: nd, total: count, headline: `${nd} dari ${count} ronde ada pemenangnya` }); return; }
    setStreaks(streaks.map((s, k) => (out.status[k] === 'win' ? s + 1 : out.status[k] === 'draw' ? s : 0)));
    setScores(ns); setDecisive(nd); setRound(round + 1); setVoter(0); setCovered(true); setPicks([]); setRevealed(false);
  };
  return (
    <div>
      <ProgressBar value={round / count} />
      <p className="muted small gap">Ronde {round + 1}/{count}</p>
      <div className="qbox">{revealing ? 'Adu tangan!' : 'Pilih senjatamu!'}</div>
      {!revealing && covered && <Cover name={players[voter] ?? ''} onGo={() => setCovered(false)} hint="Pilihanmu disembunyikan dari pemain lain." />}
      {!revealing && !covered && (
        <div>
          <p className="center muted small">Giliran <b>{players[voter]}</b> memilih</p>
          <div className="rps-pick">{HANDS.map((h, k) => <button key={k} className="opt rps-opt" onClick={() => choose(k)}><span className="rps-e"><HandArt kind={k} px={64} /></span>{h.n}</button>)}</div>
        </div>
      )}
      {revealing && <RpsArena key={round} names={players} picks={picks} streaks={streaks} onReveal={() => setRevealed(true)} />}
      {revealing && revealed && <Button size="lg" onClick={next}>{round + 1 >= count ? 'Lihat hasil' : 'Ronde berikutnya'}</Button>}
      <p className="center muted small gap"><Emo t="✊ Batu menang atas ✌️ Gunting · ✌️ Gunting menang atas ✋ Kertas · ✋ Kertas menang atas ✊ Batu" /></p>
      <div className="gap"><Scoreboard players={players} scores={shownScores} /></div>
    </div>
  );
}
