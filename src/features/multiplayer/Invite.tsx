import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, useToast } from '../../components/ui';
import { useAuth } from '../auth/AuthContext';
import { useProgress } from '../progression/store';
import { gameById } from '../games/registry';
import { explainError } from '../../utils/errors';
import { initial, isFresh, ONLINE_TTL } from '../../utils/presence';
import { serverNow } from '../../utils/clock';
import type { PlayInvite } from '../../services/online';
import type { GroupInvite } from '../../services/social';

export interface FriendLite { uid: string; name: string; handle: string }
/** Daftar teman + status online (presensi) untuk satu pengguna. */
export function useFriendsOnline(uid: string | undefined) {
  const [friends, setFriends] = useState<FriendLite[]>([]);
  const [pres, setPres] = useState<Record<string, number>>({});
  const [denied, setDenied] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 15000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!uid) return;
    let off: (() => void) | undefined, dead = false;
    void import('../../services/social').then((s) => { if (!dead) off = s.watchFriends(uid, setFriends); }).catch(() => undefined);
    return () => { dead = true; off?.(); };
  }, [uid]);
  const key = friends.map((f) => f.uid).sort().join(',');
  useEffect(() => {
    if (!key) return;
    let off: (() => void) | undefined, dead = false;
    void import('../../services/online').then((o) => { if (!dead) off = o.watchPresence(key.split(','), setPres, (c) => { if (c === 'permission-denied') setDenied(true); }); }).catch(() => undefined);
    return () => { dead = true; off?.(); };
  }, [key]);
  const now = serverNow();
  const list = friends.map((f) => ({ ...f, online: isFresh(pres[f.uid], now, ONLINE_TTL) })).sort((a, b) => Number(b.online) - Number(a.online));
  return { friends: list, denied };
}

/** Undang teman online langsung ke ruang yang sedang menunggu. */
export function FriendInviter({ code, gameId }: { code: string; gameId: string }) {
  const { me } = useAuth();
  const toast = useToast();
  const { friends, denied } = useFriendsOnline(me?.uid);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  if (!me) return null;
  const invite = async (f: FriendLite) => {
    try { const o = await import('../../services/online'); await o.sendPlayInvite(me, f.uid, code, gameId); setSent((s) => ({ ...s, [f.uid]: true })); toast(`Undangan dikirim ke @${f.handle}`, 'ok'); }
    catch (e) { toast(explainError(e), 'err'); }
  };
  if (!friends.length) return <p className="muted small">Belum ada teman. Tambahkan teman di tab Teman agar bisa mengundang langsung.</p>;
  return (
    <div>{denied && <p className="field-err">Status online tidak terbaca (ditolak aturan keamanan). Publish firestore.rules terbaru di Firebase, lalu muat ulang.</p>}{friends.map((f) => (
      <div key={f.uid} className="list-item"><div className="avatar">{initial(f.handle || f.name)}</div>
        <div className="grow"><b>@{f.handle || f.name.replace(/^@/, '')}</b><div className="small muted">{f.online ? <><span className="online-dot" />Online</> : 'Offline'}</div></div>
        <Button size="sm" disabled={!f.online || sent[f.uid]} onClick={() => void invite(f)}>{sent[f.uid] ? 'Terkirim' : 'Undang'}</Button></div>))}</div>
  );
}

/** Detak presensi + penerima undangan langsung (main & grup) di seluruh aplikasi. */
export function GlobalWatchers() {
  const { me, configured } = useAuth();
  const prog = useProgress();
  const nav = useNavigate();
  const toast = useToast();
  const [play, setPlay] = useState<PlayInvite | null>(null);
  const [grp, setGrp] = useState<GroupInvite | null>(null);
  const handled = useRef<Set<string>>(new Set());
  const showOnline = prog.settings.showOnline !== false;
  useEffect(() => {
    if (!configured || !me?.handle) return;
    let offClock: (() => void) | undefined;
    void import('../../services/online').then((o) => { offClock = o.watchOwnClock(me.uid); }).catch(() => undefined);
    const beat = () => { void import('../../services/online').then((o) => o.setPresence(me, showOnline)).catch(() => undefined); };
    beat();
    const t = setInterval(beat, 30000), vis = () => { if (!document.hidden) beat(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); offClock?.(); };
  }, [configured, me?.uid, me?.handle, showOnline]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!configured || !me?.handle) return;
    let o1: (() => void) | undefined, o2: (() => void) | undefined, dead = false;
    void Promise.all([import('../../services/online'), import('../../services/social')]).then(([o, s]) => {
      if (dead) return;
      o1 = o.watchPlayInvites(me.uid, (list) => {
        const fresh = list.filter((i) => Date.now() - i.at < 180000 && !handled.current.has(i.id)).sort((a, b) => b.at - a.at)[0];
        list.filter((i) => Date.now() - i.at >= 180000).forEach((i) => void o.removePlayInvite(i.id).catch(() => undefined));
        setPlay(fresh ?? null);
      });
      o2 = s.watchInvites(me.uid, (list) => setGrp(list.find((i) => !handled.current.has(i.id)) ?? null));
    }).catch(() => undefined);
    return () => { dead = true; o1?.(); o2?.(); };
  }, [configured, me?.uid, me?.handle]);
  if (!configured || !me?.handle) return null;
  const respondPlay = async (join: boolean) => {
    if (!play) return;
    handled.current.add(play.id);
    const inv = play; setPlay(null);
    try {
      const [o, r] = await Promise.all([import('../../services/online'), import('../../services/rooms')]);
      void o.removePlayInvite(inv.id).catch(() => undefined);
      if (!join) return;
      const res = await r.joinRoom(me, inv.code);
      if (res === 'ok') nav(`/ruang/${inv.code}`); else toast(res === 'started' ? 'Permainan sudah dimulai.' : res === 'full' ? 'Ruang sudah penuh.' : 'Ruang tidak ditemukan.', 'err');
    } catch (e) { toast(explainError(e), 'err'); }
  };
  const respondGroup = async (accept: boolean) => {
    if (!grp) return;
    handled.current.add(grp.id);
    const inv = grp; setGrp(null);
    try { const s = await import('../../services/social'); if (accept) { await s.acceptInvite(me, inv); toast(`Bergabung ke grup ${inv.groupName}`, 'ok'); } else await s.cancelInvite(inv.id); }
    catch (e) { toast(explainError(e), 'err'); }
  };
  const gm = play ? gameById(play.gameId) : undefined;
  return (
    <>
      <Modal open={!!play} title="Ajakan main" onClose={() => void respondPlay(false)}>
        <p><b>{play?.fromName}</b> mengajakmu bermain <b>{gm?.title ?? 'DUOPOP'}</b> sekarang.</p>
        <div className="row gap"><Button variant="ghost" className="grow" onClick={() => void respondPlay(false)}>Nanti saja</Button><Button className="grow" onClick={() => void respondPlay(true)}>Gabung</Button></div>
      </Modal>
      <Modal open={!!grp && !play} title="Undangan grup" onClose={() => void respondGroup(false)}>
        <p><b>{grp?.fromName}</b> mengundangmu ke grup <b>{grp?.groupName}</b>.</p>
        <div className="row gap"><Button variant="ghost" className="grow" onClick={() => void respondGroup(false)}>Tolak</Button><Button className="grow" onClick={() => void respondGroup(true)}>Terima</Button></div>
      </Modal>
    </>
  );
}
