import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, ErrorState, Header, Spinner, useToast } from '../../components/ui';
import { ShareSheet } from '../../components/Share';
import { explainError } from '../../utils/errors';
import { RequireAuth } from '../auth/Guards';
import { useAuth } from '../auth/AuthContext';
import { buildItems, xpForResult } from '../games/engine';
import { gameById } from '../games/registry';
import { recordResult } from '../progression/store';
import { roomScores } from './scoring';
import { LETTERS } from '../games/mechanics/types';
import type { Room, RoomAnswer } from '../../services/rooms';
import { sfx } from '../../utils/sound';

export default function RoomPage() { return <RequireAuth need="Ruang online memerlukan akun."><RoomInner /></RequireAuth>; }

function RoomInner() {
  const { code = '' } = useParams();
  const { me } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [answers, setAnswers] = useState<RoomAnswer[]>([]);
  const [err, setErr] = useState('');
  const [now, setNow] = useState(Date.now());
  const [shareOpen, setShareOpen] = useState(false);
  const [mine, setMine] = useState<Record<number, number>>({});
  const advancing = useRef<number | null>(null);
  const saved = useRef(false);
  useEffect(() => {
    let o1: (() => void) | undefined, o2: (() => void) | undefined, dead = false;
    void import('../../services/rooms').then((r) => {
      if (dead) return;
      o1 = r.watchRoom(code, setRoom, () => setErr('Tidak bisa membuka ruang. Kamu mungkin belum bergabung atau koneksi terputus.'));
      o2 = r.watchAnswers(code, setAnswers);
    }).catch(() => setErr('Gagal memuat layanan online.'));
    return () => { dead = true; o1?.(); o2?.(); };
  }, [code]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);
  const game = room ? gameById(room.gameId) : undefined;
  const items = useMemo(() => (room && game ? buildItems(game, room.count, room.seed) : []), [room?.seed, room?.count, game]); // eslint-disable-line react-hooks/exhaustive-deps
  const startsMs = useMemo(() => Object.fromEntries(Object.entries(room?.starts ?? {}).map(([k, v]) => [k, v ? v.toMillis() : null])), [room?.starts]);
  const uids = Object.keys(room?.players ?? {});
  const scores = useMemo(() => (room ? roomScores(items, answers.map((a) => ({ uid: a.uid, round: a.round, choice: a.choice, atMs: a.at ? a.at.toMillis() : null })), startsMs, room.secs, uids) : {}), [items, answers, startsMs, room?.secs, uids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const isHost = !!room && !!me && room.hostUid === me.uid;
  const round = room?.round ?? 0;
  const start = startsMs[String(round)] ?? null;
  const elapsed = start ? (now - start) / 1000 : 0;
  const left = room ? Math.max(0, room.secs - elapsed) : 0;
  const roundAns = answers.filter((a) => a.round === round);
  const allIn = !!room && uids.every((u) => roundAns.some((a) => a.uid === u));
  const reveal = !!room && room.status === 'playing' && !!start && (allIn || left <= 0);
  // Host memajukan ronde 3,5 detik setelah ronde terbuka
  useEffect(() => {
    if (!room || !isHost || room.status !== 'playing' || !reveal) return;
    if (advancing.current === round) return;
    advancing.current = round;
    const t = setTimeout(() => { void import('../../services/rooms').then((r) => r.nextRound(code, round, items.length)).catch(() => toast('Gagal melanjutkan ronde', 'err')); }, 3500);
    return () => clearTimeout(t);
  }, [reveal, round, isHost, room?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (reveal && me) { const item = items[round]; const c = mine[round] ?? roundAns.find((a) => a.uid === me.uid)?.choice; if (item && c !== undefined) (c === item.correct ? sfx.right : sfx.wrong)(); } }, [reveal, round]); // eslint-disable-line react-hooks/exhaustive-deps
  // Simpan hasil sekali per ruang (XP lokal, dedupe berdasarkan kode ruang)
  useEffect(() => {
    if (!room || room.status !== 'finished' || !me || saved.current) return;
    saved.current = true;
    const myCorrect = items.filter((it, r) => answers.some((a) => a.uid === me.uid && a.round === r && a.choice === it.correct)).length;
    recordResult({ sessionId: `room-${room.code}-${room.seed}`, gameId: room.gameId, at: Date.now(), players: uids.map((u) => ({ name: room.players[u]?.name ?? '?', score: scores[u] ?? 0 })), correct: myCorrect, total: items.length, xp: xpForResult(myCorrect, items.length) });
  }, [room?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <ErrorState text={err} onRetry={() => nav('/lobi')} />;
  if (room === undefined) return <Spinner label="Menghubungkan ke ruang…" />;
  if (room === null || !me) return <ErrorState text="Ruang tidak ditemukan atau sudah dihapus." onRetry={() => nav('/lobi')} />;
  if (!room.players[me.uid]) return <ErrorState text="Kamu belum bergabung di ruang ini. Masukkan kodenya di Lobi." onRetry={() => nav(`/lobi/${code}`)} />;
  const link = `${location.origin}${location.pathname}#/lobi/${room.code}`;
  const ranked = uids.map((u) => ({ uid: u, name: room.players[u]?.name ?? '?', score: scores[u] ?? 0 })).sort((a, b) => b.score - a.score);
  const act = async (f: () => Promise<unknown>) => { try { await f(); } catch (e) { toast(explainError(e), 'err'); } };
  if (room.status === 'lobby') {
    return (
      <div className="page"><Header title="Ruang Menunggu" back={() => nav('/lobi')} />
        <Card className="center"><p className="muted">Kode ruang · {game?.title}</p><div className="code">{room.code}</div>
          <div className="row"><Button variant="soft" icon="copy" className="grow" onClick={() => { void navigator.clipboard?.writeText(room.code).then(() => toast('Kode disalin', 'ok')).catch(() => toast('Tidak bisa menyalin', 'err')); }}>Salin kode</Button>
            <Button variant="soft" icon="share" className="grow" onClick={() => setShareOpen(true)}>Bagikan</Button></div></Card>
        <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} text={`Gabung ruang DUOPOP-ku! Kode: ${room.code}`} url={link} />
        <h3>Pemain ({uids.length})</h3>
        {uids.map((u) => <div key={u} className="score-row"><span>{room.players[u]?.name}{u === room.hostUid ? ' · Host' : ''}{u === me.uid ? ' (kamu)' : ''}</span></div>)}
        <div className="row gap"><Button variant="ghost" onClick={() => void act(async () => { const r = await import('../../services/rooms'); await r.leaveRoom(code, me.uid); nav('/lobi'); })}>Keluar</Button>
          {isHost ? <Button className="grow" disabled={uids.length < 2} onClick={() => void act(async () => (await import('../../services/rooms')).startRoom(code))}>{uids.length < 2 ? 'Menunggu pemain lain…' : 'Mulai permainan'}</Button> : <p className="muted grow center">Menunggu host memulai…</p>}</div>
      </div>
    );
  }
  if (room.status === 'finished') {
    return (
      <div className="page"><Header title="Hasil Akhir" />
        <div className="hero center"><div style={{ fontSize: '3rem' }}>🏆</div><h2>{ranked[0]?.name} juara!</h2></div>
        {ranked.map((p, i) => <div key={p.uid} className={`score-row ${i === 0 ? 'top' : ''}`}><span>{i + 1}. {p.name}</span><span>{p.score}</span></div>)}
        <Button size="lg" className="gap" onClick={() => nav('/')}>Kembali ke beranda</Button></div>
    );
  }
  const item = items[round];
  if (!item || !start) return <Spinner label="Menyiapkan ronde…" />;
  const myAns = roundAns.find((a) => a.uid === me.uid)?.choice ?? mine[round];
  const answer = async (c: number) => {
    setMine({ ...mine, [round]: c });
    try { await (await import('../../services/rooms')).submitAnswer(code, me.uid, round, c); } catch { toast('Jawaban gagal terkirim.', 'err'); setMine((m) => { const n = { ...m }; delete n[round]; return n; }); }
  };
  return (
    <div className="page"><Header title={`Soal ${round + 1}/${items.length}`} />
      <div className={`timer ${left < 4 ? 'low' : ''}`}><div style={{ width: `${(left / room.secs) * 100}%` }} /></div>
      <div className="qbox">{item.big && <div className="bigemoji">{item.big}</div>}{item.prompt}</div>
      {item.options.map((o, i) => {
        const cls = !reveal ? (myAns === i ? 'sel' : '') : i === item.correct ? 'right' : myAns === i ? 'wrong' : '';
        return <button key={i} className={`opt ${cls}`} disabled={reveal || myAns !== undefined} onClick={() => void answer(i)}><span className="k">{LETTERS[i]}</span>{o}</button>;
      })}
      {!reveal && myAns !== undefined && <p className="center muted">Jawaban terkirim. Menunggu pemain lain ({roundAns.length}/{uids.length})…</p>}
      {reveal && <div className="expl">{item.explanation}</div>}
      <div className="gap">{ranked.map((p) => <div key={p.uid} className="score-row"><span>{p.name}{roundAns.some((a) => a.uid === p.uid) ? ' ✓' : ''}</span><span>{p.score}</span></div>)}</div>
    </div>
  );
}
