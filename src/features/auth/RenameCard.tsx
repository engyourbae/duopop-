import { useState } from 'react';
import { Button, Card, Field, useToast } from '../../components/ui';
import { explainError } from '../../utils/errors';
import { useAuth } from './AuthContext';

/** Kartu "Ganti nama pengguna" di halaman Profil. */
export function RenameCard() {
  const { me, refresh } = useAuth();
  const toast = useToast();
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);
  if (!me) return null;
  const clean = v.trim().toLowerCase().replace(/^@/, '');
  const save = async () => {
    setBusy(true);
    try {
      const a = await import('../../services/auth');
      try {
        const h = await a.renameHandle(me.uid, me.handle, clean);
        toast(`Nama penggunamu sekarang @${h}`, 'ok'); setV(''); refresh();
      } catch (e) {
        const code = a.errCode(e);
        toast(code === 'permission-denied' ? explainError(e) : a.mapAuthError(code), 'err');
      }
    } finally { setBusy(false); }
  };
  return (
    <Card><h3>Ganti nama pengguna</h3>
      <p className="muted small">Nama lama otomatis dilepas dan diganti nama baru. Nama di daftar teman ikut berubah.</p>
      <Field label="Nama pengguna baru"><input value={v} maxLength={20} onChange={(e) => setV(e.target.value)} placeholder="mis. bintang_99" autoCapitalize="none" autoCorrect="off" spellCheck={false} /></Field>
      <Button size="sm" onClick={() => void save()} disabled={busy || clean.length < 3 || clean === me.handle}>{busy ? 'Menyimpan…' : 'Simpan nama'}</Button>
    </Card>
  );
}
