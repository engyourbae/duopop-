import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, useToast } from '../../components/ui';
import { useAuth } from '../auth/AuthContext';
import { clearActiveRoom, getActiveRoom, onActiveRoom } from './activeRoom';
import { explainError } from '../../utils/errors';

/**
 * Menjaga pemain tetap tersambung ke ruangnya walau layar ruang diminimalkan:
 * - saat host menekan Mulai, pemain yang minimize otomatis dibawa masuk ke permainan;
 * - selama masih di ruang, muncul pita "Kembali / Keluar".
 */
export function ActiveRoomWatcher() {
  const { me } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const [code, setCode] = useState(getActiveRoom);
  const [status, setStatus] = useState<'lobby' | 'playing' | null>(null);
  const prev = useRef<string | null>(null);
  useEffect(() => onActiveRoom(() => setCode(getActiveRoom())), []);
  useEffect(() => {
    if (!code || !me) { setStatus(null); prev.current = null; return; }
    let off: (() => void) | undefined, dead = false;
    prev.current = null;
    void import('../../services/rooms').then((r) => {
      if (dead) return;
      off = r.watchRoom(code, (rm) => {
        if (!rm || !rm.players[me.uid] || rm.status === 'finished') { if (!window.location.hash.includes('/ruang/')) clearActiveRoom(); setStatus(null); return; }
        setStatus(rm.status);
        if (prev.current === 'lobby' && rm.status === 'playing' && !window.location.hash.includes('/ruang/')) nav(`/ruang/${code}`);
        prev.current = rm.status;
      }, () => undefined);
    }).catch(() => undefined);
    return () => { dead = true; off?.(); };
  }, [code, me?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!code || !me || !status || loc.pathname.startsWith('/ruang/')) return null;
  const leave = async () => {
    try { const r = await import('../../services/rooms'); await r.exitRoom(code, me.uid); clearActiveRoom(); }
    catch (e) { toast(explainError(e), 'err'); }
  };
  return (
    <div className="banner-room" role="status"><b>{status === 'lobby' ? `Kamu masih di lobi ${code}` : `Permainan ${code} sedang berjalan`}</b>
      <Button size="sm" onClick={() => nav(`/ruang/${code}`)}>Kembali</Button><Button size="sm" variant="soft" onClick={() => void leave()}>Keluar</Button></div>
  );
}
