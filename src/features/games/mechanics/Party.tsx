import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ProgressBar, useToast } from '../../../components/ui';
import { useCountdown } from '../../../hooks/useCountdown';
import { sfx } from '../../../utils/sound';
import { rng, seedFrom, shuffle } from '../../../utils/rng';
import { storyStarters, wheelSlices, wordPairs } from '../../../data/content/party';
import { Scoreboard } from './Quiz';
import type { MechProps } from './types';

export function WheelMech({ players, count, onDone }: MechProps) {
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [res, setRes] = useState<number | null>(null);
  const [i, setI] = useState(0);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [good, setGood] = useState(0);
  const n = wheelSlices.length, slice = 360 / n;
  const turn = i % players.length;
  const spin = () => {
    const extra = 1080 + Math.floor(Math.random() * 360);
    const total = rot + extra;
    setSpinning(true); setRes(null); setRot(total);
    setTimeout(() => { const ang = (360 - (total % 360)) % 360; setRes(Math.floor(ang / slice)); setSpinning(false); sfx.win(); }, 3300);
  };
  const adv = (ok: boolean) => {
    const ns = scores.map((v, k) => v + (k === turn && ok ? 1 : 0)); const ng = good + (ok ? 1 : 0);
    if (i + 1 >= count) { onDone({ scores: ns, correct: ng, total: count }); return; }
    setScores(ns); setGood(ng); setI(i + 1); setRes(null);
  };
  const pt = (a: number, r: number) => [150 + r * Math.sin((a * Math.PI) / 180), 150 - r * Math.cos((a * Math.PI) / 180)] as const;
  const colors = ['#7c4dff', '#ff5c8a', '#ffc83d', '#12b886', '#4c6ef5', '#f76707', '#e64980', '#0ca678'];
  return (
    <div className="center">
      <ProgressBar value={i / count} />
      <p className="muted small gap">Putaran {i + 1}/{count} · Giliran: <b>{players[turn]}</b></p>
      <div className="pointer" />
      <svg className="wheel" viewBox="0 0 300 300" style={{ transform: `rotate(${rot}deg)` }} role="img" aria-label="Roda tantangan">
        {wheelSlices.map((t, k) => {
          const [x1, y1] = pt(k * slice, 145), [x2, y2] = pt((k + 1) * slice, 145), [tx, ty] = pt((k + 0.5) * slice, 95);
          return (<g key={k}><path d={`M150 150L${x1} ${y1}A145 145 0 0 1 ${x2} ${y2}Z`} fill={colors[k % colors.length]} stroke="#fff" strokeWidth="3" />
            <text x={tx} y={ty} fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle" transform={`rotate(${(k + 0.5) * slice} ${tx} ${ty})`}>{t.length > 14 ? t.slice(0, 13) + '…' : t}</text></g>);
        })}
        <circle cx="150" cy="150" r="14" fill="#fff" />
      </svg>
      {res === null ? <Button size="lg" className="gap" onClick={spin} disabled={spinning}>{spinning ? 'Berputar…' : 'Putar roda!'}</Button> : (
        <div className="gap"><div className="expl"><b>Tantanganmu: {wheelSlices[res]}</b></div>
          <div className="row"><Button variant="ghost" className="grow" onClick={() => adv(false)}>Lewati</Button><Button className="grow" onClick={() => adv(true)}>Selesai (+1)</Button></div></div>
      )}
      <div className="gap" style={{ textAlign: 'left' }}><Scoreboard players={players} scores={scores} turn={turn} /></div>
    </div>
  );
}

export function WordChainMech({ players, seed, secs, onDone }: MechProps) {
  const start = useMemo(() => shuffle(wordPairs, rng(seedFrom(seed)))[0] ?? 'Pantai', [seed]);
  const [words, setWords] = useState<string[]>([start]);
  const [alive, setAlive] = useState<boolean[]>(() => players.map(() => true));
  const [turn, setTurn] = useState(0);
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');
  const [counts, setCounts] = useState<number[]>(() => players.map(() => 0));
  const [round, setRound] = useState(0);
  const nextAlive = (from: number, a: boolean[]) => { for (let k = 1; k <= a.length; k++) { const j = (from + k) % a.length; if (a[j]) return j; } return from; };
  const finish = (a: boolean[], c: number[]) => {
    const w = players[a.findIndex(Boolean)];
    onDone({ scores: c, correct: c.reduce((x, y) => x + y, 0), total: Math.max(1, words.length - 1), summary: <p className="center"><b>Pemenang: {w ?? '—'}</b></p> });
  };
  const timeout = () => {
    const a = alive.map((v, k) => (k === turn ? false : v));
    sfx.wrong(); setAlive(a); setVal(''); setErr('');
    if (a.filter(Boolean).length <= 1) { finish(a, counts); return; }
    setTurn(nextAlive(turn, a)); setRound((r) => r + 1);
  };
  const left = useCountdown(secs, round, true, timeout);
  const submit = () => {
    const w = val.trim();
    if (w.length < 2) { setErr('Ketik minimal 2 huruf.'); return; }
    if (words.some((x) => x.toLowerCase() === w.toLowerCase())) { setErr('Kata itu sudah dipakai!'); return; }
    const c = counts.map((v, k) => (k === turn ? v + 1 : v));
    setCounts(c); setWords([...words, w]); setVal(''); setErr(''); setTurn(nextAlive(turn, alive)); setRound((r) => r + 1); sfx.right();
  };
  return (
    <div>
      <div className={`timer ${left < 3 ? 'low' : ''}`}><div style={{ width: `${(left / secs) * 100}%` }} /></div>
      <p className="center muted small">Kata sebelumnya</p>
      <div className="qbox">{words[words.length - 1]}</div>
      <p className="center">Giliran <b>{players[turn]}</b> — ketik kata yang berhubungan!</p>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="row">
        <input className="input" autoFocus value={val} onChange={(e) => { setVal(e.target.value); setErr(''); }} placeholder="Kata berikutnya…" aria-label="Kata berikutnya" />
        <Button type="submit">Kirim</Button>
      </form>
      {err && <p className="field-err" role="alert">{err}</p>}
      <p className="muted small gap">Rantai: {words.join(' → ')}</p>
      {players.map((p, k) => <div key={k} className={`score-row ${k === turn ? 'turn' : ''}`}><span>{alive[k] ? '' : '❌ '}{p}</span><span>{counts[k]} kata</span></div>)}
    </div>
  );
}

export function StoryMech({ players, seed, count, onDone }: MechProps) {
  const start = useMemo(() => shuffle(storyStarters, rng(seedFrom(seed)))[0] ?? storyStarters[0] ?? '', [seed]);
  const total = Math.max(players.length * 2, Math.min(count, 12));
  const [lines, setLines] = useState<string[]>([start]);
  const [val, setVal] = useState('');
  const [counts, setCounts] = useState<number[]>(() => players.map(() => 0));
  const [ended, setEnded] = useState(false);
  const toast = useToast();
  const added = lines.length - 1;
  const turn = added % players.length;
  const add = () => {
    const t = val.trim();
    if (t.length < 5) return;
    setLines([...lines, t]); setVal('');
    setCounts(counts.map((v, k) => (k === turn ? v + 1 : v)));
  };
  useEffect(() => { if (added >= total) setEnded(true); }, [added, total]);
  const story = lines.join(' ');
  if (ended) {
    return (<div><div className="card"><h3>Cerita kalian</h3><p style={{ whiteSpace: 'pre-wrap' }}>{story}</p></div>
      <div className="row"><Button variant="soft" icon="copy" className="grow" onClick={() => { void navigator.clipboard?.writeText(story).then(() => toast('Cerita disalin', 'ok')).catch(() => toast('Tidak bisa menyalin', 'err')); }}>Salin cerita</Button>
        <Button className="grow" onClick={() => onDone({ scores: counts, correct: added, total: Math.max(added, 1) })}>Selesai</Button></div></div>);
  }
  return (
    <div>
      <ProgressBar value={added / total} />
      <div className="card gap"><p className="muted small">Cerita sejauh ini</p><p>{story}</p></div>
      <p>Giliran <b>{players[turn]}</b>: tambahkan satu kalimat ({added}/{total})</p>
      <textarea className="input" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Lanjutkan ceritanya…" aria-label="Kalimat lanjutan" />
      <div className="row gap"><Button variant="ghost" onClick={() => setEnded(true)} disabled={added < 1}>Akhiri cerita</Button><Button className="grow" onClick={add} disabled={val.trim().length < 5}>Tambah kalimat</Button></div>
    </div>
  );
}

export function WordGuessMech({ players, seed, secs, onDone }: MechProps) {
  const words = useMemo(() => shuffle(wordPairs, rng(seedFrom(seed))), [seed]);
  const turns = players.length * 2;
  const [t, setT] = useState(0);
  const [ready, setReady] = useState(false);
  const [wi, setWi] = useState(0);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [good, setGood] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const me = t % players.length;
  const doneRef = useRef(false);
  const endTurn = () => {
    setReady(false);
    if (t + 1 >= turns) { if (!doneRef.current) { doneRef.current = true; onDone({ scores, correct: good, total: good + skipped || 1 }); } return; }
    setT(t + 1);
  };
  const left = useCountdown(secs, t, ready, () => { sfx.win(); endTurn(); });
  const w = words[wi % words.length];
  if (!ready) return (
    <div className="card center gap"><h2>Giliran {players[me]} menjelaskan</h2>
      <p className="muted">Jelaskan kata di layar tanpa menyebutnya. Timmu menebak! Waktu {secs} detik.</p>
      <Button size="lg" onClick={() => setReady(true)}>Mulai ({t + 1}/{turns})</Button>
      <div className="gap" style={{ textAlign: 'left' }}><Scoreboard players={players} scores={scores} turn={me} /></div></div>
  );
  return (
    <div>
      <div className={`timer ${left < 10 ? 'low' : ''}`}><div style={{ width: `${(left / secs) * 100}%` }} /></div>
      <p className="center muted small">Penjelas: <b>{players[me]}</b> · Benar: {scores[me]}</p>
      <div className="qbox" style={{ fontSize: '1.8rem', padding: '40px 16px' }}>{w}</div>
      <div className="row"><Button variant="ghost" className="grow" onClick={() => { setSkipped((s) => s + 1); setWi(wi + 1); }}>Lewati</Button>
        <Button className="grow" onClick={() => { sfx.right(); setScores(scores.map((v, k) => (k === me ? v + 1 : v))); setGood(good + 1); setWi(wi + 1); }}>Benar!</Button></div>
    </div>
  );
}
