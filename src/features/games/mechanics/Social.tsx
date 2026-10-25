import { useMemo, useState, type ReactNode } from 'react';
import { Button, ProgressBar } from '../../../components/ui';
import { useCountdown } from '../../../hooks/useCountdown';
import { sfx } from '../../../utils/sound';
import { rng, seedFrom, shuffle } from '../../../utils/rng';
import { knowMe, likelyBank, loveLangs, loveQuiz, matchBank, memoryLane, deepTalk, thisOrThat, wouldYouRather, type LoveKey } from '../../../data/content/couples';
import { rapidFire, challenges } from '../../../data/content/party';
import { Scoreboard } from './Quiz';
import { LETTERS, type MechProps } from './types';

function Cover({ name, onGo, hint }: { name: string; onGo: () => void; hint?: string }) {
  return (
    <div className="card center gap">
      <div className="avatar" style={{ margin: '0 auto 8px' }}>{name.slice(0, 1).toUpperCase()}</div>
      <h2>Serahkan ponsel ke {name}</h2>
      <p className="muted">{hint ?? 'Pastikan pemain lain tidak melihat layar.'}</p>
      <Button size="lg" onClick={onGo}>Aku {name}, lanjut</Button>
    </div>
  );
}
/** Poin untuk pemain yang memilih pilihan terbanyak (plurality). Pilihan yang seri semua = tanpa poin. */
export function pluralityPoints(picks: number[]): number[] {
  const tally = new Map<number, number>();
  picks.forEach((p) => tally.set(p, (tally.get(p) ?? 0) + 1));
  const max = Math.max(...tally.values());
  const winners = [...tally.entries()].filter(([, n]) => n === max);
  if (winners.length > 1 && max === 1 && picks.length > 1) return picks.map(() => 0);
  const w = new Set(winners.map(([k]) => k));
  return picks.map((p) => (w.has(p) ? 1 : 0));
}

/** pair (This or That / Would You Rather), match (Cocokkan Jawabanku), likely (Siapa Paling Mungkin) */
export function PairMech({ game, players, seed, count, onDone }: MechProps) {
  const mode = game.mechanic;
  const rounds = useMemo(() => {
    const r = rng(seedFrom(seed));
    if (mode === 'likely') return shuffle(likelyBank, r).slice(0, count).map((t) => ({ q: `Siapa yang paling mungkin ${t}?`, o: players }));
    if (mode === 'match') return shuffle(matchBank, r).slice(0, count);
    const bank = game.bank === 'wouldYouRather' ? wouldYouRather : thisOrThat;
    return shuffle(bank, r).slice(0, count).map((p) => ({ q: game.bank === 'wouldYouRather' ? 'Kamu lebih pilih…' : 'Pilih salah satu:', o: [...p] }));
  }, [mode, game.bank, seed, count, players]);
  const [i, setI] = useState(0);
  const [voter, setVoter] = useState(0);
  const [covered, setCovered] = useState(true);
  const [picks, setPicks] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [matched, setMatched] = useState(0);
  const q = rounds[i];
  if (!q) return null;
  const revealing = picks.length === players.length;
  const choose = (c: number) => { setPicks([...picks, c]); setVoter(voter + 1); setCovered(true); };
  const pts = revealing ? (mode === 'likely' ? (() => { const t = players.map((_, k) => picks.filter((p) => p === k).length); const m = Math.max(...t); return t.map((n) => (n === m ? 1 : 0)); })() : pluralityPoints(picks)) : [];
  const allSame = revealing && picks.every((p) => p === picks[0]);
  const next = () => {
    const ns = scores.map((v, k) => v + (pts[k] ?? 0));
    const nm = matched + (allSame ? 1 : 0);
    if (i + 1 >= rounds.length) { onDone({ scores: ns, correct: nm, total: rounds.length, summary: players.length === 2 && mode !== 'likely' ? <p className="center"><b>Kecocokan: {Math.round((nm / rounds.length) * 100)}%</b></p> : undefined }); return; }
    setScores(ns); setMatched(nm); setI(i + 1); setVoter(0); setCovered(true); setPicks([]);
  };
  return (
    <div>
      <ProgressBar value={i / rounds.length} />
      <p className="muted small gap">Ronde {i + 1}/{rounds.length}</p>
      <div className="qbox">{q.q}</div>
      {!revealing && covered && <Cover name={players[voter] ?? ''} onGo={() => setCovered(false)} hint="Pilihanmu akan disembunyikan dari pemain lain." />}
      {!revealing && !covered && (<div><p className="center muted small">Giliran <b>{players[voter]}</b> memilih</p>{q.o.map((o, k) => <button key={k} className="opt" onClick={() => choose(k)}><span className="k">{LETTERS[k]}</span>{o}</button>)}</div>)}
      {revealing && (
        <div>
          {q.o.map((o, k) => <div key={k} className="score-row"><span>{o}</span><span>{players.filter((_, pi) => picks[pi] === k).join(', ') || '—'}</span></div>)}
          <div className={`expl ${mode !== 'likely' && !allSame ? 'bad' : ''}`}><b>{mode === 'likely' ? 'Hasil suara sudah keluar! ' : allSame ? 'Kompak! ' : 'Pilihan berbeda. '}</b>{mode === 'likely' ? 'Tertawakan bersama — tidak ada yang kalah.' : 'Ceritakan alasan pilihanmu.'}</div>
          <Button size="lg" onClick={() => { sfx.tick(); next(); }}>{i + 1 >= rounds.length ? 'Lihat hasil' : 'Lanjut'}</Button>
        </div>
      )}
      <div className="gap"><Scoreboard players={players} scores={scores} /></div>
    </div>
  );
}

