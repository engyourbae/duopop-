import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../../components/ui';
import { useCountdown } from '../../../hooks/useCountdown';
import { sfx } from '../../../utils/sound';
import { rng, seedFrom, shuffle } from '../../../utils/rng';
import { ANAGRAMS, SENTENCES, WORDS5 } from '../../../data/content/words';
import { buildItems } from '../engine';
import { PauseBar, Scoreboard } from './Quiz';
import { TurnRunner } from './Arcade';
import { usePauseSecs } from '../../../hooks/usePause';
import { LETTERS, type MechProps } from './types';

// ---------- Tebak Kata Rahasia ----------
type St = 'g' | 'y' | 'x' | '';
export function rate(guess: string, word: string): St[] {
  const res: St[] = Array(word.length).fill('x'), left: Record<string, number> = {};
  for (let i = 0; i < word.length; i++) { if (guess[i] === word[i]) res[i] = 'g'; else left[word[i] as string] = (left[word[i] as string] ?? 0) + 1; }
  for (let i = 0; i < word.length; i++) if (res[i] !== 'g' && (left[guess[i] as string] ?? 0) > 0) { res[i] = 'y'; left[guess[i] as string]!--; }
  return res;
}
function Wordle({ seed, end }: { seed: string; end: (s: number) => void }) {
  const word = useMemo(() => shuffle(WORDS5, rng(seedFrom(seed)))[0] as string, [seed]);
  const [rows, setRows] = useState<string[]>([]);
  const [cur, setCur] = useState('');
  const [msg, setMsg] = useState('');
  const done = useRef(false);
  const keyState = useMemo(() => { const m: Record<string, St> = {}; rows.forEach((g) => rate(g, word).forEach((s, i) => { const l = g[i] as string; if (m[l] !== 'g') m[l] = s === 'g' || (s === 'y' && m[l] !== 'y') ? s : m[l] ?? s; })); return m; }, [rows, word]);
  const submit = () => {
    if (cur.length !== 5 || done.current) return;
    const nr = [...rows, cur]; setRows(nr); setCur('');
    if (cur === word) { done.current = true; sfx.win(); setMsg('Benar!'); setTimeout(() => end((7 - nr.length) * 100), 900); }
    else if (nr.length >= 6) { done.current = true; sfx.wrong(); setMsg(`Kata rahasianya: ${word.toUpperCase()}`); setTimeout(() => end(0), 1600); }
  };
  const type = (l: string) => { if (!done.current && cur.length < 5) setCur(cur + l); };
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === 'Enter') submit(); else if (e.key === 'Backspace') setCur((c) => c.slice(0, -1)); else if (/^[a-z]$/i.test(e.key)) type(e.key.toLowerCase()); };
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
  });
  const grid = Array.from({ length: 6 }, (_, r) => rows[r] ?? (r === rows.length ? cur : ''));
  return (
    <div className="center"><p className="muted small">Tebak kata 5 huruf · percobaan {Math.min(rows.length + 1, 6)}/6</p>
      <div className="wgrid">{grid.map((g, r) => { const st = r < rows.length ? rate(g, word) : []; return <div key={r} className="wrow">{Array.from({ length: 5 }, (_, i) => <span key={i} className={`wcell ${st[i] ?? ''}`}>{(g[i] ?? '').toUpperCase()}</span>)}</div>; })}</div>
      {msg && <p><b>{msg}</b></p>}
      <div className="wkeys">{['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map((row) => <div key={row} className="wkrow">{row.split('').map((l) => <button key={l} className={`wkey ${keyState[l] ?? ''}`} onClick={() => type(l)}>{l.toUpperCase()}</button>)}</div>)}
        <div className="wkrow"><button className="wkey wide" onClick={() => setCur(cur.slice(0, -1))}>Hapus</button><button className="wkey wide ok" onClick={submit} disabled={cur.length !== 5}>Kirim</button></div></div></div>
  );
}
export function WordleMech(p: MechProps) { return <TurnRunner players={p.players} xpPer={0.1} hint="Tebak kata 5 huruf dalam 6 percobaan." onDone={p.onDone} render={(end, i) => <Wordle seed={`${p.seed}:${i}`} end={end} />} />; }

// ---------- Adu Mengetik ----------
function Typing({ seed, secs, end }: { seed: string; secs: number; end: (s: number) => void }) {
  const text = useMemo(() => shuffle(SENTENCES, rng(seedFrom(seed)))[0] as string, [seed]);
  const [v, setV] = useState('');
  const t0 = useRef(0);
  const done = useRef(false);
  const fin = (typed: string) => {
    if (done.current) return; done.current = true;
    const el = Math.max(1, (Date.now() - t0.current) / 1000), ok = [...typed].filter((c, i) => c === text[i]).length, acc = typed.length ? ok / Math.max(typed.length, text.length) : 0;
    end(Math.round(((ok / 5) / (el / 60)) * 10 * acc));
  };
  const left = useCountdown(secs, 'type', t0.current > 0, () => fin(v));
  return (
    <div><p className="muted small center">Ketik kalimat berikut. Waktu: {Math.ceil(t0.current ? left : secs)} dtk</p>
      <div className="qbox" style={{ fontSize: '1.05rem', textAlign: 'left', lineHeight: 1.7 }}>{[...text].map((c, i) => <span key={i} style={{ color: i < v.length ? (v[i] === c ? 'var(--green)' : 'var(--red)') : 'inherit', textDecoration: i === v.length ? 'underline' : 'none' }}>{c}</span>)}</div>
      <input className="input" autoFocus value={v} aria-label="Ketik di sini" autoCapitalize="off" autoCorrect="off" spellCheck={false} onChange={(e) => { if (!t0.current) t0.current = Date.now(); setV(e.target.value); if (e.target.value.length >= text.length) fin(e.target.value); }} placeholder="Mulai mengetik…" /></div>
  );
}
export function TypingMech(p: MechProps) { return <TurnRunner players={p.players} xpPer={0.05} hint="Ketik kalimat secepat dan seakurat mungkin." onDone={p.onDone} render={(end, i) => <Typing seed={`${p.seed}:${i}`} secs={Math.max(20, p.secs || 45)} end={end} />} />; }

// ---------- Adu Ketuk ----------
function Tap({ secs, end }: { secs: number; end: (s: number) => void }) {
  const [n, setN] = useState(0);
  const left = useCountdown(secs, 'tap', true, () => end(n));
  return (<div className="center"><h2>{n} ketukan</h2><p className="muted">Sisa {Math.ceil(left)} detik</p><button className="tapbig" onPointerDown={() => setN((x) => x + 1)} aria-label="Ketuk">KETUK!</button></div>);
}
export function TapMech(p: MechProps) { return <TurnRunner players={p.players} xpPer={0.5} hint={`Ketuk tombol sebanyak mungkin dalam ${p.secs || 10} detik!`} onDone={p.onDone} render={(end) => <Tap secs={p.secs || 10} end={end} />} />; }

// ---------- Susun Huruf ----------
function Anagram({ seed, secs, end }: { seed: string; secs: number; end: (s: number) => void }) {
  const list = useMemo(() => shuffle(ANAGRAMS, rng(seedFrom(seed))), [seed]);
  const [i, setI] = useState(0), [score, setScore] = useState(0), [picked, setPicked] = useState<number[]>([]);
  const [word, hint] = list[i % list.length] as [string, string];
  const tiles = useMemo(() => { let t = shuffle([...word].map((_, k) => k), rng(seedFrom(`${seed}:${i}`))); if (t.map((k) => word[k]).join('') === word && word.length > 1) t = t.reverse(); return t; }, [word, seed, i]);
  const left = useCountdown(secs, 'ana', true, () => end(score));
  const attempt = picked.map((k) => word[k]).join('');
  const pick = (k: number) => {
    if (picked.includes(k)) return;
    const np = [...picked, k]; setPicked(np);
    if (np.length === word.length) { const w = np.map((x) => word[x]).join(''); if (w === word) { sfx.right(); setScore((s) => s + 100); setI(i + 1); setPicked([]); } else { sfx.wrong(); setTimeout(() => setPicked([]), 350); } }
  };
  return (
    <div className="center"><div className="row" style={{ justifyContent: 'space-between' }}><b>Skor: {score}</b><b>{Math.ceil(left)} dtk</b></div>
      <p className="muted small gap">Petunjuk: {hint} · {word.length} huruf</p>
      <div className="qbox" style={{ letterSpacing: '.2em', minHeight: 70 }}>{attempt.toUpperCase() || '…'}</div>
      <div className="row wrap" style={{ justifyContent: 'center' }}>{tiles.map((k) => <button key={k} className={`ltile ${picked.includes(k) ? 'used' : ''}`} onClick={() => pick(k)} disabled={picked.includes(k)}>{(word[k] as string).toUpperCase()}</button>)}</div>
      <div className="row gap"><Button variant="ghost" className="grow" onClick={() => setPicked([])}>Ulangi</Button><Button variant="soft" className="grow" onClick={() => { setScore((s) => Math.max(0, s - 20)); setI(i + 1); setPicked([]); }}>Lewati (−20)</Button></div></div>
  );
}
export function AnagramMech(p: MechProps) { return <TurnRunner players={p.players} xpPer={0.1} hint={`Susun huruf menjadi kata. Waktu ${p.secs || 60} detik.`} onDone={p.onDone} render={(end, i) => <Anagram seed={`${p.seed}:${i}`} secs={p.secs || 60} end={end} />} />; }

// ---------- Kuis Rebutan (buzzer) ----------
export function BuzzerMech({ game, players, seed, count, onDone }: MechProps) {
  const items = useMemo(() => buildItems(game, count, seed), [game, count, seed]);
  const pause = usePauseSecs();
  const [i, setI] = useState(0), [shown, setShown] = useState(0), [phase, setPhase] = useState<'read' | 'answer' | 'reveal'>('read');
  const [buzz, setBuzz] = useState(-1), [early, setEarly] = useState(false), [chosen, setChosen] = useState<number | null>(null);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [good, setGood] = useState(0);
  const item = items[i];
  const words = useMemo(() => (item ? item.prompt.split(' ') : []), [item]);
  useEffect(() => {
    if (phase !== 'read' || !item) return;
    const t = setInterval(() => setShown((s) => s + 1), 320);
    return () => clearInterval(t);
  }, [phase, item]);
  useEffect(() => { if (phase === 'read' && shown > words.length + 18) { setPhase('reveal'); setChosen(null); setBuzz(-1); } }, [shown, phase, words.length]);
  const left = useCountdown(8, `a${i}-${phase}`, phase === 'answer', () => answer(-1));
  if (!item) return null;
  const answer = (c: number) => {
    const ok = c === item.correct, add = ok ? 2 + (early ? 1 : 0) : -1;
    setScores((sc) => sc.map((v, k) => (k === buzz ? Math.max(0, v + add) : v))); if (ok) setGood((g) => g + 1);
    setChosen(c); setPhase('reveal'); (ok ? sfx.right : sfx.wrong)();
  };
  const next = () => { if (i + 1 >= items.length) onDone({ scores, correct: good, total: items.length }); else { setI(i + 1); setShown(0); setPhase('read'); setBuzz(-1); setChosen(null); setEarly(false); } };
  return (
    <div><p className="muted small">Soal {i + 1}/{items.length}</p>
      <div className="qbox" style={{ minHeight: 110 }}>{words.slice(0, phase === 'read' ? shown : words.length).join(' ')}{phase === 'read' && shown < words.length ? ' …' : ''}</div>
      {phase === 'answer' && <><p className="center"><b>{players[buzz]}</b> menjawab — {Math.ceil(left)} dtk</p>{item.options.map((o, k) => <button key={k} className="opt" onClick={() => answer(k)}><span className="k">{LETTERS[k]}</span>{o}</button>)}</>}
      {phase === 'reveal' && <><div className="expl"><b>{chosen === null || buzz < 0 ? 'Tidak ada yang menekan bel. ' : chosen === item.correct ? `${players[buzz]} benar! ` : `${players[buzz]} salah. `}</b>Jawaban: {item.options[item.correct]}. {item.explanation}</div><PauseBar key={i} secs={pause} onNext={next} label={i + 1 >= items.length ? 'Selesai' : 'Lanjut'} /></>}
      {phase === 'read' && <div className="buzzgrid">{players.map((p, k) => <button key={k} className="buzzbtn" style={{ background: ['#e0401f', '#2a4bff', '#0f8f5f', '#ffc414'][k % 4], color: k % 4 === 3 ? '#17140e' : '#fff' }} onPointerDown={() => { setBuzz(k); setEarly(shown < words.length); setPhase('answer'); sfx.tick(); }}>{p}<small>BEL</small></button>)}</div>}
      <div className="gap"><Scoreboard players={players} scores={scores} turn={buzz >= 0 ? buzz : undefined} /></div></div>
  );
}
