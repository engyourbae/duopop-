import { useEffect, useMemo, useReducer, useState } from 'react';
import { Button, ProgressBar } from '../../../components/ui';
import { useCountdown } from '../../../hooks/useCountdown';
import { usePauseSecs } from '../../../hooks/usePause';
import { sfx } from '../../../utils/sound';
import { rng, seedFrom, shuffle } from '../../../utils/rng';
import { clueItems, estimateQuestions, orderQuestions } from '../../../data/questions';
import { getProgress, markSeen } from '../../progression/store';
import { buildItems, cluePoints, estimatePoints, initialQuiz, orderPoints, quizReducer, type QuizAction, type QuizState } from '../engine';
import { LETTERS, type MechProps } from './types';

/** Batang hitung mundur jeda penjelasan + tombol lanjut. */
export function PauseBar({ secs, onNext, label = 'Lanjut' }: { secs: number; onNext: () => void; label?: string }) {
  const left = useCountdown(secs || 1, 'pause', secs > 0, onNext);
  return (<>{secs > 0 && <div className="timer" aria-hidden="true"><div style={{ width: `${(left / secs) * 100}%` }} /></div>}<Button size="lg" onClick={onNext}>{label}{secs > 0 ? ` (${Math.ceil(left)} dtk)` : ''}</Button></>);
}
export function Scoreboard({ players, scores, turn }: { players: string[]; scores: number[]; turn?: number }) {
  if (players.length < 2) return null;
  return <div>{players.map((p, i) => <div key={i} className={`score-row ${i === turn ? 'turn' : ''}`}><span>{i === turn ? '▶ ' : ''}{p}</span><span>{scores[i] ?? 0}</span></div>)}</div>;
}

export function QuizMech({ game, players, seed, count, secs, onDone, mode, level }: MechProps) {
  const chain = game.mechanic === 'chain-tf';
  const endless = mode === 'endless';
  const items = useMemo(() => buildItems(game, endless ? 300 : chain ? 30 : count, seed, { level: mode === 'level' ? level : undefined, seen: mode ? new Set(getProgress().seenQ) : undefined }), [game, chain, endless, count, seed, mode, level]);
  const [s, dispatch] = useReducer((st: QuizState, a: QuizAction) => quizReducer(st, a, items, chain, endless ? 3 : 0), initialQuiz(players.length));
  const item = items[s.index];
  const pause = usePauseSecs();
  const running = s.chosen === null && !s.done;
  const left = useCountdown(secs, s.index, running, () => dispatch({ type: 'answer', choice: -1, timeFrac: 0 }));
  useEffect(() => { if (s.done) onDone({ scores: s.scores, correct: s.correct, total: s.log.length }); }, [s.done]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (s.chosen !== null && item) { (s.chosen === item.correct ? sfx.right : sfx.wrong)(); if (mode) markSeen([item.id]); } }, [s.chosen]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!item || s.done) return null;
  const turn = s.index % players.length;
  return (
    <div>
      <ProgressBar value={endless ? Math.min(1, s.correct / 50) : s.index / items.length} label="Kemajuan soal" />
      <div className="row gap" style={{ justifyContent: 'space-between' }}>
        <span className="muted small">{chain ? `Rantai: ${s.streak}` : endless ? `Nyawa: ${'♥'.repeat(Math.max(0, 3 - s.wrong))} · Benar: ${s.correct}` : `${mode === 'level' ? `Level ${level} · ` : ''}Soal ${s.index + 1}/${items.length}`}</span>
        {players.length > 1 ? <b>Giliran: {players[turn]}</b> : <b>Skor: {s.scores[0]}</b>}
      </div>
      <div className={`timer ${left < 4 ? 'low' : ''}`} aria-hidden="true"><div style={{ width: `${(left / secs) * 100}%` }} /></div>
      <div className="qbox">{item.big && <div className="bigemoji" role="img" aria-label="bendera">{item.big}</div>}{item.prompt}</div>
      {item.options.map((o, i) => {
        const cls = s.chosen === null ? '' : i === item.correct ? 'right' : i === s.chosen ? 'wrong' : '';
        return <button key={i} className={`opt ${cls}`} disabled={s.chosen !== null} onClick={() => dispatch({ type: 'answer', choice: i, timeFrac: left / secs })}><span className="k">{LETTERS[i]}</span>{o}</button>;
      })}
      {s.chosen !== null && (
        <>
          <div className={`expl ${s.chosen === item.correct ? '' : 'bad'}`}><b>{s.chosen === item.correct ? 'Benar! ' : s.chosen === -1 ? 'Waktu habis. ' : 'Belum tepat. '}</b>{item.explanation}</div>
          <PauseBar key={s.index} secs={pause} onNext={() => dispatch({ type: 'next' })} label={chain && s.chosen !== item.correct ? 'Lihat hasil' : s.index + 1 >= items.length ? 'Selesai' : 'Lanjut'} />
        </>
      )}
      <div className="gap"><Scoreboard players={players} scores={s.scores} turn={turn} /></div>
    </div>
  );
}

