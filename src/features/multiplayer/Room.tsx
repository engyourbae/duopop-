import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, ErrorState, Header, Spinner, useToast } from '../../components/ui';
import { ShareSheet } from '../../components/Share';
import { RequireAuth } from '../auth/Guards';
import { useAuth } from '../auth/AuthContext';
import { gameById, withVariant } from '../games/registry';
import { TurnBoard, TURN_ENGINES } from '../games/mechanics/Turn';
import { replayTurns } from '../games/engines/types';
import { MECH } from '../games/GamePage';
import { recordResult } from '../progression/store';
import { buildRounds, roomCapacity, roomKind, roundComplete, scoreRounds, type RoomRound } from './rounds';
import { replayBoard } from './board';
import { FriendInviter } from './Invite';
import { Social } from '../chat/Social';
import { LETTERS, type MechProps } from '../games/mechanics/types';
import type { Room, RoomAnswer, RoomScore } from '../../services/rooms';
import { useMusic } from '../../hooks/useMusic';
import { explainError } from '../../utils/errors';
import { sfx } from '../../utils/sound';

export default function RoomPage() { return <RequireAuth need="Ruang online memerlukan akun."><RoomInner /><RoomSocialHost /></RequireAuth>; }
/** Chat + reaksi sementara untuk semua tampilan ruang. */
function RoomSocialHost() {
  const { code = '' } = useParams();
  const { me } = useAuth();
  if (!me || !code) return null;
  return <><div style={{ height: 64 }} /><Social scope={{ kind: 'room', id: code.toUpperCase() }} me={me} title={`Chat ruang ${code.toUpperCase()}`} /></>;
}
const svc = () => import('../../services/rooms');

