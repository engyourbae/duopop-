import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import App from './app/App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/global.css';

createRoot(document.getElementById('root') as HTMLElement).render(<StrictMode><ErrorBoundary><App /></ErrorBoundary></StrictMode>);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined); });
}
