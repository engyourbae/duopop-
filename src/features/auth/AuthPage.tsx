import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, EmptyState, Field, Header, Tabs, useToast } from '../../components/ui';
import { Brand } from '../../components/Brand';
import { useAuth } from './AuthContext';

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
export default function AuthPage() {
  const { configured, me, refresh } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<'masuk' | 'daftar'>('masuk');
  const [f, setF] = useState({ email: '', pw: '', name: '', handle: '' });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  if (!configured) return <div className="page"><Header title="Masuk" back={() => nav(-1)} /><EmptyState icon="lock" title="Akun belum diaktifkan" text="Firebase belum dikonfigurasi, jadi login dan fitur online dinonaktifkan. Kamu tetap bisa bermain solo tanpa akun." action={<Link to="/game"><Button>Main sekarang</Button></Link>} /></div>;
  if (me && !me.handle) {
    const save = async (ev: FormEvent) => {
      ev.preventDefault();
      setBusy(true);
      try { const a = await import('../../services/auth'); await a.claimProfile(me.uid, me.displayName, f.handle); refresh(); toast('Profil dilengkapi. Selamat bermain!', 'ok'); nav('/'); }
      catch (e) { const a = await import('../../services/auth'); toast(a.mapAuthError(a.errCode(e)), 'err'); } finally { setBusy(false); }
    };
    return (<div className="page"><Header title="Satu langkah lagi" /><p className="muted">Halo, {me.displayName}! Pilih nama pengguna agar temanmu bisa menemukanmu.</p>
      <form onSubmit={save} noValidate><Field label="Nama pengguna"><input value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value.toLowerCase() })} autoCapitalize="none" placeholder="mis. joe_duopop" /></Field>
        <Button size="lg" type="submit" disabled={busy || f.handle.trim().length < 3}>{busy ? 'Menyimpan…' : 'Simpan'}</Button></form></div>);
  }
  if (me) return <div className="page"><Header title="Akun" back={() => nav(-1)} /><EmptyState icon="check" title={`Halo, ${me.displayName}!`} text="Kamu sudah masuk." action={<Link to="/profil"><Button>Lihat profil</Button></Link>} /></div>;
  const validate = () => {
    const e: Record<string, string> = {};
    if (!emailOk(f.email)) e.email = 'Format email tidak valid.';
    if (f.pw.length < 6) e.pw = 'Kata sandi minimal 6 karakter.';
    if (tab === 'daftar') {
      if (f.name.trim().length < 2) e.name = 'Nama minimal 2 karakter.';
      if (!/^[a-z0-9_]{3,20}$/.test(f.handle.trim().toLowerCase())) e.handle = 'Nama pengguna 3–20 karakter: huruf, angka, garis bawah.';
    }
    setErrs(e); return Object.keys(e).length === 0;
  };
  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const a = await import('../../services/auth');
      if (tab === 'masuk') await a.login(f.email, f.pw); else await a.register(f.email, f.pw, f.name, f.handle);
      refresh(); toast(tab === 'masuk' ? 'Berhasil masuk' : 'Akun dibuat. Selamat bermain!', 'ok'); nav('/');
    } catch (e) { const a = await import('../../services/auth'); toast(a.mapAuthError(a.errCode(e)), 'err'); } finally { setBusy(false); }
  };
  const google = async () => {
    setBusy(true);
    try { const a = await import('../../services/auth'); const has = await a.loginGoogle(); refresh(); if (has) { toast('Berhasil masuk', 'ok'); nav('/'); } }
    catch (e) { const a = await import('../../services/auth'); toast(a.mapAuthError(a.errCode(e)), 'err'); } finally { setBusy(false); }
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="page"><Header title={tab === 'masuk' ? 'Masuk' : 'Daftar'} back={() => nav(-1)} />
      <Button size="lg" className="btn-google" onClick={() => void google()} disabled={busy}><Brand name="google" size={22} />Lanjutkan dengan Google</Button>
      <div className="or">atau pakai email</div>
      <Tabs tabs={[{ id: 'masuk', label: 'Masuk' }, { id: 'daftar', label: 'Daftar' }]} value={tab} onChange={(t) => { setTab(t); setErrs({}); }} />
      <form onSubmit={submit} noValidate>
        {tab === 'daftar' && <><Field label="Nama tampilan" error={errs.name}><input value={f.name} onChange={set('name')} autoComplete="name" /></Field><Field label="Nama pengguna (untuk dicari teman)" error={errs.handle}><input value={f.handle} onChange={set('handle')} autoCapitalize="none" /></Field></>}
        <Field label="Email" error={errs.email}><input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Kata sandi" error={errs.pw}><input type="password" value={f.pw} onChange={set('pw')} autoComplete={tab === 'masuk' ? 'current-password' : 'new-password'} /></Field>
        <Button size="lg" type="submit" disabled={busy}>{busy ? 'Memproses…' : tab === 'masuk' ? 'Masuk' : 'Buat akun'}</Button>
      </form>
      <p className="center muted small gap">Tanpa akun pun kamu bisa bermain solo.</p>
    </div>
  );
}
