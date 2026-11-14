import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Header, Select, useConfirm, useToast } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { RulesPeek } from '../../components/Rules';
import { BADGES, claimDaily, getProgress, recordResult, unlockLevel, useProgress } from '../progression/store';
import { DIFF_LABEL, poolStats, rankPlayers, xpForResult } from './engine';
import { gameById, GROUP_LABEL, withVariant } from './registry';
import { TurnMech } from './mechanics/Turn';
import { UnoRules, isUnoCustom } from './mechanics/UnoRules';
import { MonopolyMech } from './mechanics/Monopoly';
import { AnagramMech, BuzzerMech, TapMech, TypingMech, WordleMech } from './mechanics/Skill';
import { QuizMech, OrderMech, EstimateMech, CluesMech } from './mechanics/Quiz';
import { PairMech, PredictMech, LoveLangMech, DeckMech } from './mechanics/Social';
import { WheelMech, WordChainMech, StoryMech, WordGuessMech } from './mechanics/Party';
import { RpsMech } from './mechanics/Rps';
import { Connect4Mech, MemoryMech, ReflexMech, TicTacToeMech } from './mechanics/Board';
import { CatchMech, FlappyMech, SimonMech, SnakeMech, StroopMech, WhackMech } from './mechanics/Arcade';
import type { MechProps, Outcome } from './mechanics/types';
import type { Difficulty, GameDef, GameResult } from '../../types';
import { todayKey, uid } from '../../utils/rng';
import { sfx } from '../../utils/sound';
import { trackForGame } from '../../utils/music';
import { isFirebaseConfigured } from '../../lib/firebase/config';
import { useAuth } from '../auth/AuthContext';
import { useMusic } from '../../hooks/useMusic';
import { Emo } from '../../components/Emo';
import { LocalReactDock } from '../chat/Fx';

interface Cfg { count: number; secs: number; counts: number[]; secsOpts: number[] | null }
export function defaultsFor(g: GameDef): Cfg {
  switch (g.mechanic) {
    case 'rps': return { count: 5, secs: 0, counts: [3, 5, 7], secsOpts: null };
    case 'uno': case 'gaple': case 'ladder': case 'monopoly': case 'wordle': return { count: 1, secs: 0, counts: [1], secsOpts: null };
    case 'typing': return { count: 1, secs: 45, counts: [1], secsOpts: [30, 45, 60] };
    case 'tapbattle': return { count: 1, secs: 10, counts: [1], secsOpts: [10, 15, 20] };
    case 'anagram': return { count: 1, secs: 60, counts: [1], secsOpts: [45, 60, 90] };
    case 'buzzer': return { count: 8, secs: 0, counts: [5, 8, 12], secsOpts: null };
    case 'memorymatch': return { count: 8, secs: 0, counts: [6, 8, 10], secsOpts: null };
    case 'reflex': return { count: 5, secs: 0, counts: [3, 5, 7], secsOpts: null };
    case 'tictactoe': return { count: 3, secs: 0, counts: [1, 3, 5], secsOpts: null };
    case 'connect4': return { count: 1, secs: 0, counts: [1, 3], secsOpts: null };
    case 'whack': return { count: 1, secs: 30, counts: [1], secsOpts: [20, 30, 45] };
    case 'stroop': return { count: 1, secs: 30, counts: [1], secsOpts: [20, 30, 45] };
    case 'catch': return { count: 1, secs: 45, counts: [1], secsOpts: [30, 45, 60] };
    case 'simon': case 'snake': case 'flappy': return { count: 1, secs: 0, counts: [1], secsOpts: null };
    case 'order': return { count: 5, secs: 0, counts: [3, 5, 8], secsOpts: null };
    case 'estimate': return { count: 8, secs: 0, counts: [5, 8, 16], secsOpts: null };
    case 'clues': return { count: 6, secs: 0, counts: [4, 6, 8], secsOpts: null };
    case 'lovelang': return { count: 10, secs: 0, counts: [10], secsOpts: null };
    case 'wheel': return { count: 6, secs: 0, counts: [4, 6, 10, 999], secsOpts: null };
    case 'story': return { count: 8, secs: 0, counts: [6, 8, 12], secsOpts: null };
    case 'wordchain': return { count: 1, secs: 10, counts: [1], secsOpts: [6, 10, 15] };
    case 'wordguess': return { count: 1, secs: 60, counts: [1], secsOpts: [30, 60, 90] };
    case 'deck': return g.bank === 'rapidFire' ? { count: 10, secs: 8, counts: [5, 10, 15], secsOpts: [5, 8, 12] } : { count: 10, secs: 0, counts: [5, 10, 15], secsOpts: null };
    case 'pair': case 'match': case 'likely': case 'predict': return { count: 10, secs: 0, counts: [5, 10, 15], secsOpts: null };
    default:
      if (g.id === 'hitung') return { count: 10, secs: 15, counts: [5, 10, 20, 25, 30], secsOpts: [10, 15, 25] };
      if (g.id === 'kilat') return { count: 10, secs: 10, counts: [10], secsOpts: null };
      if (g.id === 'harian') return { count: 6, secs: 20, counts: [6], secsOpts: null };
      if (g.id === 'logika') return { count: 10, secs: 30, counts: [5, 10, 20, 25, 30], secsOpts: [20, 30, 45] };
      if (g.mechanic === 'mcq' || g.mechanic === 'flag') return { count: 20, secs: 20, counts: [10, 20, 25, 30], secsOpts: [10, 20, 30] };
      return { count: 10, secs: 20, counts: [5, 10, 15], secsOpts: [10, 20, 30] };
  }
}
export const MECH: Record<string, (p: MechProps) => ReactElement | null> = {
  mcq: QuizMech, tf: QuizMech, 'chain-tf': QuizMech, era: QuizMech, flag: QuizMech, order: OrderMech, estimate: EstimateMech, clues: CluesMech,
  pair: PairMech, match: PairMech, likely: PairMech, predict: PredictMech, deck: DeckMech, wheel: WheelMech, wordchain: WordChainMech,
  story: StoryMech, wordguess: WordGuessMech, lovelang: LoveLangMech,
  uno: TurnMech, gaple: TurnMech, ladder: TurnMech, monopoly: MonopolyMech, rps: RpsMech, wordle: WordleMech, typing: TypingMech, tapbattle: TapMech, anagram: AnagramMech, buzzer: BuzzerMech,
  memorymatch: MemoryMech, reflex: ReflexMech, tictactoe: TicTacToeMech, connect4: Connect4Mech,
  whack: WhackMech, stroop: StroopMech, simon: SimonMech, snake: SnakeMech, flappy: FlappyMech, catch: CatchMech,
};

