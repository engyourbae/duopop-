import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from './AuthContext';
import { useOnline } from '../../hooks/useOnline';

/** Pembatas fitur akun: menjelaskan dengan jelas jika Firebase belum dikonfigurasi / belum login / offline. */
export function RequireAuth({ children, need }: { children: ReactNode; need: string }) {
  const { configured, loading, me } = useAuth();
  const online = useOnline();
  if (!configured) return <div className="page"><EmptyState icon="lock" title="Fitur online belum aktif" text={`${need} Pemilik aplikasi perlu mengisi konfigurasi Firebase (lihat README). Sementara itu, semua game solo dan bergiliran tetap bisa dimainkan.`} action={<Link to="/game"><Button>Main game solo</Button></Link>} /></div>;
  if (loading) return <Spinner label="Memeriksa sesi…" />;
  if (!me) return <div className="page"><EmptyState icon="user" title="Masuk dulu, yuk" text={need} action={<Link to="/masuk"><Button>Masuk atau daftar</Button></Link>} /></div>;
  if (!online) return <div className="page"><Card><p>Kamu sedang offline. Fitur ini memerlukan internet.</p><Link to="/game"><Button variant="soft">Main game solo</Button></Link></Card></div>;
  return <>{children}</>;
}