/** howwell & predict: A menjawab diam-diam, B menebak. */
export function PredictMech({ game, players, seed, count, onDone }: MechProps) {
  const rounds = useMemo(() => {
    const r = rng(seedFrom(seed));
    if (game.bank === 'knowMe') return shuffle(knowMe, r).slice(0, count);
    return shuffle(wouldYouRather, r).slice(0, count).map((p) => ({ q: 'Kalau harus memilih, aku akan…', o: [...p] }));
  }, [game.bank, seed, count]);
  const [i, setI] = useState(0);
  const [step, setStep] = useState<'coverA' | 'ans' | 'coverB' | 'guess' | 'reveal'>('coverA');
  const [a, setA] = useState(-1);
  const [g, setG] = useState(-1);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const q = rounds[i];
  if (!q) return null;
  const ans = i % 2, gue = 1 - ans;
  const ok = a === g;
  const next = () => {
    const ns = scores.map((v, k) => v + (k === gue && ok ? 1 : 0));
    if (i + 1 >= rounds.length) { onDone({ scores: ns, correct: ns.reduce((x, y) => x + y, 0), total: rounds.length }); return; }
    setScores(ns); setI(i + 1); setStep('coverA'); setA(-1); setG(-1);
  };
  return (
    <div>
      <ProgressBar value={i / rounds.length} />
      <p className="muted small gap">Ronde {i + 1}/{rounds.length} · {players[ans]} menjawab, {players[gue]} menebak</p>
      <div className="qbox">{q.q}</div>
      {step === 'coverA' && <Cover name={players[ans] ?? ''} onGo={() => setStep('ans')} hint="Jawab tentang dirimu. Pasanganmu akan menebak." />}
      {step === 'ans' && q.o.map((o, k) => <button key={k} className="opt" onClick={() => { setA(k); setStep('coverB'); }}><span className="k">{LETTERS[k]}</span>{o}</button>)}
      {step === 'coverB' && <Cover name={players[gue] ?? ''} onGo={() => setStep('guess')} hint="Tebak apa yang dipilih pasanganmu." />}
      {step === 'guess' && q.o.map((o, k) => <button key={k} className="opt" onClick={() => { setG(k); setStep('reveal'); (k === a ? sfx.right : sfx.wrong)(); }}><span className="k">{LETTERS[k]}</span>{o}</button>)}
      {step === 'reveal' && (<>
        <div className={`expl ${ok ? '' : 'bad'}`}><b>{ok ? 'Tebakan tepat! +1' : 'Belum tepat.'}</b><br />{players[ans]} memilih: <b>{q.o[a]}</b><br />{players[gue]} menebak: <b>{q.o[g]}</b></div>
        <Button size="lg" onClick={next}>{i + 1 >= rounds.length ? 'Lihat hasil' : 'Lanjut'}</Button>
      </>)}
      <div className="gap"><Scoreboard players={players} scores={scores} turn={step === 'ans' || step === 'coverA' ? ans : gue} /></div>
    </div>
  );
}