export function OrderMech({ players, seed, count, onDone }: MechProps) {
  const rounds = useMemo(() => shuffle(orderQuestions, rng(seedFrom(seed))).slice(0, Math.min(count, orderQuestions.length)), [seed, count]);
  const [i, setI] = useState(0);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [good, setGood] = useState(0);
  const pause = usePauseSecs();
  const q = rounds[i];
  const shuffled = useMemo(() => (q ? shuffle(q.options.map((_, k) => k), rng(seedFrom(seed + q.id))) : []), [q, seed]);
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  if (!q) return null;
  const turn = i % players.length;
  const pts = checked ? orderPoints(picked, q.correctAnswer) : 0;
  const finish = () => {
    if (i + 1 >= rounds.length) onDone({ scores, correct: good, total: rounds.length });
    else { setI(i + 1); setPicked([]); setChecked(false); }
  };
  const check = () => {
    const p = orderPoints(picked, q.correctAnswer);
    setChecked(true); setScores((sc) => sc.map((v, k) => (k === turn ? v + p : v)));
    if (p === 100) { setGood((g) => g + 1); sfx.right(); } else sfx.wrong();
  };
  return (
    <div>
      <ProgressBar value={i / rounds.length} />
      <p className="muted small gap">Ronde {i + 1}/{rounds.length}{players.length > 1 && <> · Giliran: <b>{players[turn]}</b></>}</p>
      <div className="qbox">{q.question}<div className="small muted" style={{ fontWeight: 600, marginTop: 6 }}>Ketuk peristiwa dari yang paling AWAL.</div></div>
      {shuffled.map((k) => {
        const pos = picked.indexOf(k);
        const right = checked && q.correctAnswer[pos] === k;
        return (
          <button key={k} disabled={checked || pos >= 0} className={`opt ${checked ? (right ? 'right' : 'wrong') : pos >= 0 ? 'sel' : ''}`} onClick={() => setPicked([...picked, k])}>
            <span className="k">{pos >= 0 ? pos + 1 : '·'}</span>{q.options[k]}{checked && <span className="muted small"> · {(q.years[k] ?? 0) < 0 ? `${Math.abs(q.years[k] ?? 0)} SM` : q.years[k]}</span>}
          </button>
        );
      })}
      {!checked ? (
        <div className="row gap"><Button variant="ghost" onClick={() => setPicked([])} disabled={!picked.length}>Ulangi</Button><Button className="grow" onClick={check} disabled={picked.length < q.options.length}>Periksa urutan</Button></div>
      ) : (
        <>
          <div className={`expl ${pts === 100 ? '' : 'bad'}`}><b>{pts === 100 ? 'Urutan sempurna! ' : `${pts / 25} dari ${q.options.length} posisi tepat. `}</b>Urutan benar: {q.explanation}</div>
          <PauseBar key={i} secs={pause} onNext={finish} label={i + 1 >= rounds.length ? 'Selesai' : 'Lanjut'} />
        </>
      )}
      <div className="gap"><Scoreboard players={players} scores={scores} turn={turn} /></div>
    </div>
  );
}