export default function GamePage() {
  const { id = '' } = useParams();
  const game = gameById(id);
  const nav = useNavigate();
  const prog = useProgress();
  const toast = useToast();
  const ask = useConfirm();
  const { me } = useAuth();
  const [phase, setPhase] = useState<'setup' | 'play' | 'result'>('setup');
  const [names, setNames] = useState<string[]>([]);
  const [bot, setBot] = useState<'' | 'santai' | 'serius' | 'campur'>('');
  const [cfg, setCfg] = useState<{ count: number; secs: number } | null>(null);
  const [session, setSession] = useState({ id: '', seed: '' });
  const [out, setOut] = useState<Outcome | null>(null);
  const [xpGot, setXpGot] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [practice, setPractice] = useState(false);
  const [variant, setVariant] = useState('');
  const [mode, setMode] = useState<'santai' | 'level' | 'endless'>('santai');
  const [level, setLevel] = useState(1);
  const [diff, setDiff] = useState<'semua' | Difficulty>('semua');
  const [levelMsg, setLevelMsg] = useState('');
  const recorded = useRef(false);
  const d = useMemo(() => (game ? defaultsFor(game) : null), [game]);
  useMusic(phase === 'play' && game ? trackForGame(game) : 'cozy');
  // Statistik jumlah soal per pilihan topik (untuk label "maks", pilihan tingkat kesulitan, dan batas jumlah soal per ronde).
  const statsAll = useMemo(() => (game && game.variants && game.id !== 'harian' && (game.mechanic === 'mcq' || game.mechanic === 'buzzer') ? Object.fromEntries(game.variants.map((v) => [v.id, poolStats(withVariant(game, v.id))])) : null), [game]);
  const st = statsAll ? statsAll[variant] ?? null : null;
  const avail = st ? (st.unlimited ? Infinity : diff === 'semua' ? st.total : st[diff]) : Infinity;
  useEffect(() => {
    if (!cfg || !d || !Number.isFinite(avail) || cfg.count >= 999 || cfg.count <= avail) return;
    const ok = d.counts.filter((c) => c <= avail && c < 999);
    setCfg({ ...cfg, count: ok.length ? Math.max(...ok) : Math.max(1, avail) });
  }, [avail]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!game) return;
    const base = game.id === 'tim' ? ['Tim A', 'Tim B'] : Array.from({ length: Math.max(game.minPlayers, game.id === 'duel' || game.maxPlayers === 1 ? 1 : game.minPlayers) }, (_, i) => (i === 0 && (me?.handle ? me.displayName : prog.name) ? (me?.handle ? me.displayName : prog.name) : `Pemain ${i + 1}`));
    setNames(base); if (d) setCfg({ count: d.count, secs: d.secs });
    setBot(''); setPhase('setup'); setOut(null); recorded.current = false; setVariant(game.variants?.[0]?.id ?? ''); setDiff('semua');
  }, [game?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!game || !d || !cfg) return <EmptyState icon="search" title="Game tidak ditemukan" action={<Link to="/game"><Button>Lihat semua game</Button></Link>} />;
  const eg = withVariant(game, variant);
  // UNO solo: pemain 1 manusia, sisanya bot (santai / serius / campur)
  const botSpec: (string | null)[] = names.map((_, i) => (game.mechanic === 'uno' && bot && i > 0 ? (bot === 'campur' ? (i % 2 === 1 ? 'santai' : 'serius') : bot) : null));
  const playNames = names.map((n, i) => (botSpec[i] ? `Bot ${i} (${botSpec[i]})` : n));
  const daily = game.id === 'harian';
  const quizLike = ['mcq', 'tf', 'era', 'flag'].includes(game.mechanic) && !daily;
  const lvKey = `${game.id}:${variant}`;
  const passedLv = prog.levels?.[lvKey] ?? 0;
  const lvSecs = Math.max(8, Math.round(22 - level * 1.5));
  const doneToday = daily && prog.dailyDone === todayKey();
  const start = () => {
    const sid = uid();
    setSession({ id: sid, seed: daily ? `daily-${todayKey()}` : `${game.id}-${sid}` });
    setPractice(doneToday); setPhase('play'); recorded.current = false; sfx.tick();
  };
  const finish = (o: Outcome) => {
    setOut(o);
    if (!recorded.current) {
      recorded.current = true;
      let xp = o.xp !== undefined ? Math.max(0, Math.min(100, Math.round(o.xp))) : xpForResult(o.correct, o.total);
      if (quizLike && mode === 'level') {
        const ok = o.total > 0 && o.correct / o.total >= 0.7;
        if (ok) unlockLevel(lvKey, level);
        setLevelMsg(ok ? `Level ${level} lulus! Level ${Math.min(10, level + 1)} terbuka.` : `Level ${level} belum lulus (butuh minimal 70% benar). Coba lagi!`);
      } else setLevelMsg(quizLike && mode === 'endless' ? `Kamu bertahan sampai ${o.correct} jawaban benar sebelum nyawa habis.` : '');
      if (daily) { if (practice || !claimDaily()) xp = 0; else xp += 30; }
      const res: GameResult = { sessionId: session.id, gameId: game.id, at: Date.now(), players: playNames.map((n, i) => ({ name: n, score: o.scores[i] ?? 0 })), correct: o.correct, total: o.total, xp };
      const r = recordResult(res);
      setXpGot(r.xp); setNewBadges(r.newBadges);
      if (r.newBadges.length) toast('Pencapaian baru terbuka!', 'ok');
    }
    sfx.win(); setPhase('result');
  };
  if (phase === 'setup') {
    const setN = (i: number, v: string) => setNames(names.map((n, k) => (k === i ? v : n)));
    const canMulti = game.maxPlayers > 1 && !daily && game.id !== 'tim';
    const pickVariant = (id: string) => { setVariant(id === 'custom' ? 'custom-s' : id); setDiff('semua'); };
    const vLabel = (v: { id: string; label: string }) => { const s = statsAll?.[v.id]; return s ? `${v.label} · ${s.unlimited ? 'tanpa batas' : `maks ${s.total} soal`}` : v.label; };
    const fit = Number.isFinite(avail) ? d.counts.filter((c) => c <= avail || c >= 999) : d.counts;
    const shownCounts = fit.length ? fit : [Math.max(1, avail)];
    return (
      <div className="page">
        <Header title={game.title} back={() => nav('/game')} />
        <div className="hero"><Badge>{GROUP_LABEL[game.group]}</Badge><h2 style={{ marginTop: 8 }}>{game.tagline}</h2></div>
        <Card><h3>Cara bermain</h3><ol style={{ paddingLeft: 20, marginBottom: 0 }}>{game.rules.map((r, i) => <li key={i}>{r}</li>)}</ol></Card>
        {doneToday && <div className="expl">Tantangan hari ini sudah kamu selesaikan. Kamu masih bisa berlatih (tanpa XP).</div>}
        <Card>
          <h3>Pengaturan</h3>
          {canMulti && game.maxPlayers > 1 && (
            <div className="row wrap gap">
              <span className="small">Jumlah pemain:</span>
              {Array.from({ length: game.maxPlayers - game.minPlayers + 1 }, (_, k) => game.minPlayers + k).map((n) => (
                <button key={n} className={`chip ${names.length === n ? 'on' : ''}`} onClick={() => setNames(Array.from({ length: n }, (_, i) => names[i] ?? `Pemain ${i + 1}`))}>{n}</button>))}
            </div>)}
          {game.mechanic === 'uno' && (
            <div className="gap">
              <div className="row wrap gap"><span className="small">Lawan bot:</span>{([['', 'Tanpa bot'], ['santai', 'Bot santai'], ['serius', 'Bot serius'], ['campur', 'Campur']] as const).map(([k, t]) => <button key={k} className={`chip ${bot === k ? 'on' : ''}`} onClick={() => setBot(k)}>{t}</button>)}</div>
              {bot && <p className="small muted">Kamu pemain 1, pemain lain dimainkan bot. Santai: main acak dan kadang lalai. Serius: menghitung tiap langkah, tapi tetap bisa kamu kalahkan.</p>}
            </div>)}
          {names.map((n, i) => botSpec[i] ? <p key={i} className="small muted">Pemain {i + 1}: Bot {botSpec[i]}</p> : <label key={i} className="field gap"><span>{game.id === 'tim' ? `Nama tim ${i + 1}` : `Nama pemain ${i + 1}`}</span><input value={n} maxLength={20} onChange={(e) => setN(i, e.target.value)} /></label>)}
          {game.variants && game.variants.length > 1 && (game.variants.length > 6 ? <div className="gap"><Select label="Topik / varian" value={variant} onChange={pickVariant} options={game.variants.map((v) => ({ value: v.id, label: vLabel(v) }))} /></div> : <div className="row wrap gap"><span className="small">Varian:</span>{game.variants.map((v) => <button key={v.id} className={`chip ${variant === v.id || variant.startsWith(`${v.id}-`) ? 'on' : ''}`} onClick={() => pickVariant(v.id)}>{vLabel(v)}</button>)}</div>)}
          {game.id === 'uno' && isUnoCustom(variant) && <UnoRules value={variant} onChange={setVariant} />}
          {quizLike && <div className="row wrap gap"><span className="small">Mode:</span>{([['santai', 'Santai'], ['level', 'Level'], ['endless', 'Tanpa batas']] as const).map(([m, t]) => <button key={m} className={`chip ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}>{t}</button>)}</div>}
          {quizLike && mode === 'level' && <div className="row wrap gap"><span className="small">Level:</span>{Array.from({ length: 10 }, (_, k) => k + 1).map((l) => <button key={l} className={`chip ${level === l ? 'on' : ''}`} disabled={l > passedLv + 1} onClick={() => setLevel(l)}>{l > passedLv + 1 ? <><Emo t="🔒" />{l}</> : l}</button>)}</div>}
          {quizLike && mode === 'level' && <p className="small muted">Level {level}: 10 soal, waktu {lvSecs} detik. Lulus bila benar ≥ 70%. Makin tinggi, makin sulit.</p>}
          {quizLike && mode === 'endless' && <p className="small muted">3 nyawa, soal tak berhenti. Soal yang belum pernah kamu lihat didahulukan.</p>}
          {d.counts.length > 1 && !(quizLike && mode !== 'santai') && <div className="row wrap gap"><span className="small">{game.mechanic === 'deck' || game.mechanic === 'wheel' ? 'Jumlah kartu/putaran:' : game.mechanic === 'memorymatch' ? 'Jumlah pasangan:' : game.group === 'arkade' ? 'Jumlah ronde:' : 'Jumlah soal/ronde:'}</span>{shownCounts.map((c) => <button key={c} className={`chip ${cfg.count === c ? 'on' : ''}`} onClick={() => setCfg({ ...cfg, count: c })}>{c >= 999 ? '∞ Tanpa batas' : c}</button>)}</div>}
          {quizLike && mode === 'santai' && game.mechanic === 'mcq' && st && !st.unlimited && <div className="row wrap gap"><span className="small">Kesulitan:</span>{(['semua', 'mudah', 'sedang', 'sulit'] as const).map((k) => { const n = k === 'semua' ? st.total : st[k]; return <button key={k} className={`chip ${diff === k ? 'on' : ''}`} disabled={n === 0} onClick={() => setDiff(k)}>{k === 'semua' ? 'Semua' : DIFF_LABEL[k]} ({n})</button>; })}</div>}
          {st && <p className="small muted">{st.unlimited ? 'Soal pada topik ini dibuat otomatis, jadi tanpa batas.' : `Tersedia ${st.total} soal di topik ini (Mudah ${st.mudah} · Sedang ${st.sedang} · Sulit ${st.sulit}).${quizLike && mode === 'santai' ? ` Maksimal ${avail} soal per ronde${diff !== 'semua' ? ` untuk tingkat ${DIFF_LABEL[diff]}` : ''}.` : ''}`}</p>}
          {d.secsOpts && !(quizLike && mode !== 'santai') && <div className="row wrap gap"><span className="small">Waktu (detik):</span>{d.secsOpts.map((c) => <button key={c} className={`chip ${cfg.secs === c ? 'on' : ''}`} onClick={() => setCfg({ ...cfg, secs: c })}>{c}</button>)}</div>}
        </Card>
        <Button size="lg" icon="play" onClick={() => { setNames(names.map((n, i) => n.trim() || `Pemain ${i + 1}`)); start(); }}>{doneToday ? 'Berlatih' : 'Mulai main'}</Button>
        {game.multiplayer && <Link to={`/lobi?game=${game.id}&v=${variant}`}><Button size="lg" variant="soft" icon="users" className="gap">Main online dengan teman{isFirebaseConfigured ? '' : ' (butuh Firebase)'}</Button></Link>}
        <p className="muted small center gap">{game.offline ? 'Mode solo/bergiliran ini bisa dimainkan tanpa internet.' : ''}</p>
      </div>
    );
  }
  if (phase === 'play') {
    const M = MECH[game.mechanic] as (p: MechProps) => ReactElement | null;
    return (
      <div className="page">
        <Header title={game.title} back={() => { void ask({ title: 'Keluar dari permainan?', text: 'Kemajuan ronde ini tidak disimpan.', ok: 'Keluar', danger: true }).then((y) => { if (y) setPhase('setup'); }); }} />
        <RulesPeek rules={game.rules} defaultOpen={game.mechanic === 'connect4' || game.mechanic === 'rps'} />
        <M key={session.id} game={eg} players={playNames} bots={botSpec} seed={session.seed} count={quizLike && mode === 'level' ? 10 : cfg.count} secs={quizLike && mode === 'level' ? lvSecs : quizLike && mode === 'endless' ? 15 : cfg.secs || 20} onDone={finish} mode={quizLike ? mode : undefined} level={level} difficulty={quizLike && mode === 'santai' && game.mechanic === 'mcq' ? diff : undefined} />
        <div style={{ height: 64 }} aria-hidden="true" />
        <LocalReactDock />
      </div>
    );
  }
  const ranked = rankPlayers(playNames.map((n, i) => ({ name: n, score: out?.scores[i] ?? 0 })));
  const tie = ranked.length > 1 && ranked[0]?.score === ranked[1]?.score;
  return (
    <div className="page">
      <Header title="Hasil" />
      <div className="hero center"><div style={{ fontSize: '3rem' }}><Emo t="🏆" /></div><h2>{ranked.length > 1 ? (tie ? 'Seri! Kalian sama kuat.' : `${ranked[0]?.name} menang!`) : 'Permainan selesai!'}</h2>
        <p>{out?.headline ?? `${out?.correct} dari ${out?.total} berhasil`}{xpGot > 0 ? ` · +${xpGot} XP` : ''}</p></div>
      {levelMsg && <div className="expl"><b>{levelMsg}</b></div>}
      {out?.summary}
      {ranked.length > 1 && ranked.map((p, i) => <div key={i} className={`score-row ${i === 0 && !tie ? 'top' : ''}`}><span>{i + 1}. {p.name}</span><span>{p.score}</span></div>)}
      {ranked.length === 1 && <div className="score-row top"><span>{ranked[0]?.name}</span><span>{ranked[0]?.score} poin</span></div>}
      {newBadges.map((b) => { const bd = BADGES.find((x) => x.id === b); return bd ? <Card key={b}><div className="row"><Icon name="trophy" /><div><b>{bd.title}</b><div className="small muted">{bd.desc}</div></div></div></Card> : null; })}
      {daily && <p className="center muted small">Streak harian: {getProgress().streak.count} hari</p>}
      <div className="row gap"><Button variant="ghost" className="grow" onClick={() => nav('/')}>Beranda</Button><Button className="grow" onClick={() => { setPhase('setup'); }}>Main lagi</Button></div>
    </div>
  );
}
