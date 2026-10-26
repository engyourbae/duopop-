import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, Field, Header, Select, useToast } from '../../components/ui';
import { RequireAuth } from '../auth/Guards';
import { useAuth } from '../auth/AuthContext';
import { GAMES } from '../games/registry';
import { defaultsFor } from '../games/GamePage';
import { useProgress } from '../progression/store';
import { useOnline } from '../../hooks/useOnline';
import { useMusic } from '../../hooks/useMusic';
import { explainError } from '../../utils/errors';
import type { QueueEntry } from '../../utils/presence';

export default function LobbyPage() { return <RequireAuth need="Main online memerlukan akun dan koneksi internet."><LobbyInner /></RequireAuth>; }

function Searching({ gameId, count, secs, onCancel }: { gameId: string; count: number; secs: number; onCancel: () => void }) {
  const { me } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [elapsed, setElapsed] = useState(0);
  const [failed, setFailed] = useState(false);
  const done = useRef(false);
  useEffect(() => {
    if (!me) return;
    let offQ: (() => void) | undefined, loop: ReturnType<typeof setInterval> | undefined, tick: ReturnType<typeof setInterval> | undefined, dead = false;
    const t0 = Date.now();
    void (async () => {
      try {
        const [o, r] = await Promise.all([import('../../services/online'), import('../../services/rooms')]);
        await o.joinQueue(me, gameId);
        const enter = async (code: string) => {
          if (done.current) return; done.current = true;
          const res = await r.joinRoom(me, code);
          void o.leaveQueue(me.uid).catch(() => undefined);
          if (res === 'ok') nav(`/ruang/${code}`, { replace: true }); else { toast('Ruang pertandingan tidak bisa dimasuki. Coba cari lagi.', 'err'); onCancel(); }
        };
        offQ = o.watchMyQueue(me.uid, (d: QueueEntry | null) => { if (d?.status === 'matched' && d.roomCode) void enter(d.roomCode).catch((e) => toast(explainError(e), 'err')); });
        const attempt = async () => {
          if (dead || done.current) return;
          if (Date.now() - t0 > 75000) { setFailed(true); clearInterval(loop); return; }
          try { await o.heartbeatQueue(me.uid); const code = await o.tryMatch(me, gameId, count, secs); if (code) await enter(code); } catch (e) { toast(explainError(e), 'err'); }
        };
        loop = setInterval(() => { void attempt(); }, 2500); void attempt();
        tick = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
      } catch (e) { toast(explainError(e), 'err'); onCancel(); }
    })();
    return () => { dead = true; clearInterval(loop); clearInterval(tick); offQ?.(); if (!done.current) void import('../../services/online').then((o) => o.leaveQueue(me.uid)).catch(() => undefined); };
  }, [me?.uid, gameId]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Card className="center"><div className="spinner" style={{ margin: '0 auto 12px' }} />
      <h2>{failed ? 'Belum ada lawan' : 'Mencari pemain online…'}</h2>
      <p className="muted">{failed ? 'Belum ada pemain lain yang mencari game ini. Coba lagi sebentar lagi atau ajak teman langsung.' : `Menunggu lawan (${elapsed} dtk). Tetap di halaman ini.`}</p>
      <div className="row gap">{failed && <Button className="grow" onClick={() => { setFailed(false); setElapsed(0); onCancel(); setTimeout(() => window.dispatchEvent(new Event('duopop:search-again')), 0); }}>Cari lagi</Button>}<Button variant="ghost" className="grow" onClick={onCancel}>Batal</Button></div></Card>
  );
}

