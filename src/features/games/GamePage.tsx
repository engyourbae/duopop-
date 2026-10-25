import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Header, useConfirm, useToast } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { BADGES, claimDaily, getProgress, recordResult, useProgress } from '../progression/store';
import { rankPlayers, xpForResult } from './engine';
import { gameById, GROUP_LABEL } from './registry';
import { QuizMech, OrderMech, EstimateMech, CluesMech } from './mechanics/Quiz';
import { PairMech, PredictMech, LoveLangMech, DeckMech } from './mechanics/Social';
import { WheelMech, WordChainMech, StoryMech, WordGuessMech } from './mechanics/Party';
import { Connect4Mech, MemoryMech, ReflexMech, TicTacToeMech } from './mechanics/Board';
import { CatchMech, FlappyMech, SimonMech, SnakeMech, StroopMech, WhackMech } from './mechanics/Arcade';
import type { MechProps, Outcome } from './mechanics/types';
import type { GameDef, GameResult } from '../../types';
import { todayKey, uid } from '../../utils/rng';
import { sfx } from '../../utils/sound';
import { isFirebaseConfigured } from '../../lib/firebase/config';

interface Cfg { count: number; secs: number; counts: number[]; secsOpts: number[] | null }
export function defaultsFor(g: GameDef): Cfg {
  switch (g.mechanic) {
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
    case 'wheel': return { count: 6, secs: 0, counts: [4, 6, 10], secsOpts: null };
    case 'story': return { count: 8, secs: 0, counts: [6, 8, 12], secsOpts: null };
    case 'wordchain': return { count: 1, secs: 10, counts: [1], secsOpts: [6, 10, 15] };
    case 'wordguess': return { count: 1, secs: 60, counts: [1], secsOpts: [30, 60, 90] };
    case 'deck': return g.bank === 'rapidFire' ? { count: 10, secs: 8, counts: [5, 10, 15], secsOpts: [5, 8, 12] } : { count: 10, secs: 0, counts: [5, 10, 15], secsOpts: null };
    case 'pair': case 'match': case 'likely': case 'predict': return { count: 10, secs: 0, counts: [5, 10, 15], secsOpts: null };
    default:
      if (g.id === 'kilat') return { count: 10, secs: 10, counts: [10], secsOpts: null };
      if (g.id === 'harian') return { count: 6, secs: 20, counts: [6], secsOpts: null };
      if (g.id === 'logika') return { count: 10, secs: 30, counts: [5, 10], secsOpts: [20, 30, 45] };
      return { count: 10, secs: 20, counts: [5, 10, 15], secsOpts: [10, 20, 30] };
  }
}
const MECH: Record<string, (p: MechProps) => ReactElement | null> = {
  mcq: QuizMech, tf: QuizMech, 'chain-tf': QuizMech, era: QuizMech, flag: QuizMech, order: OrderMech, estimate: EstimateMech, clues: CluesMech,
  pair: PairMech, match: PairMech, likely: PairMech, predict: PredictMech, deck: DeckMech, wheel: WheelMech, wordchain: WordChainMech,
  story: StoryMech, wordguess: WordGuessMech, lovelang: LoveLangMech,
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
  const [phase, setPhase] = useState<'setup' | 'play' | 'result'>('setup');
  const [names, setNames] = useState<string[]>([]);
  const [cfg, setCfg] = useState<{ count: number; secs: number } | null>(null);
  const [session, setSession] = useState({ id: '', seed: '' });
  const [out, setOut] = useState<Outcome | null>(null);
  const [xpGot, setXpGot] = useState(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [practice, setPractice] = useState(false);
  const recorded = useRef(false);
  const d = useMemo(() => (game ? defaultsFor(game) : null), [game]);
  useEffect(() => {
    if (!game) return;
    const base = game.id === 'tim' ? ['Tim A', 'Tim B'] : Array.from({ length: Math.max(game.minPlayers, game.id === 'duel' || game.maxPlayers === 1 ? 1 : game.minPlayers) }, (_, i) => (i === 0 && prog.name ? prog.name : `Pemain ${i + 1}`));
    setNames(base); if (d) setCfg({ count: d.count, secs: d.secs });
    setPhase('setup'); setOut(null); recorded.current = false;
  }, [game?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!game || !d || !cfg) return <EmptyState icon="search" title="Game tidak ditemukan" action={<Link to="/game"><Button>Lihat semua game</Button></Link>} />;
  const daily = game.id === 'harian';
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
      if (daily) { if (practice || !claimDaily()) xp = 0; else xp += 30; }
      const res: GameResult = { sessionId: session.id, gameId: game.id, at: Date.now(), players: names.map((n, i) => ({ name: n, score: o.scores[i] ?? 0 })), correct: o.correct, total: o.total, xp };
      const r = recordResult(res);
      setXpGot(r.xp); setNewBadges(r.newBadges);
      if (r.newBadges.length) toast('Pencapaian baru terbuka!', 'ok');
    }
    sfx.win(); setPhase('result');
  };
  if (phase === 'setup') {
    const setN = (i: number, v: string) => setNames(names.map((n, k) => (k === i ? v : n)));
    const canMulti = game.maxPlayers > 1 && !daily && game.id !== 'tim';
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
          {names.map((n, i) => <label key={i} className="field gap"><span>{game.id === 'tim' ? `Nama tim ${i + 1}` : `Nama pemain ${i + 1}`}</span><input value={n} maxLength={20} onChange={(e) => setN(i, e.target.value)} /></label>)}
          {d.counts.length > 1 && <div className="row wrap gap"><span className="small">{game.mechanic === 'deck' || game.mechanic === 'wheel' ? 'Jumlah kartu/putaran:' : game.mechanic === 'memorymatch' ? 'Jumlah pasangan:' : game.group === 'arkade' ? 'Jumlah ronde:' : 'Jumlah soal/ronde:'}</span>{d.counts.map((c) => <button key={c} className={`chip ${cfg.count === c ? 'on' : ''}`} onClick={() => setCfg({ ...cfg, count: c })}>{c}</button>)}</div>}
          {d.secsOpts && <div className="row wrap gap"><span className="small">Waktu (detik):</span>{d.secsOpts.map((c) => <button key={c} className={`chip ${cfg.secs === c ? 'on' : ''}`} onClick={() => setCfg({ ...cfg, secs: c })}>{c}</button>)}</div>}
        </Card>
        <Button size="lg" icon="play" onClick={() => { setNames(names.map((n, i) => n.trim() || `Pemain ${i + 1}`)); start(); }}>{doneToday ? 'Berlatih' : 'Mulai main'}</Button>
        {game.multiplayer && <Link to={`/lobi?game=${game.id}`}><Button size="lg" variant="soft" icon="users" className="gap">Main online dengan teman{isFirebaseConfigured ? '' : ' (butuh Firebase)'}</Button></Link>}
        <p className="muted small center gap">{game.offline ? 'Mode solo/bergiliran ini bisa dimainkan tanpa internet.' : ''}</p>
      </div>
    );
  }
  if (phase === 'play') {
    const M = MECH[game.mechanic] as (p: MechProps) => ReactElement | null;
    return (
      <div className="page">
        <Header title={game.title} back={() => { void ask({ title: 'Keluar dari permainan?', text: 'Kemajuan ronde ini tidak disimpan.', ok: 'Keluar', danger: true }).then((y) => { if (y) setPhase('setup'); }); }} />
        <M key={session.id} game={game} players={names} seed={session.seed} count={cfg.count} secs={cfg.secs || 20} onDone={finish} />
      </div>
    );
  }
  const ranked = rankPlayers(names.map((n, i) => ({ name: n, score: out?.scores[i] ?? 0 })));
  const tie = ranked.length > 1 && ranked[0]?.score === ranked[1]?.score;
  return (
    <div className="page">
      <Header title="Hasil" />
      <div className="hero center"><div style={{ fontSize: '3rem' }}>🏆</div><h2>{ranked.length > 1 ? (tie ? 'Seri! Kalian sama kuat.' : `${ranked[0]?.name} menang!`) : 'Permainan selesai!'}</h2>
        <p>{out?.headline ?? `${out?.correct} dari ${out?.total} berhasil`}{xpGot > 0 ? ` · +${xpGot} XP` : ''}</p></div>
      {out?.summary}
      {ranked.length > 1 && ranked.map((p, i) => <div key={i} className={`score-row ${i === 0 && !tie ? 'top' : ''}`}><span>{i + 1}. {p.name}</span><span>{p.score}</span></div>)}
      {ranked.length === 1 && <div className="score-row top"><span>{ranked[0]?.name}</span><span>{ranked[0]?.score} poin</span></div>}
      {newBadges.map((b) => { const bd = BADGES.find((x) => x.id === b); return bd ? <Card key={b}><div className="row"><Icon name="trophy" /><div><b>{bd.title}</b><div className="small muted">{bd.desc}</div></div></div></Card> : null; })}
      {daily && <p className="center muted small">Streak harian: {getProgress().streak.count} hari</p>}
      <div className="row gap"><Button variant="ghost" className="grow" onClick={() => nav('/')}>Beranda</Button><Button className="grow" onClick={() => { setPhase('setup'); }}>Main lagi</Button></div>
    </div>
  );
}
