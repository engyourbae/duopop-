import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import App from './app/App';
import { initPacks } from './data/questions/packs';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/global.css';

initPacks(); // daftarkan paket upgrade (public/packs/*.js) yang dimuat lewat <script> di index.html
createRoot(document.getElementById('root') as HTMLElement).render(<StrictMode><ErrorBoundary><App /></ErrorBoundary></StrictMode>);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; window.location.reload(); });
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' }).then((reg) => {
      const announce = () => window.dispatchEvent(new CustomEvent('duopop:update-ready', { detail: reg }));
      const check = () => { void reg.update().catch(() => undefined); };
      if (reg.waiting && navigator.serviceWorker.controller) announce();
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) announce(); });
      });
      check(); setInterval(check, 10 * 60 * 1000); // cek versi baru tiap 10 menit
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); }); // dan tiap aplikasi dibuka lagi
      window.addEventListener('online', check);
    }).catch(() => undefined);
  });
}
