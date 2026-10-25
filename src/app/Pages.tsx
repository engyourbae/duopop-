import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Field, Header, ProgressBar, Switch, Tabs, useConfirm, useToast } from '../components/ui';
import { Icon, Logo } from '../components/Icon';
import { GAMES, GROUP_LABEL } from '../features/games/registry';
import { levelInfo } from '../features/games/engine';
import { BADGES, DAILY_XP_CAP, THEMES, patchProgress, patchSettings, resetProgress, useProgress } from '../features/progression/store';
import { useAuth } from '../features/auth/AuthContext';
import { isFirebaseConfigured } from '../lib/firebase/config';
import { todayKey } from '../utils/rng';
import { useOnline } from '../hooks/useOnline';
import { QUESTION_COUNT } from '../features/games/engine';
import type { GameDef, GameGroup } from '../types';

export const toneOf = (id: string) => `t${[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 5}`;
export function GameCard({ g }: { g: GameDef }) {
  const nav = useNavigate();
  return (
    <button className="gcard" onClick={() => nav(`/game/${g.id}`)} aria-label={`Buka ${g.title}`}>
      <div className={`gic ${toneOf(g.id)}`}><Icon name={g.icon} /></div>
      <h3>{g.title}</h3><p>{g.tagline}</p>
      {g.core && <Badge>Inti</Badge>}
    </button>
  );
}

export function Splash() {
  const nav = useNavigate();
  const [step, setStep] = useState(-1);
  useEffect(() => { const t = setTimeout(() => setStep(0), 1200); return () => clearTimeout(t); }, []);
  const slides = [
    { icon: 'heart', title: 'Kenali lebih dekat', text: 'Game pasangan untuk saling tahu dan ngobrol lebih dalam.' },
    { icon: 'brain', title: 'Tahu lebih banyak', text: 'Kuis sejarah, budaya, sains, dan logika dalam Bahasa Indonesia.' },
    { icon: 'users', title: 'Main bareng', text: 'Duel bergiliran di satu ponsel, atau ruang online dengan kode undangan.' },
  ];
  const done = () => { patchProgress({ onboarded: true }); nav('/', { replace: true }); };
  if (step < 0) return <div className="splash"><div className="center"><Logo size={96} light /><p style={{ opacity: 0.95, marginTop: 8, fontWeight: 700 }}>Play Closer, Know More</p></div></div>;
  const s = slides[step] as (typeof slides)[number];
  return (
    <div className="app page center">
      <div className="row" style={{ justifyContent: 'flex-end' }}><Button variant="ghost" size="sm" onClick={done}>Lewati</Button></div>
      <div className="ob-art"><Icon name={s.icon === 'brain' ? 'sparkle' : s.icon} size={80} /></div>
      <h1>{s.title}</h1><p className="muted gap">{s.text}</p>
      <div className="dots">{slides.map((_, i) => <span key={i} className={`dot ${i === step ? 'on' : ''}`} />)}</div>
      <Button size="lg" className="gap" onClick={() => (step + 1 >= slides.length ? done() : setStep(step + 1))}>{step + 1 >= slides.length ? 'Mulai bermain' : 'Lanjut'}</Button>
    </div>
  );
}

