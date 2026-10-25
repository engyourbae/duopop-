import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, EmptyState, Field, Header, Modal, useToast } from '../../components/ui';
import { RequireAuth } from '../auth/Guards';
import { useAuth } from '../auth/AuthContext';
import type { Group, GroupInvite } from '../../services/social';

export default function GroupsPage() { return <RequireAuth need="Grup memerlukan akun."><Inner /></RequireAuth>; }
function Inner() {
  const { me } = useAuth();
  const { code: codeParam } = useParams();
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [friends, setFriends] = useState<{ uid: string; name: string }[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState((codeParam ?? '').toUpperCase());
  const [sel, setSel] = useState<Group | null>(null);
  useEffect(() => {
    if (!me) return;
    let offs: (() => void)[] = [], dead = false;
    void import('../../services/social').then((s) => { if (dead) return; offs = [s.watchGroups(me.uid, setGroups), s.watchInvites(me.uid, setInvites), s.watchFriends(me.uid, setFriends)]; }).catch(() => toast('Gagal memuat grup', 'err'));
    return () => { dead = true; offs.forEach((f) => f()); };
  }, [me?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = sel ? groups.find((g) => g.id === sel.id) ?? null : null;
  if (!me) return null;
  const run = async (f: (s: typeof import('../../services/social')) => Promise<unknown>, ok?: string) => { try { await f(await import('../../services/social')); if (ok) toast(ok, 'ok'); } catch { toast('Aksi gagal. Periksa koneksi.', 'err'); } };
  const create = () => { if (name.trim().length < 2) { toast('Nama grup minimal 2 karakter.', 'err'); return; } void run((s) => s.createGroup(me, name), 'Grup dibuat').then(() => setName('')); };
  const join = async () => {
    try {
      const s = await import('../../services/social'); const r = await s.joinGroup(me, code);
      const m = { ok: 'Berhasil bergabung', 'not-found': 'Kode tidak ditemukan.', expired: 'Kode sudah kedaluwarsa.', full: 'Grup sudah penuh.', already: 'Kamu sudah ada di grup ini.' }[r];
      toast(m, r === 'ok' ? 'ok' : 'err'); if (r === 'ok') setCode('');
    } catch { toast('Gagal bergabung.', 'err'); }
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
          <div className="row"><Button size="sm" variant="soft" className="grow" onClick={() => { void navigator.clipboard?.writeText(link).then(() => toast('Tautan disalin', 'ok')).catch(() => toast('Tidak bisa menyalin', 'err')); }}>Salin tautan</Button>
            {owner && <Button size="sm" variant="ghost" className="grow" onClick={() => void run((s) => s.regenerateCode(cur), 'Kode baru dibuat')}>Kode baru</Button>}</div>
          <h3 className="gap">Anggota</h3>
          {cur.members.map((u) => <div key={u} className="list-item"><div className="avatar">{(cur.memberNames[u] ?? '?').slice(0, 1).toUpperCase()}</div><div className="grow">{cur.memberNames[u] ?? 'Pemain'}{u === cur.ownerUid ? ' · Pemilik' : ''}</div>
            {owner && u !== me.uid && <Button size="sm" variant="ghost" onClick={() => void run((s) => s.kickMember(cur, u), 'Anggota dikeluarkan')}>Keluarkan</Button>}</div>)}
          {owner && friends.filter((f) => !cur.members.includes(f.uid)).length > 0 && <><h3 className="gap">Undang teman</h3>
            {friends.filter((f) => !cur.members.includes(f.uid)).map((f) => <div key={f.uid} className="list-item"><div className="grow">{f.name}</div><Button size="sm" onClick={() => void run((s) => s.inviteFriend(me, cur, f.uid), 'Undangan terkirim')}>Undang</Button></div>)}</>}
          <div className="row gap">{owner ? <Button variant="danger" onClick={() => { if (confirm('Hapus grup ini?')) void run((s) => s.deleteGroup(cur), 'Grup dihapus').then(() => setSel(null)); }}>Hapus grup</Button> :
            <Button variant="ghost" onClick={() => { if (confirm('Keluar dari grup?')) void run((s) => s.leaveGroup(cur, me.uid), 'Kamu keluar dari grup').then(() => setSel(null)); }}>Keluar grup</Button>}</div>
        </>}
      </Modal>
    </div>
  );
}