export function LoveLangMech({ players, onDone }: MechProps) {
  const [p, setP] = useState(0);
  const [i, setI] = useState(0);
  const [tally, setTally] = useState<Record<LoveKey, number>[]>(() => players.map(() => ({ kata: 0, waktu: 0, hadiah: 0, bantuan: 0, sentuhan: 0 })));
  const [cover, setCover] = useState(true);
  const pick = (k: LoveKey) => {
    const nt = tally.map((t, idx) => (idx === p ? { ...t, [k]: t[k] + 1 } : t));
    setTally(nt);
    if (i + 1 < loveQuiz.length) { setI(i + 1); return; }
    if (p + 1 < players.length) { setP(p + 1); setI(0); setCover(true); return; }
    const sum = (
      <div>
        {players.map((name, idx) => {
          const t = nt[idx] as Record<LoveKey, number>;
          const top = (Object.keys(t) as LoveKey[]).sort((x, y) => t[y] - t[x]);
          return (<div key={idx} className="card"><h3>{name}</h3>{top.map((k) => <div key={k} className="row" style={{ marginBottom: 6 }}><span className="grow small">{loveLangs[k]}</span><div style={{ width: '50%' }}><ProgressBar value={t[k] / loveQuiz.length} /></div></div>)}</div>);
        })}
        <p className="muted small">Hasil ini hanya bahan refleksi dan obrolan, bukan diagnosis psikologis.</p>
      </div>
    );
    onDone({ scores: players.map(() => 0), correct: loveQuiz.length * players.length, total: loveQuiz.length * players.length, summary: sum as ReactNode });
  };
  const q = loveQuiz[i];
  if (!q) return null;
  if (cover) return <Cover name={players[p] ?? ''} onGo={() => setCover(false)} hint="Jawab jujur sesuai perasaanmu — 10 pernyataan." />;
  return (
    <div>
      <ProgressBar value={i / loveQuiz.length} />
      <p className="muted small gap">{players[p]} · Pernyataan {i + 1}/{loveQuiz.length}</p>
      <div className="qbox">Mana yang lebih sesuai denganmu?</div>
      <button className="opt" onClick={() => pick(q.a[1])}><span className="k">A</span>{q.a[0]}</button>
      <button className="opt" onClick={() => pick(q.b[1])}><span className="k">B</span>{q.b[0]}</button>
    </div>
  );
}

type Card = { text: string; tag?: string };
/** memory, deeptalk, rapidfire, tim */
export function DeckMech({ game, players, seed, count, secs, onDone }: MechProps) {
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(game.bank === 'deepTalk' ? 0 : 3);
  const cards: Card[] = useMemo(() => {
    const r = rng(seedFrom(seed));
    switch (game.bank) {
      case 'memoryLane': return shuffle(memoryLane, r).slice(0, count).map((text) => ({ text }));
      case 'deepTalk': return shuffle(deepTalk.filter((d) => level === 0 || d.level === level), r).slice(0, count).map((d) => ({ text: d.q, tag: ['', 'Ringan', 'Sedang', 'Dalam'][d.level] }));
      case 'rapidFire': return shuffle(rapidFire, r).slice(0, count).map((text) => ({ text }));
      default: return shuffle(challenges, r).slice(0, count).map((text) => ({ text }));
    }
  }, [game.bank, seed, count, level]);
  const timed = game.bank === 'rapidFire';
  const [i, setI] = useState(0);
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [good, setGood] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const turn = i % players.length;
  const adv = (ok: boolean) => {
    const ns = scores.map((v, k) => v + (k === turn && ok ? 1 : 0));
    const ng = good + (ok ? 1 : 0);
    if (i + 1 >= cards.length) { onDone({ scores: ns, correct: ng, total: cards.length }); return; }
    setScores(ns); setGood(ng); setI(i + 1); setFlash(null);
  };
  const left = useCountdown(secs, `${i}-${level}`, timed && level !== 0 && !flash, () => { setFlash('Waktu habis!'); sfx.wrong(); });
  if (game.bank === 'deepTalk' && level === 0) {
    return (<div className="card center"><h2>Pilih tingkat percakapan</h2><p className="muted">Mulai dari ringan lalu naik pelan-pelan.</p>
      {([[1, 'Ringan'], [2, 'Sedang'], [3, 'Dalam']] as const).map(([l, t]) => <Button key={l} size="lg" variant="soft" className="gap" onClick={() => setLevel(l)}>{t}</Button>)}</div>);
  }
  const c = cards[i];
  if (!c) return <div className="card center"><p>Tidak ada kartu.</p><Button onClick={() => onDone({ scores, correct: 0, total: 0 })}>Selesai</Button></div>;
  const verb = timed ? ['Berhasil', 'Gagal'] : game.bank === 'challenges' ? ['Tantangan selesai', 'Lewati'] : ['Sudah dibahas', 'Lewati'];
  return (
    <div>
      <ProgressBar value={i / cards.length} />
      <p className="muted small gap">Kartu {i + 1}/{cards.length} · Giliran: <b>{players[turn]}</b></p>
      {timed && <div className={`timer ${left < 3 ? 'low' : ''}`}><div style={{ width: `${(left / secs) * 100}%` }} /></div>}
      <div className="qbox" style={{ minHeight: 140, display: 'grid', placeItems: 'center' }}><div>{c.tag && <span className="badge">{c.tag}</span>}<div style={{ marginTop: 8 }}>{c.text}</div>{flash && <p className="muted small gap">{flash}</p>}</div></div>
      <div className="row"><Button variant="ghost" className="grow" onClick={() => adv(false)}>{verb[1]}</Button><Button className="grow" onClick={() => { sfx.right(); adv(true); }} disabled={!!flash}>{verb[0]}</Button></div>
      <div className="gap"><Scoreboard players={players} scores={scores} turn={turn} /></div>
    </div>
  );
}