export function Home() {
  const p = useProgress();
  const li = levelInfo(p.xp);
  const doneToday = p.dailyDone === todayKey();
  const core = GAMES.filter((g) => g.core);
  const rec = GAMES.filter((g) => !g.core && g.group !== 'arkade').filter((_, i) => (i + new Date().getDate()) % 4 === 0).slice(0, 4);
  return (
    <div className="page">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}><Logo /><Link to="/notifikasi" className="icon-btn" aria-label="Notifikasi"><Icon name="bell" /></Link></div>
      <div className="hero"><h2>Halo{p.name ? `, ${p.name}` : ''}!</h2><p>Level {li.level} · {p.xp} XP · Streak {p.streak.count} hari</p><ProgressBar value={li.pct} label="Kemajuan level" /></div>
      <Link to="/game/harian" style={{ textDecoration: 'none' }}><Card className="row" onClick={undefined}><div className="gic t2"><Icon name="sun" /></div><div className="grow"><b>Tantangan Harian</b><div className="small muted">{doneToday ? 'Selesai hari ini — sampai jumpa besok!' : '6 soal baru menantimu'}</div></div><Icon name="play" /></Card></Link>
      <h2 className="gap">Game inti</h2>
      <div className="grid">{core.map((g) => <GameCard key={g.id} g={g} />)}</div>
      <h2 className="gap">Arkade &amp; aksi</h2>
      <div className="grid">{GAMES.filter((g) => g.group === 'arkade').slice(0, 4).map((g) => <GameCard key={g.id} g={g} />)}</div>
      <h2 className="gap">Rekomendasi hari ini</h2>
      <div className="grid">{rec.map((g) => <GameCard key={g.id} g={g} />)}</div>
      <Link to="/game"><Button variant="soft" size="lg" className="gap">Lihat semua {GAMES.length} game</Button></Link>
    </div>
  );
}

export function Games() {
  const [tab, setTab] = useState<GameGroup | 'semua'>('semua');
  const [q, setQ] = useState('');
  const list = GAMES.filter((g) => (tab === 'semua' || g.group === tab) && g.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page"><Header title="Game" />
      <Tabs tabs={[{ id: 'semua', label: 'Semua' }, ...(['pasangan', 'pengetahuan', 'grup', 'arkade'] as GameGroup[]).map((id) => ({ id, label: GROUP_LABEL[id] }))]} value={tab} onChange={setTab} />
      <input className="input" placeholder="Cari game…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari game" style={{ marginBottom: 12 }} />
      {list.length === 0 ? <EmptyState icon="search" title="Tidak ada game" text="Coba kata kunci lain." /> : <div className="grid">{list.map((g) => <GameCard key={g.id} g={g} />)}</div>}
    </div>
  );
}

export function Profile() {
  const p = useProgress();
  const { me, configured, signOut } = useAuth();
  const toast = useToast();
  const li = levelInfo(p.xp);
  const [name, setName] = useState(p.name);
  return (
    <div className="page"><Header title="Profil" right={<Link to="/pengaturan" className="icon-btn" aria-label="Pengaturan"><Icon name="cog" /></Link>} />
      <Card className="center"><div className="avatar" style={{ margin: '0 auto 8px', width: 72, height: 72, fontSize: '1.8rem' }}>{(me?.displayName ?? p.name ?? 'P').slice(0, 1).toUpperCase() || 'P'}</div>
        <h2>{me?.displayName ?? (p.name || 'Tamu')}</h2><p className="muted small">{me ? `@${me.handle}` : 'Mode tamu — progres tersimpan di perangkat ini'}</p>
        <p>Level {li.level}</p><ProgressBar value={li.pct} label="Progres level" /><p className="small muted">{li.into}/{li.need} XP ke level berikutnya</p></Card>
      {!me && <Card><Field label="Nama panggilan"><input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} /></Field><Button size="sm" onClick={() => { patchProgress({ name: name.trim() }); toast('Nama disimpan', 'ok'); }}>Simpan</Button></Card>}
      <Card><h3>Tema profil</h3><div className="row wrap gap">{THEMES.map((t) => { const ok = li.level >= t.min; return <button key={t.id} className={`chip ${p.theme === t.id ? 'on' : ''}`} disabled={!ok} style={ok ? undefined : { opacity: 0.5 }} onClick={() => patchProgress({ theme: t.id })}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: t.color, marginRight: 6, border: '2px solid var(--edge)' }} />{t.name}{ok ? '' : ` (Lv ${t.min})`}</button>; })}</div></Card>
      <div className="grid"><Link to="/statistik" style={{ textDecoration: 'none' }}><Button variant="soft" size="lg" icon="trophy">Statistik</Button></Link><Link to="/riwayat" style={{ textDecoration: 'none' }}><Button variant="soft" size="lg" icon="clock">Riwayat</Button></Link>
        <Link to="/teman" style={{ textDecoration: 'none' }}><Button variant="soft" size="lg" icon="users">Teman</Button></Link><Link to="/grup" style={{ textDecoration: 'none' }}><Button variant="soft" size="lg" icon="users">Grup</Button></Link></div>
      <div className="gap">{me ? <Button variant="ghost" icon="logout" onClick={() => void signOut()}>Keluar</Button> : configured ? <Link to="/masuk"><Button size="lg">Masuk / Daftar</Button></Link> : <p className="muted small center">Login belum aktif (Firebase belum dikonfigurasi).</p>}</div>
    </div>
  );
}