export function EstimateMech({ players, seed, count, onDone }: MechProps) {
  const rounds = useMemo(() => shuffle(estimateQuestions, rng(seedFrom(seed))).slice(0, Math.min(count, estimateQuestions.length)), [seed, count]);
  const [i, setI] = useState(0);
  const [val, setVal] = useState('');
  const [res, setRes] = useState<number | null>(null);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [good, setGood] = useState(0);
  const pause = usePauseSecs();
  const q = rounds[i];
  if (!q) return null;
  const turn = i % players.length;
  const guess = Number(val.replace(',', '.'));
  const submit = () => {
    const p = estimatePoints(guess, q.correctAnswer);
    setRes(p); setScores((sc) => sc.map((v, k) => (k === turn ? v + p : v)));
    if (p >= 80) { setGood((g) => g + 1); sfx.right(); } else sfx.wrong();
  };
  const next = () => { if (i + 1 >= rounds.length) onDone({ scores, correct: good, total: rounds.length }); else { setI(i + 1); setVal(''); setRes(null); } };
  return (
    <div>
      <ProgressBar value={i / rounds.length} />
      <p className="muted small gap">Soal {i + 1}/{rounds.length}{players.length > 1 && <> · Giliran: <b>{players[turn]}</b></>}</p>
      <div className="qbox">{q.question}</div>
      <div className="row"><input className="input" inputMode="decimal" placeholder="Perkiraanmu…" value={val} onChange={(e) => setVal(e.target.value)} disabled={res !== null} aria-label="Perkiraan angka" /><b>{q.unit}</b></div>
      {res === null ? <Button size="lg" className="gap" disabled={!Number.isFinite(guess) || val.trim() === ''} onClick={submit}>Kunci jawaban</Button> : (
        <>
          <div className={`expl ${res >= 80 ? '' : 'bad'}`}><b>Jawaban: {q.correctAnswer.toLocaleString('id-ID')} {q.unit}. +{res} poin. </b>{q.explanation}</div>
          <PauseBar key={i} secs={pause} onNext={next} label={i + 1 >= rounds.length ? 'Selesai' : 'Lanjut'} />
        </>
      )}
      <div className="gap"><Scoreboard players={players} scores={scores} turn={turn} /></div>
    </div>
  );
}

export function CluesMech({ game, players, seed, count, onDone }: MechProps) {
  const kind = game.bank === 'tokoh' ? 'tokoh' : 'misteri';
  const rounds = useMemo(() => shuffle(clueItems.filter((c) => c.kind === kind), rng(seedFrom(seed))).slice(0, count), [kind, seed, count]);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(1);
  const [wrong, setWrong] = useState<string[]>([]);
  const [done, setDone] = useState<null | boolean>(null);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [good, setGood] = useState(0);
  const pause = usePauseSecs();
  const q = rounds[i];
  const opts = useMemo(() => (q ? shuffle([q.answer, ...q.wrong], rng(seedFrom(seed + q.id))) : []), [q, seed]);
  if (!q) return null;
  const turn = i % players.length;
  const guess = (o: string) => {
    if (o === q.answer) {
      const p = cluePoints(shown, wrong.length);
      setScores((sc) => sc.map((v, k) => (k === turn ? v + p : v))); setGood((g) => g + 1); setDone(true); sfx.right();
    } else {
      const w = [...wrong, o]; setWrong(w); sfx.wrong();
      if (w.length >= q.wrong.length) setDone(false);
    }
  };
  const next = () => { if (i + 1 >= rounds.length) onDone({ scores, correct: good, total: rounds.length }); else { setI(i + 1); setShown(1); setWrong([]); setDone(null); } };
  return (
    <div>
      <ProgressBar value={i / rounds.length} />
      <p className="muted small gap">Teka-teki {i + 1}/{rounds.length}{players.length > 1 && <> · Giliran: <b>{players[turn]}</b></>}</p>
      <div className="card">{q.clues.slice(0, done === null ? shown : q.clues.length).map((c, k) => <p key={k} style={{ marginBottom: 6 }}><b>{k + 1}.</b> {c}</p>)}</div>
      <p className="small muted">Poin jika tepat sekarang: {cluePoints(shown, wrong.length)}</p>
      {opts.map((o) => <button key={o} className={`opt ${done !== null && o === q.answer ? 'right' : wrong.includes(o) ? 'wrong' : ''}`} disabled={done !== null || wrong.includes(o)} onClick={() => guess(o)}>{o}</button>)}
      {done === null && shown < q.clues.length && <Button variant="soft" icon="search" onClick={() => setShown(shown + 1)}>Buka petunjuk berikutnya (poin turun)</Button>}
      {done !== null && (<><div className={`expl ${done ? '' : 'bad'}`}><b>{done ? 'Tepat! ' : `Jawabannya: ${q.answer}. `}</b>{q.explanation}</div><PauseBar key={i} secs={pause} onNext={next} label={i + 1 >= rounds.length ? 'Selesai' : 'Lanjut'} /></>)}
      <div className="gap"><Scoreboard players={players} scores={scores} turn={turn} /></div>
    </div>
  );
}