function LobbyInner() {
  const [sp] = useSearchParams();
  const { code: codeParam } = useParams();
  const { me } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const online = useOnline();
  const prog = useProgress();
  useMusic('lobi');
  const first = GAMES.find((g) => g.id === sp.get('game')) ? (sp.get('game') as string) : 'duel';
  const [gid, setGid] = useState(first);
  const [searching, setSearching] = useState(false);
  const [showCode, setShowCode] = useState(!!codeParam);
  const [code, setCode] = useState((codeParam ?? '').toUpperCase());
  const [busy, setBusy] = useState(false);
  const game = GAMES.find((g) => g.id === gid) ?? GAMES[0];
  const d = game ? defaultsFor(game) : null;
  const [count, setCount] = useState(d?.count ?? 10);
  const [secs, setSecs] = useState((d?.secs ?? 0) || 20);
  useEffect(() => { const dd = game ? defaultsFor(game) : null; if (dd) { setCount(dd.count); setSecs(dd.secs || 20); } }, [gid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const f = () => setSearching(true); window.addEventListener('duopop:search-again', f); return () => window.removeEventListener('duopop:search-again', f); }, []);
  if (!me || !game || !d) return null;
  const createFriends = async () => {
    setBusy(true);
    try { const r = await import('../../services/rooms'); const c = await r.createRoom(me, gid, count, secs, prog.settings.pause ?? 6); nav(`/ruang/${c}`); }
    catch (e) { toast(explainError(e), 'err'); } finally { setBusy(false); }
  };
  const join = async () => {
    if (code.trim().length < 4) { toast('Masukkan kode ruang.', 'err'); return; }
    setBusy(true);
    try {
      const r = await import('../../services/rooms'); const res = await r.joinRoom(me, code);
      if (res === 'ok') nav(`/ruang/${code.trim().toUpperCase()}`); else toast(res === 'not-found' ? 'Kode ruang tidak ditemukan.' : res === 'started' ? 'Permainan sudah dimulai.' : 'Ruang sudah penuh.', 'err');
    } catch (e) { toast(explainError(e), 'err'); } finally { setBusy(false); }
  };
  return (
    <div className="page"><Header title="Main Online" back={() => nav(-1)} />
      {!online && <div className="expl bad">Kamu sedang offline. Main online membutuhkan koneksi real-time.</div>}
      <Select label="Pilih game" value={gid} onChange={setGid} options={GAMES.map((g) => ({ value: g.id, label: g.title }))} />
      {d.counts.length > 1 && <div className="row wrap"><span className="small">{game.mechanic === 'memorymatch' ? 'Pasangan:' : 'Ronde/soal:'}</span>{d.counts.map((c) => <button key={c} className={`chip ${count === c ? 'on' : ''}`} onClick={() => setCount(c)}>{c}</button>)}</div>}
      {d.secsOpts && <div className="row wrap gap"><span className="small">Detik:</span>{d.secsOpts.map((c) => <button key={c} className={`chip ${secs === c ? 'on' : ''}`} onClick={() => setSecs(c)}>{c}</button>)}</div>}
      {searching ? <div className="gap"><Searching gameId={gid} count={count} secs={secs} onCancel={() => setSearching(false)} /></div> : (
        <div className="gap">
          <Card><h3>Cari lawan acak</h3><p className="muted small">Masuk antrean dan langsung dipertemukan dengan pemain online yang mencari game yang sama. Tanpa kode.</p>
            <Button size="lg" icon="users" onClick={() => setSearching(true)} disabled={!online}>Cari lawan sekarang</Button></Card>
          <Card><h3>Ajak teman online</h3><p className="muted small">Buat ruang, lalu undang teman yang sedang online dengan satu ketukan. Mereka langsung dapat pemberitahuan.</p>
            <Button size="lg" variant="soft" icon="share" onClick={createFriends} disabled={busy || !online}>Buat ruang & undang teman</Button></Card>
          <button className="chip" onClick={() => setShowCode(!showCode)}>{showCode ? 'Sembunyikan' : 'Punya kode ruang?'}</button>
          {showCode && <Card className="gap"><Field label="Kode ruang"><input value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="mis. K7M2P" style={{ letterSpacing: '.2em', textTransform: 'uppercase' }} /></Field><Button variant="soft" onClick={join} disabled={busy || !online}>Gabung</Button></Card>}
        </div>)}
    </div>
  );
}