export function Stats() {
  const p = useProgress();
  const li = levelInfo(p.xp);
  const total = p.history.length, correct = p.history.reduce((n, h) => n + h.correct, 0), qs = p.history.reduce((n, h) => n + h.total, 0);
  const best = p.history.reduce<Record<string, number>>((m, h) => { m[h.gameId] = (m[h.gameId] ?? 0) + 1; return m; }, {});
  const fav = Object.entries(best).sort((a, b) => b[1] - a[1])[0];
  return (
    <div className="page"><Header title="Statistik" back={() => history.back()} />
      <div className="hero"><h2>Level {li.level}</h2><p>{p.xp} XP total · batas XP harian {DAILY_XP_CAP}</p><ProgressBar value={li.pct} /></div>
      <Card><div className="stats"><div><b>{total}</b><span className="small muted">Permainan</span></div><div><b>{qs ? Math.round((correct / qs) * 100) : 0}%</b><span className="small muted">Akurasi</span></div><div><b>{p.streak.best}</b><span className="small muted">Streak terbaik</span></div></div>
        {fav && <p className="small muted gap center">Game terbanyak dimainkan: <b>{GAMES.find((g) => g.id === fav[0])?.title}</b> ({fav[1]}×)</p>}</Card>
      <h3>Pencapaian</h3>
      <div className="grid">{BADGES.map((b) => <div key={b.id} className={`badge-tile ${p.badges.includes(b.id) ? '' : 'off'}`}><Icon name="trophy" /><div><b>{b.title}</b></div><div className="muted">{b.desc}</div></div>)}</div>
    </div>
  );
}

