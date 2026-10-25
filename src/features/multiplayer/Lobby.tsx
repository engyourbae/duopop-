import { useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Button, Card, Header, Field, Select, useToast } from '../../components/ui';
import { explainError } from '../../utils/errors';
import { RequireAuth } from '../auth/Guards';
import { useAuth } from '../auth/AuthContext';
import { GAMES } from '../games/registry';
import { useOnline } from '../../hooks/useOnline';

export default function LobbyPage() {
  return <RequireAuth need="Multiplayer online memerlukan akun dan koneksi internet."><LobbyInner /></RequireAuth>;
}
function LobbyInner() {
  const [sp] = useSearchParams();
  const { code: codeParam } = useParams();
  const { me } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const online = useOnline();
  const rooms = GAMES.filter((g) => g.multiplayer);
  const [gid, setGid] = useState(sp.get('game') && rooms.some((g) => g.id === sp.get('game')) ? (sp.get('game') as string) : 'duel');
  const [count, setCount] = useState(10);
  const [secs, setSecs] = useState(15);
  const [code, setCode] = useState((codeParam ?? '').toUpperCase());
  const [busy, setBusy] = useState(false);
  if (!me) return null;
  const create = async () => {
    setBusy(true);
    try { const r = await import('../../services/rooms'); const c = await r.createRoom(me, gid, count, secs); nav(`/ruang/${c}`); }
    catch (e) { toast(explainError(e), 'err'); } finally { setBusy(false); }
  };
  const join = async () => {
    if (code.trim().length < 4) { toast('Masukkan kode ruang.', 'err'); return; }
    setBusy(true);
    try {
      const r = await import('../../services/rooms');
      const res = await r.joinRoom(me, code);
      if (res === 'ok') nav(`/ruang/${code.trim().toUpperCase()}`);
      else toast(res === 'not-found' ? 'Kode ruang tidak ditemukan.' : res === 'started' ? 'Permainan sudah dimulai.' : 'Ruang sudah penuh.', 'err');
    } catch (e) { toast(explainError(e), 'err'); } finally { setBusy(false); }
  };
  return (
    <div className="page">
      <Header title="Lobi Online" back={() => nav(-1)} />
      {!online && <div className="expl bad">Kamu sedang offline. Multiplayer membutuhkan koneksi real-time.</div>}
      <Card><h3>Buat ruang</h3>
        <Select label="Game" value={gid} onChange={setGid} options={rooms.map((g) => ({ value: g.id, label: g.title }))} />
        <div className="row wrap"><span className="small">Soal:</span>{[5, 10, 15].map((c) => <button key={c} className={`chip ${count === c ? 'on' : ''}`} onClick={() => setCount(c)}>{c}</button>)}
          <span className="small">Detik:</span>{[10, 15, 25].map((c) => <button key={c} className={`chip ${secs === c ? 'on' : ''}`} onClick={() => setSecs(c)}>{c}</button>)}</div>
        <Button size="lg" className="gap" onClick={create} disabled={busy || !online}>Buat ruang baru</Button></Card>
      <Card><h3>Gabung dengan kode</h3>
        <Field label="Kode ruang"><input value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="mis. K7M2P" style={{ letterSpacing: '.2em', textTransform: 'uppercase' }} /></Field>
        <Button size="lg" variant="soft" onClick={join} disabled={busy || !online}>Gabung</Button></Card>
    </div>
  );
}
