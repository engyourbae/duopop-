import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, Field, Header, Modal, Select, useConfirm, useToast } from '../../components/ui';
import { ShareSheet } from '../../components/Share';
import { explainError } from '../../utils/errors';
import { initial } from '../../utils/presence';
import { RequireAuth } from '../auth/Guards';
import { useAuth } from '../auth/AuthContext';
import { useFriendsOnline } from '../multiplayer/Invite';
import { GAMES } from '../games/registry';
import { isFresh, ONLINE_TTL } from '../../utils/presence';
import { useProgress } from '../progression/store';
import type { Group, GroupInvite } from '../../services/social';

export default function GroupsPage() { return <RequireAuth need="Grup memerlukan akun."><Inner /></RequireAuth>; }
function Inner() {
  const { me } = useAuth();
  const { code: codeParam } = useParams();
  const toast = useToast();
  const ask = useConfirm();
  const [shareOpen, setShareOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const friends = useFriendsOnline(me?.uid);
  const nav = useNavigate();
  const prog = useProgress();
  const [gameSel, setGameSel] = useState('duel');
  const [memPres, setMemPres] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [code, setCode] = useState((codeParam ?? '').toUpperCase());
  const [sel, setSel] = useState<Group | null>(null);
  useEffect(() => {
    if (!me) return;
    let offs: (() => void)[] = [], dead = false;
    void import('../../services/social').then((s) => { if (dead) return; offs = [s.watchGroups(me.uid, setGroups), s.watchInvites(me.uid, setInvites)]; }).catch(() => toast('Gagal memuat grup', 'err'));
    return () => { dead = true; offs.forEach((f) => f()); };
  }, [me?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const memKey = (sel ? groups.find((g) => g.id === sel.id)?.members ?? [] : []).filter((u) => u !== me?.uid).sort().join(',');
  useEffect(() => {
    if (!memKey) { setMemPres({}); return; }
    let off: (() => void) | undefined, dead = false;
    void import('../../services/online').then((o) => { if (!dead) off = o.watchPresence(memKey.split(','), setMemPres); }).catch(() => undefined);
    return () => { dead = true; off?.(); };
  }, [memKey]);
  const cur = sel ? groups.find((g) => g.id === sel.id) ?? null : null;
  if (!me) return null;
  const run = async (f: (s: typeof import('../../services/social')) => Promise<unknown>, ok?: string) => { try { await f(await import('../../services/social')); if (ok) toast(ok, 'ok'); } catch (e) { toast(explainError(e), 'err'); } };
  const create = () => { if (name.trim().length < 2) { toast('Nama grup minimal 2 karakter.', 'err'); return; } void run((s) => s.createGroup(me, name), 'Grup dibuat').then(() => setName('')); };
  const join = async () => {
    try {
      const s = await import('../../services/social'); const r = await s.joinGroup(me, code);
      const m = { ok: 'Berhasil bergabung', 'not-found': 'Kode tidak ditemukan.', expired: 'Kode sudah kedaluwarsa.', full: 'Grup sudah penuh.', already: 'Kamu sudah ada di grup ini.' }[r];
      toast(m, r === 'ok' ? 'ok' : 'err'); if (r === 'ok') setCode('');
    } catch (e) { toast(explainError(e), 'err'); }
  };
  const owner = cur?.ownerUid === me.uid;
  const link = cur ? `${location.origin}${location.pathname}#/grup/gabung/${cur.code}` : '';
  return (
    <div className="page"><Header title="Grup" />
      {invites.map((i) => <Card key={i.id}><b>{i.fromName}</b> mengundangmu ke <b>{i.groupName}</b><div className="row gap"><Button size="sm" onClick={() => void run((s) => s.acceptInvite(me, i), 'Bergabung')}>Terima</Button><Button size="sm" variant="ghost" onClick={() => void run((s) => s.cancelInvite(i.id))}>Tolak</Button></div></Card>)}
      <Card><h3>Buat grup</h3><Field label="Nama grup"><input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} /></Field><Button onClick={create}>Buat</Button></Card>
      <Card><h3>Gabung dengan kode</h3><Field label="Kode grup"><input value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} /></Field><Button variant="soft" onClick={() => void join()}>Gabung</Button></Card>
      <h3>Grupmu</h3>
      {groups.length === 0 ? <EmptyState icon="users" title="Belum ada grup" text="Buat grup baru atau gabung dengan kode dari temanmu." /> : groups.map((g) => (
        <Card key={g.id} onClick={() => setSel(g)}><div className="row"><div className="avatar">{g.name.slice(0, 1).toUpperCase()}</div><div className="grow"><b>{g.name}</b><div className="small muted">{g.members.length}/{g.max} anggota{g.ownerUid === me.uid ? ' · Pemilik' : ''}</div></div></div></Card>))}
      <Modal open={!!cur} title={cur?.name ?? ''} onClose={() => setSel(null)}>
        {cur && <>
          <p className="muted small center">Kode undangan</p><div className="code">{cur.code}</div>
          <div className="row"><Button size="sm" variant="soft" className="grow" icon="share" onClick={() => setShareOpen(true)}>Bagikan</Button>
            {owner && <Button size="sm" variant="ghost" className="grow" onClick={() => void run((s) => s.regenerateCode(cur), 'Kode baru dibuat')}>Kode baru</Button>}</div>
          <h3 className="gap">Anggota</h3>
          {cur.members.map((u) => <div key={u} className="list-item"><div className="avatar">{initial(cur.memberNames[u] ?? '?')}</div><div className="grow">{cur.memberNames[u] ?? 'Pemain'}{u === cur.ownerUid ? ' · Pemilik' : ''}{u !== me.uid && isFresh(memPres[u], Date.now(), ONLINE_TTL) && <span className="small muted"> <span className="online-dot" />online</span>}</div>
            {owner && u !== me.uid && <Button size="sm" variant="ghost" onClick={() => void run((s) => s.kickMember(cur, u), 'Anggota dikeluarkan')}>Keluarkan</Button>}</div>)}
          {owner && friends.filter((f) => !cur.members.includes(f.uid)).length > 0 && <><h3 className="gap">Undang teman</h3>
            {friends.filter((f) => !cur.members.includes(f.uid)).map((f) => <div key={f.uid} className="list-item"><div className="grow"><b>@{f.handle || f.name.replace(/^@/, '')}</b><div className="small muted">{f.online ? <><span className="online-dot" />Online</> : 'Offline'}</div></div><Button size="sm" onClick={() => void run((s) => s.inviteFriend(me, cur, f.uid), f.online ? 'Undangan terkirim (langsung muncul di layarnya)' : 'Undangan terkirim')}>Undang</Button></div>)}</>}
          <h3 className="gap">Mabar bareng grup</h3>
          <p className="small muted">Buat ruang lalu semua anggota yang sedang online langsung diundang.</p>
          <Select label="Game" value={gameSel} onChange={setGameSel} options={GAMES.map((g) => ({ value: g.id, label: g.title }))} />
          <Button variant="soft" icon="users" onClick={() => void run(async (sv) => { const [rm, on, d] = await Promise.all([import('../../services/rooms'), import('../../services/online'), import('../games/GamePage')]); const g = GAMES.find((x) => x.id === gameSel); const df = g ? d.defaultsFor(g) : { count: 10, secs: 20 }; const c = await rm.createRoom(me, gameSel, df.count, df.secs || 20, prog.settings.pause ?? 6); const online = cur.members.filter((u) => u !== me.uid && isFresh(memPres[u], Date.now(), ONLINE_TTL)); await Promise.all(online.map((u) => on.sendPlayInvite(me, u, c, gameSel).catch(() => undefined))); void sv; toast(online.length ? `${online.length} anggota online diundang` : 'Belum ada anggota online; bagikan kode dari ruang', 'ok'); nav(`/ruang/${c}`); })}>Mulai mabar</Button>
          <div className="row gap">{owner ? <Button variant="danger" onClick={() => { void ask({ title: 'Hapus grup ini?', text: 'Semua anggota akan kehilangan grup.', ok: 'Hapus', danger: true }).then((y) => { if (y) void run((s) => s.deleteGroup(cur), 'Grup dihapus').then(() => setSel(null)); }); }}>Hapus grup</Button> :
            <Button variant="ghost" onClick={() => { void ask({ title: 'Keluar dari grup?', ok: 'Keluar', danger: true }).then((y) => { if (y) void run((s) => s.leaveGroup(cur, me.uid), 'Kamu keluar dari grup').then(() => setSel(null)); }); }}>Keluar grup</Button>}</div>
        </>}
      </Modal>
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} text={`Gabung grup DUOPOP-ku "${cur?.name ?? ''}"!`} url={link} />
    </div>
  );
}