export function HistoryPage() {
  const p = useProgress();
  return (
    <div className="page"><Header title="Riwayat" back={() => history.back()} />
      {p.history.length === 0 ? <EmptyState icon="clock" title="Belum ada riwayat" text="Selesaikan satu permainan untuk melihatnya di sini." action={<Link to="/game"><Button>Mulai main</Button></Link>} /> :
        p.history.map((h) => <Card key={h.sessionId}><div className="row"><div className="grow"><b>{GAMES.find((g) => g.id === h.gameId)?.title ?? h.gameId}</b><div className="small muted">{new Date(h.at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</div><div className="small">{h.players.map((x) => `${x.name}: ${x.score}`).join(' · ')}</div></div><div className="center"><b>{h.correct}/{h.total}</b><div className="small muted">+{h.xp} XP</div></div></div></Card>)}
    </div>
  );
}

export function Notifications() {
  const p = useProgress();
  const { me } = useAuth();
  const [inc, setInc] = useState(0);
  const [inv, setInv] = useState(0);
  useEffect(() => {
    if (!me || !isFirebaseConfigured) return;
    let offs: (() => void)[] = [], dead = false;
    void import('../services/social').then((s) => { if (dead) return; offs = [s.watchRequests(me.uid, (a) => setInc(a.length)), s.watchInvites(me.uid, (i) => setInv(i.length))]; }).catch(() => undefined);
    return () => { dead = true; offs.forEach((f) => f()); };
  }, [me?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const items: { icon: string; text: string; to: string }[] = [];
  if (p.dailyDone !== todayKey()) items.push({ icon: 'sun', text: 'Tantangan harian hari ini belum dimainkan.', to: '/game/harian' });
  if (inc) items.push({ icon: 'users', text: `${inc} permintaan pertemanan menunggu.`, to: '/teman' });
  if (inv) items.push({ icon: 'users', text: `${inv} undangan grup menunggu.`, to: '/grup' });
  return (
    <div className="page"><Header title="Notifikasi" back={() => history.back()} />
      {items.length === 0 ? <EmptyState icon="bell" title="Semua beres" text="Tidak ada notifikasi baru." /> : items.map((n, i) => <Link key={i} to={n.to} style={{ textDecoration: 'none', color: 'inherit' }}><Card className="row"><Icon name={n.icon} /><span className="grow">{n.text}</span><Icon name="play" size={16} /></Card></Link>)}
    </div>
  );
}

export function Settings() {
  const p = useProgress();
  const toast = useToast();
  const { me, configured } = useAuth();
  const ask = useConfirm();
  const s = p.settings;
  const Row = ({ label, k }: { label: string; k: 'sound' | 'animations' | 'shareProfile' | 'showOnline' }) => <Switch label={label} checked={s[k]} onChange={(v) => patchSettings({ [k]: v })} />;
  return (
    <div className="page"><Header title="Pengaturan" back={() => history.back()} />
      <Card><h3>Tampilan & suara</h3>
        <div className="row wrap gap">{(['sistem', 'terang', 'gelap'] as const).map((t) => <button key={t} className={`chip ${s.theme === t ? 'on' : ''}`} onClick={() => patchSettings({ theme: t })}>Tema {t}</button>)}</div>
        <Row label="Efek suara" k="sound" /><Row label="Animasi" k="animations" /></Card>
      <Card><h3>Privasi</h3><Row label="Bisa ditemukan lewat pencarian teman" k="shareProfile" /><Row label="Tampilkan status online" k="showOnline" />
        <p className="small muted">{configured && me ? 'Pengaturan privasi disimpan di perangkat ini; pencarian teman tetap hanya menampilkan nama tampilan dan nama pengguna.' : 'Berlaku saat kamu masuk dengan akun.'}</p></Card>
      <Card><h3>Data lokal</h3><Button variant="danger" onClick={() => { void ask({ title: 'Hapus semua progres?', text: 'XP, level, dan riwayat di perangkat ini akan hilang.', ok: 'Hapus', danger: true }).then((y) => { if (y) { resetProgress(); toast('Progres dihapus', 'ok'); } }); }}>Hapus progres</Button></Card>
    </div>
  );
}

export function Help() {
  const online = useOnline();
  return (
    <div className="page"><Header title="Bantuan" back={() => history.back()} />
      <div className="center gap"><Logo size={64} /><p className="muted">Versi 1.1.0 · Play Closer, Know More</p></div>
      <Card><h3>Cara kerja</h3><p>Game <b>solo/bergiliran</b> dimainkan di satu perangkat dan bisa offline setelah aplikasi dibuka sekali. <b>Akun, teman, grup, dan ruang online</b> memerlukan internet dan konfigurasi Firebase.</p></Card>
      <Card><h3>Tentang konten</h3><p>Bank berisi {QUESTION_COUNT} pertanyaan berbahasa Indonesia. Semuanya berstatus <b>perlu tinjauan</b> — belum diverifikasi ke sumber primer — jadi gunakan sebagai hiburan dan pembelajaran awal.</p></Card>
      <Card><h3>Love Language Quiz</h3><p>Hanya refleksi ringan, bukan diagnosis psikologis.</p></Card>
      <Card><h3>Status koneksi</h3><p>{online ? 'Online' : 'Offline — game solo tetap bisa dimainkan.'}</p></Card>
    </div>
  );
}
export const OfflinePage = () => <EmptyState icon="wifioff" title="Kamu sedang offline" text="Halaman ini butuh internet. Game solo tetap bisa dimainkan." action={<Link to="/game"><Button>Main game solo</Button></Link>} />;
export const NotFound = () => <EmptyState icon="search" title="Halaman tidak ditemukan" text="Tautan yang kamu buka tidak ada." action={<Link to="/"><Button>Ke beranda</Button></Link>} />;
