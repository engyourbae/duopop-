import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, Field, Header, Tabs, useConfirm, useToast } from '../../components/ui';
import { explainError } from '../../utils/errors';
import { initial, isFresh, ONLINE_TTL } from '../../utils/presence';
import { RequireAuth } from '../auth/Guards';
import { useAuth } from '../auth/AuthContext';
import type { FriendRequest, PublicUser } from '../../services/social';

export default function FriendsPage() { return <RequireAuth need="Pertemanan memerlukan akun."><Inner /></RequireAuth>; }
function Inner() {
  const { me } = useAuth();
  const toast = useToast();
  const ask = useConfirm();
  const [tab, setTab] = useState<'teman' | 'permintaan' | 'cari'>('teman');
  const [friends, setFriends] = useState<{ uid: string; name: string; handle: string }[]>([]);
  const [inc, setInc] = useState<FriendRequest[]>([]);
  const [out, setOut] = useState<FriendRequest[]>([]);
  const [pres, setPres] = useState<Record<string, number>>({});
  const [q, setQ] = useState('');
  const [res, setRes] = useState<PublicUser[] | null>(null);
  useEffect(() => {
    if (!me) return;
    let o1: (() => void) | undefined, o2: (() => void) | undefined, dead = false;
    void import('../../services/social').then((s) => { if (dead) return; o1 = s.watchFriends(me.uid, setFriends); o2 = s.watchRequests(me.uid, (a, b) => { setInc(a); setOut(b); }); }).catch(() => toast('Gagal memuat teman', 'err'));
    return () => { dead = true; o1?.(); o2?.(); };
  }, [me?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const fKey = friends.map((x) => x.uid).sort().join(',');
  useEffect(() => {
    if (!fKey) return;
    let off: (() => void) | undefined, dead = false;
    void import('../../services/online').then((o) => { if (!dead) off = o.watchPresence(fKey.split(','), setPres); }).catch(() => undefined);
    return () => { dead = true; off?.(); };
  }, [fKey]);
  if (!me) return null;
  if (!me.handle) return <div className="page"><EmptyState icon="user" title="Lengkapi profilmu" text="Pilih nama pengguna dulu agar temanmu bisa menemukanmu." action={<Link to="/masuk"><Button>Pilih nama pengguna</Button></Link>} /></div>;
  const run = async (f: (s: typeof import('../../services/social')) => Promise<unknown>, ok?: string) => {
    try { await f(await import('../../services/social')); if (ok) toast(ok, 'ok'); } catch (e) { toast(explainError(e), 'err'); }
  };
  const search = async () => { try { const s = await import('../../services/social'); setRes(await s.searchUsers(q, me.uid)); } catch (e) { toast(explainError(e), 'err'); } };
  const isFriend = (u: string) => friends.some((f) => f.uid === u);
  const sent = (u: string) => out.some((o) => o.to === u);
  return (
    <div className="page"><Header title="Teman" />
      <Tabs tabs={[{ id: 'teman', label: `Teman (${friends.length})` }, { id: 'permintaan', label: `Permintaan (${inc.length})` }, { id: 'cari', label: 'Cari' }]} value={tab} onChange={setTab} />
      {tab === 'teman' && (friends.length === 0 ? <EmptyState icon="users" title="Belum ada teman" text="Cari teman lewat nama penggunanya." action={<Button onClick={() => setTab('cari')}>Cari teman</Button>} /> :
        friends.map((f) => <div key={f.uid} className="list-item"><div className="avatar">{initial(f.handle || f.name)}</div><div className="grow"><b>@{f.handle || f.name.replace(/^@/, '')}</b><div className="small muted">{isFresh(pres[f.uid], Date.now(), ONLINE_TTL) ? <><span className="online-dot" />Online</> : 'Offline'}</div></div><Button size="sm" variant="ghost" onClick={() => { void ask({ title: `Hapus @${f.handle || f.name.replace(/^@/, '')} dari teman?`, ok: 'Hapus', danger: true }).then((y) => { if (y) void run((s) => s.removeFriend(me.uid, f.uid), 'Teman dihapus'); }); }}>Hapus</Button></div>))}
      {tab === 'permintaan' && <>
        <h3>Masuk</h3>{inc.length === 0 && <p className="muted">Tidak ada permintaan.</p>}
        {inc.map((r) => <div key={r.id} className="list-item"><div className="grow"><b>@{r.fromHandle}</b></div>
          <Button size="sm" onClick={() => void run((s) => s.acceptRequest(me, r), 'Kalian sekarang berteman')}>Terima</Button><Button size="sm" variant="ghost" onClick={() => void run((s) => s.removeRequest(r.from, r.to))}>Tolak</Button></div>)}
        <h3 className="gap">Terkirim</h3>{out.length === 0 && <p className="muted">Belum ada.</p>}
        {out.map((r) => <div key={r.id} className="list-item"><div className="grow"><b>@{r.toHandle ?? r.toName.replace(/^@/, '')}</b></div><Button size="sm" variant="ghost" onClick={() => void run((s) => s.removeRequest(r.from, r.to), 'Dibatalkan')}>Batalkan</Button></div>)}</>}
      {tab === 'cari' && <>
        <form onSubmit={(e) => { e.preventDefault(); void search(); }}><Field label="Nama pengguna"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="@namapengguna (min. 2 huruf)" autoCapitalize="none" /></Field><Button type="submit" size="lg">Cari</Button></form>
        <Card className="gap" style={{ background: 'transparent', boxShadow: 'none', border: 0, padding: 0 }}>
          {res && res.length === 0 && <p className="muted center">Tidak ada pengguna yang cocok.</p>}
          {res?.map((u) => <div key={u.uid} className="list-item"><div className="avatar">{initial(u.handle)}</div><div className="grow"><b>@{u.handle}</b></div>
            {isFriend(u.uid) ? <span className="muted small">Teman</span> : sent(u.uid) ? <span className="muted small">Terkirim</span> :
              <Button size="sm" onClick={() => void run(async (s) => { const r = await s.sendFriendRequest({ ...me }, u); toast(r === 'sent' ? 'Permintaan terkirim' : r === 'accepted' ? 'Kalian sekarang berteman' : r === 'pending' ? 'Permintaan sudah terkirim' : 'Sudah berteman', 'ok'); })}>Tambah</Button>}</div>)}</Card></>}
    </div>
  );
}
