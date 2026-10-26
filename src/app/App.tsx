import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ConfirmProvider, Spinner, ToastProvider } from '../components/ui';
import { AuthProvider } from '../features/auth/AuthContext';
import { useProgress } from '../features/progression/store';
import { useOnline } from '../hooks/useOnline';
import { useMusic } from '../hooks/useMusic';
import { unlockMusic } from '../utils/music';
import { GlobalWatchers } from '../features/multiplayer/Invite';
import { Games, Help, HistoryPage, Home, NotFound, Notifications, OfflinePage, Profile, Settings, Splash, Stats } from './Pages';

const GamePage = lazy(() => import('../features/games/GamePage'));
const AuthPage = lazy(() => import('../features/auth/AuthPage'));
const FriendsPage = lazy(() => import('../features/friends/FriendsPage'));
const GroupsPage = lazy(() => import('../features/groups/GroupsPage'));
const LobbyPage = lazy(() => import('../features/multiplayer/Lobby'));
const RoomPage = lazy(() => import('../features/multiplayer/Room'));

function Shell() {
  const p = useProgress();
  const online = useOnline();
  const loc = useLocation();
  useMusic(loc.pathname.startsWith('/game/') || loc.pathname.startsWith('/ruang/') ? null : 'lobi');
  useEffect(() => { const f = () => unlockMusic(); window.addEventListener('pointerdown', f, { once: true }); return () => window.removeEventListener('pointerdown', f); }, []);
  useEffect(() => {
    const dark = p.settings.theme === 'gelap' || (p.settings.theme === 'sistem' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'gelap' : 'terang';
    document.documentElement.dataset.accent = p.theme;
    document.documentElement.classList.toggle('no-anim', !p.settings.animations);
  }, [p.settings.theme, p.settings.animations, p.theme]);
  const nav: [string, string, string][] = [['/', 'home', 'Beranda'], ['/game', 'grid', 'Game'], ['/teman', 'users', 'Teman'], ['/profil', 'user', 'Profil']];
  return (
    <>
      {!online && <div className="offline-bar" role="status">Offline — game solo tetap bisa dimainkan</div>}
      <GlobalWatchers />
      <main className="app"><Suspense fallback={<Spinner />}><Outlet /></Suspense></main>
      <nav className="nav" aria-label="Navigasi utama"><div className="nav-in">{nav.map(([to, ic, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}><Icon name={ic} /><span>{l}</span></NavLink>)}</div></nav>
    </>
  );
}
function Gate() { const p = useProgress(); return p.onboarded ? <Home /> : <Navigate to="/mulai" replace />; }

export default function App() {
  return (
    <AuthProvider><ToastProvider><ConfirmProvider><HashRouter>
      <Routes>
        <Route path="/mulai" element={<Splash />} />
        <Route element={<Shell />}>
          <Route index element={<Gate />} />
          <Route path="game" element={<Games />} />
          <Route path="game/:id" element={<GamePage />} />
          <Route path="harian" element={<Navigate to="/game/harian" replace />} />
          <Route path="lobi" element={<LobbyPage />} />
          <Route path="lobi/:code" element={<LobbyPage />} />
          <Route path="ruang/:code" element={<RoomPage />} />
          <Route path="masuk" element={<AuthPage />} />
          <Route path="profil" element={<Profile />} />
          <Route path="teman" element={<FriendsPage />} />
          <Route path="grup" element={<GroupsPage />} />
          <Route path="grup/gabung/:code" element={<GroupsPage />} />
          <Route path="riwayat" element={<HistoryPage />} />
          <Route path="statistik" element={<Stats />} />
          <Route path="notifikasi" element={<Notifications />} />
          <Route path="pengaturan" element={<Settings />} />
          <Route path="bantuan" element={<Help />} />
          <Route path="offline" element={<OfflinePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter></ConfirmProvider></ToastProvider></AuthProvider>
  );
}