function RoomInner() {
  const { code = '' } = useParams();
  const { me } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [answers, setAnswers] = useState<RoomAnswer[]>([]);
  const [scoreDocs, setScoreDocs] = useState<RoomScore[]>([]);
  const [err, setErr] = useState('');
  const [now, setNow] = useState(Date.now());
  const [shareOpen, setShareOpen] = useState(false);
  const saved = useRef(false);
  const lastRoom = useRef<Room | null>(null);
  const frozen = useRef<Record<string, number> | null>(null);
  useEffect(() => {
    let o1: (() => void) | undefined, o2: (() => void) | undefined, o3: (() => void) | undefined, dead = false;
    void svc().then((r) => {
      if (dead) return;
      o1 = r.watchRoom(code, (rm) => { if (rm) { lastRoom.current = rm; setRoom(rm); } else if (lastRoom.current?.status === 'finished') { /* ruang dibersihkan host; hasil tetap ditampilkan */ } else setRoom(null); }, () => setErr('Tidak bisa membuka ruang. Kamu mungkin belum bergabung atau koneksi terputus.'));
      o2 = r.watchAnswers(code, setAnswers); o3 = r.watchScores(code, setScoreDocs);
    }).catch(() => setErr('Gagal memuat layanan online.'));
    return () => { dead = true; o1?.(); o2?.(); o3?.(); };
  }, [code]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);
  const baseGame = room ? gameById(room.gameId) : undefined;
  const game = baseGame ? withVariant(baseGame, room?.variant) : undefined;
  const kind = game ? roomKind(game) : 'rounds';
  const uids = useMemo(() => Object.keys(room?.players ?? {}).sort(), [room?.players]);
  const names = uids.map((u) => room?.players[u]?.name ?? '?');
  useMusic(room?.status === 'playing' ? (game?.group === 'arkade' ? 'arkade' : 'game') : 'lobi');
  const rounds = useMemo(() => (room && game && kind === 'rounds' && room.status !== 'lobby' ? buildRounds(game, room.seed, room.count, names) : []), [room?.seed, room?.count, room?.status, game, kind, names.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const startsMs = useMemo(() => Object.fromEntries(Object.entries(room?.starts ?? {}).map(([k, v]) => [k, v ? v.toMillis() : null])), [room?.starts]);
  const lite = useMemo(() => answers.map((a) => ({ uid: a.uid, round: a.round, choice: a.choice, atMs: a.at ? a.at.toMillis() : null, text: a.text })), [answers]);
  const isHost = !!room && !!me && room.hostUid === me.uid;

  // ---- skor per jenis ----
  const board = useMemo(() => (game && kind === 'board' ? replayBoard(game.mechanic as 'tictactoe' | 'connect4', [...lite].sort((a, b) => a.round - b.round)) : null), [lite, game, kind]);
  const turn = useMemo(() => (game && kind === 'turn' && room ? replayTurns(TURN_ENGINES[game.mechanic] as never, uids, room.seed, [...lite].sort((a, b) => a.round - b.round || (a.atMs ?? 0) - (b.atMs ?? 0))) : null), [lite, game, kind, room?.seed, uids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const turnWin = turn && game ? (TURN_ENGINES[game.mechanic] as unknown as { winner: (s: unknown) => number }).winner(turn.s) : -1;
  const scores: Record<string, number> = useMemo(() => {
    if (!room) return {};
    if (kind === 'turn') return Object.fromEntries(uids.map((u, i) => [u, turnWin === i ? 1 : 0]));
    if (kind === 'rounds') return scoreRounds(rounds, lite, startsMs, room.secs, uids);
    if (kind === 'board') return Object.fromEntries(uids.map((u, i) => [u, board?.winner === i + 1 ? 1 : 0]));
    return Object.fromEntries(uids.map((u) => [u, scoreDocs.find((s) => s.uid === u)?.score ?? 0]));
  }, [room, kind, rounds, lite, startsMs, uids, board, scoreDocs, turnWin]);

  const finalScores = room?.status === 'finished' ? (frozen.current ?? (Object.keys(scores).length ? (frozen.current = scores) : scores)) : scores;
  // Host membersihkan ruang 45 dtk setelah selesai (atau saat keluar dari layar hasil)
  useEffect(() => {
    if (!room || room.status !== 'finished' || !isHost) return;
    const run = () => { void svc().then((r) => r.cleanupRoom(code)).catch(() => undefined); };
    const t = setTimeout(run, 45000);
    return () => { clearTimeout(t); run(); };
  }, [room?.status, isHost]); // eslint-disable-line react-hooks/exhaustive-deps
  // ---- otomatis: mulai ruang cepat, selesaikan papan/adu skor ----
  useEffect(() => {
    if (!room || !isHost || room.status !== 'lobby' || !room.auto || uids.length < 2) return;
    const t = setTimeout(() => { void svc().then((r) => r.startRoom(code)).catch(() => undefined); }, 3000);
    return () => clearTimeout(t);
  }, [room?.status, room?.auto, isHost, uids.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const raceAllIn = kind === 'race' && uids.length > 0 && uids.every((u) => scoreDocs.some((s) => s.uid === u));
  useEffect(() => {
    if (!room || !isHost || room.status !== 'playing') return;
    if ((kind === 'board' && board?.over) || (kind === 'turn' && turnWin >= 0) || raceAllIn) { const t = setTimeout(() => { void svc().then((r) => r.finishRoom(code)).catch(() => undefined); }, 2200); return () => clearTimeout(t); }
  }, [board?.over, turnWin, raceAllIn, room?.status, isHost, kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- ronde sinkron ----
  const round = room?.round ?? 0;
  const rd: RoomRound | undefined = rounds[round];
  const start = startsMs[String(round)] ?? null;
  const left = room && start ? Math.max(0, room.secs - (now - start) / 1000) : 0;
  const roundAns = answers.filter((a) => a.round === round);
  const complete = !!rd && roundComplete(rd, roundAns.map((a) => a.uid), uids);
  const reveal = kind === 'rounds' && !!rd && !!start && room?.status === 'playing' && (complete || left <= 0);
  const revealSecs = room?.pause && room.pause > 0 ? room.pause : 8;
  const revealAt = useRef<{ round: number; at: number } | null>(null);
  if (reveal && revealAt.current?.round !== round) revealAt.current = { round, at: Date.now() };
  useEffect(() => {
    if (!room || !isHost || !reveal) return;
    const t = setTimeout(() => { void svc().then((r) => r.nextRound(code, round, rounds.length)).catch(() => toast('Gagal melanjutkan ronde', 'err')); }, revealSecs * 1000);
    return () => clearTimeout(t);
  }, [reveal, round, isHost]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (reveal && rd?.scoring === 'quiz' && me) { const c = roundAns.find((a) => a.uid === me.uid)?.choice; if (c !== undefined) (c === rd.correct ? sfx.right : sfx.wrong)(); } }, [reveal]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- simpan hasil sekali ----
  useEffect(() => {
    if (!room || room.status !== 'finished' || !me || saved.current) return;
    saved.current = true;
    const ranked = uids.slice().sort((a, b) => (finalScores[b] ?? 0) - (finalScores[a] ?? 0)), rank = ranked.indexOf(me.uid), win = rank === 0 && (finalScores[me.uid] ?? 0) > 0;
    recordResult({ sessionId: `room-${room.code}-${room.seed}`, gameId: room.gameId, at: Date.now(), players: uids.map((u) => ({ name: room.players[u]?.name ?? '?', score: finalScores[u] ?? 0 })), correct: win ? 1 : 0, total: 1, xp: Math.min(100, 30 + (rank === 0 ? 40 : rank === 1 ? 20 : 10)) });
  }, [room?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) return <ErrorState text={err} onRetry={() => nav('/lobi')} />;
  if (room === undefined) return <Spinner label="Menghubungkan ke ruang…" />;
  if (room === null || !me || !game) return <ErrorState text="Ruang tidak ditemukan atau sudah dihapus." onRetry={() => nav('/lobi')} />;
  if (!room.players[me.uid]) return <ErrorState text="Kamu belum bergabung di ruang ini. Buka Lobi lalu masukkan kodenya." onRetry={() => nav(`/lobi/${code}`)} />;
  const link = `${location.origin}${location.pathname}#/lobi/${room.code}`;
  const ranked = uids.map((u) => ({ uid: u, name: room.players[u]?.name ?? '?', score: finalScores[u] ?? 0 })).sort((a, b) => b.score - a.score);
  const act = async (f: () => Promise<unknown>) => { try { await f(); } catch (e) { toast(explainError(e), 'err'); } };
  const myIdx = uids.indexOf(me.uid);

  // ================= Ruang tunggu =================
  if (room.status === 'lobby') {
    const cap = roomCapacity(game);
    return (
      <div className="page"><Header title="Ruang Tunggu" back={() => nav('/lobi')} />
        <Card className="center"><p className="muted">{game.title}{room.auto ? ' · pertandingan cepat' : ''}</p>
          {room.auto ? <h2>{uids.length < 2 ? 'Menunggu lawan bergabung…' : 'Lawan ditemukan! Mulai sebentar lagi…'}</h2> : <><div className="code">{room.code}</div>
            <div className="row"><Button variant="soft" icon="copy" className="grow" onClick={() => { void navigator.clipboard?.writeText(room.code).then(() => toast('Kode disalin', 'ok')).catch(() => toast('Tidak bisa menyalin', 'err')); }}>Salin kode</Button>
              <Button variant="soft" icon="share" className="grow" onClick={() => setShareOpen(true)}>Bagikan</Button></div></>}
        </Card>
        <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} text={`Ayo main ${game.title} di DUOPOP! Kode: ${room.code}`} url={link} />
        <h3>Pemain ({uids.length}/{cap})</h3>
        {uids.map((u) => <div key={u} className="score-row"><span>{room.players[u]?.name}{u === room.hostUid ? ' · Host' : ''}{u === me.uid ? ' (kamu)' : ''}</span></div>)}
        {isHost && !room.auto && uids.length < cap && <><h3 className="gap">Undang teman online</h3><FriendInviter code={room.code} gameId={room.gameId} /></>}
        <div className="row gap"><Button variant="ghost" onClick={() => void act(async () => { const r = await svc(); await r.leaveRoom(code, me.uid); nav('/lobi'); })}>Keluar</Button>
          {isHost && !room.auto ? <Button className="grow" disabled={uids.length < 2} onClick={() => void act(async () => (await svc()).startRoom(code))}>{uids.length < 2 ? 'Menunggu pemain lain…' : 'Mulai permainan'}</Button> : <p className="muted grow center">{room.auto ? 'Memulai otomatis…' : 'Menunggu host memulai…'}</p>}</div>
      </div>
    );
  }
  // ================= Hasil akhir =================
  if (room.status === 'finished') {
    const top = ranked[0], tie = ranked.length > 1 && ranked[0]?.score === ranked[1]?.score;
    return (
      <div className="page"><Header title="Hasil Akhir" />
        <div className="hero center"><div style={{ fontSize: '3rem' }}>🏆</div><h2>{kind === 'board' && board?.draw ? 'Seri!' : tie || !top?.score ? 'Permainan selesai!' : `${top.name} juara!`}</h2></div>
        {ranked.map((p, i) => <div key={p.uid} className={`score-row ${i === 0 && !tie && p.score > 0 ? 'top' : ''}`}><span>{i + 1}. {p.name}</span><span>{p.score}</span></div>)}
        <Button size="lg" className="gap" onClick={() => nav('/lobi')}>Main lagi</Button>
        <Button size="lg" variant="ghost" className="gap" onClick={() => nav('/')}>Beranda</Button></div>
    );
  }
  // ================= Sedang bermain =================
  if (kind === 'race') {
    const M = MECH[game.mechanic] as ((p: MechProps) => ReactElement | null) | undefined;
    const mine = scoreDocs.find((s) => s.uid === me.uid);
    if (!mine && M) return (
      <div className="page"><Header title={game.title} /><p className="muted small center">Semua pemain memainkan game ini bersamaan. Skor tertinggi menang.</p>
        <M game={game} players={[me.displayName]} seed={room.seed} count={room.count} secs={room.secs || 20} onDone={(o) => void act(async () => (await svc()).submitScore(code, me.uid, o.raceScore ?? o.scores[0] ?? o.correct))} /></div>);
    return (
      <div className="page"><Header title="Menunggu pemain lain" /><p className="muted center">Skormu terkirim: <b>{mine?.score ?? 0}</b></p>
        {ranked.map((p) => <div key={p.uid} className="score-row"><span>{p.name}</span><span>{scoreDocs.some((s) => s.uid === p.uid) ? p.score : 'bermain…'}</span></div>)}
        {isHost && <Button className="gap" variant="soft" onClick={() => void act(async () => (await svc()).finishRoom(code))}>Akhiri sekarang</Button>}</div>);
  }
  if (kind === 'turn' && turn) {
    const eng = TURN_ENGINES[game.mechanic] as unknown as { actor: (s: unknown) => number; apply: (s: unknown, m: number) => unknown };
    const active = eng.actor(turn.s) === myIdx && turnWin < 0;
    const onMove = (m: number) => { if (!eng.apply(turn.s, m)) { sfx.wrong(); return; } void act(async () => (await svc()).submitAnswer(code, me.uid, turn.count, m)); };
    return <div className="page"><Header title={game.title} /><TurnBoard kind={game.mechanic} state={turn.s} viewer={myIdx} names={names} onMove={onMove} active={active} /></div>;
  }
  if (kind === 'board' && board) {
    const turnUid = uids[board.moves % 2], myTurn = turnUid === me.uid && !board.over;
    const play = (v: number) => { if (!myTurn) return; void act(async () => (await svc()).submitAnswer(code, me.uid, board.moves, v)); };
    const mark = (c: number) => (c === 1 ? 'X' : c === 2 ? 'O' : '');
    return (
      <div className="page"><Header title={game.title} />
        <p className="center"><b>{board.over ? (board.draw ? 'Seri!' : `${names[board.winner - 1]} menang!`) : myTurn ? 'Giliranmu!' : `Giliran ${room.players[turnUid ?? '']?.name ?? ''}`}</b></p>
        <p className="center muted small">{names[0]} = {game.mechanic === 'tictactoe' ? 'X' : 'merah'} · {names[1]} = {game.mechanic === 'tictactoe' ? 'O' : 'kuning'}</p>
        {game.mechanic === 'tictactoe' ? <div className="ttt">{board.cells.map((c, i) => <button key={i} className={`tcell ${board.winLine.includes(i) ? 'win' : ''}`} disabled={!myTurn || !!c} onClick={() => play(i)} aria-label={`Petak ${i + 1}`}><b style={{ fontSize: '2rem', color: c === 1 ? 'var(--blue)' : 'var(--red)' }}>{mark(c)}</b></button>)}</div>
          : <div className="c4" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>{Array.from({ length: 7 }, (_, c) => <button key={`h${c}`} className="c4head" disabled={!myTurn} onClick={() => play(c)} aria-label={`Jatuhkan di kolom ${c + 1}`}>▼</button>)}{board.cells.map((c, i) => <div key={i} className={`c4cell ${board.winLine.includes(i) ? 'win' : ''}`}><span className={`disc ${c ? `d${c}` : ''}`} /></div>)}</div>}
      </div>);
  }
  if (!rd || !start) return <Spinner label="Menyiapkan ronde…" />;
  const myAns = roundAns.find((a) => a.uid === me.uid);
  const iAmActor = rd.actor === myIdx, canAnswer = !reveal && !myAns && (rd.kind === 'all' || iAmActor);
  const answer = (c: number, text?: string) => void act(async () => (await svc()).submitAnswer(code, me.uid, round, c, text));
  const actorName = names[rd.actor] ?? '';
  const earlier = answers.filter((a) => a.round < round && a.text).sort((a, b) => a.round - b.round).map((a) => a.text as string);
  const nameOf = (u: string) => room.players[u]?.name ?? '?';
  return (
    <div className="page"><Header title={`Ronde ${round + 1}/${rounds.length}`} />
      <div className={`timer ${left < 4 ? 'low' : ''}`}><div style={{ width: `${(left / room.secs) * 100}%` }} /></div>
      {rd.kind === 'actor' && <p className="center small muted">Giliran: <b>{actorName}</b>{iAmActor ? ' (kamu)' : ''}</p>}
      {rd.hint && <p className="center small muted">{rd.hint}</p>}
      <div className="qbox">{rd.big && <div className="bigemoji">{rd.big}</div>}{rd.prompt}{rd.secret && rd.scoring === 'actorDone' && iAmActor && <div className="gap"><span className="badge">Kata rahasia</span><div style={{ fontSize: '2rem', marginTop: 6 }}>{rd.secret}</div></div>}</div>
      {rd.textInput && earlier.length > 0 && <div className="card"><p className="muted small">Sejauh ini</p><p>{rd.scoring === 'wordchain' ? earlier.join(' → ') : earlier.join(' ')}</p></div>}
      {rd.textInput && canAnswer && <TextAnswer onSend={(t) => answer(0, t)} placeholder={rd.scoring === 'wordchain' ? 'Kata berikutnya…' : 'Tulis satu kalimat…'} />}
      {rd.textInput && !canAnswer && !reveal && <p className="center muted">Menunggu {actorName}…</p>}
      {!rd.textInput && rd.kind === 'actor' && !canAnswer && !reveal && <p className="center muted">Menunggu {actorName}…</p>}
      {!rd.textInput && (rd.kind === 'all' || iAmActor) && rd.options.map((o, i) => {
        const chosen = myAns?.choice === i;
        const cls = !reveal ? (chosen ? 'sel' : '') : rd.scoring === 'quiz' ? (i === rd.correct ? 'right' : chosen ? 'wrong' : '') : chosen ? 'sel' : '';
        return <button key={i} className={`opt ${cls}`} disabled={!canAnswer} onClick={() => answer(i)}><span className="k">{LETTERS[i]}</span>{o}</button>;
      })}
      {!reveal && myAns && <p className="center muted">Jawaban terkirim ({roundAns.length}/{rd.kind === 'all' ? uids.length : 1})…</p>}
      {reveal && (
        <div className="expl">
          {rd.explanation && <p><b>{rd.explanation}</b></p>}
          {(rd.scoring === 'plurality' || rd.scoring === 'predict' || rd.scoring === 'most') && rd.options.map((o, i) => <div key={i} className="small">{o}: {roundAns.filter((a) => a.choice === i).map((a) => nameOf(a.uid)).join(', ') || '—'}</div>)}
          {rd.scoring === 'actorDone' && <p>{roundAns[0] ? (roundAns[0].choice === 0 ? `${actorName}: ${rd.options[0]}` : `${actorName}: ${rd.options[1]}`) : 'Waktu habis.'}</p>}
          {rd.textInput && <p>{roundAns[0]?.text ?? 'Waktu habis.'}</p>}
          <p className="small muted gap">Lanjut dalam {Math.max(0, Math.ceil(revealSecs - (now - (revealAt.current?.at ?? now)) / 1000))} dtk{isHost ? '' : ' (diatur host)'}</p>
        </div>)}
      <div className="gap">{ranked.map((p) => <div key={p.uid} className="score-row"><span>{p.name}{roundAns.some((a) => a.uid === p.uid) ? ' ✓' : ''}</span><span>{p.score}</span></div>)}</div>
    </div>
  );
}

function TextAnswer({ onSend, placeholder }: { onSend: (t: string) => void; placeholder: string }) {
  const [v, setV] = useState('');
  return (<form onSubmit={(e) => { e.preventDefault(); if (v.trim().length >= 2) onSend(v.trim()); }} className="row"><input className="input" value={v} maxLength={140} onChange={(e) => setV(e.target.value)} placeholder={placeholder} aria-label="Jawaban teks" /><Button type="submit" disabled={v.trim().length < 2}>Kirim</Button></form>);
}
