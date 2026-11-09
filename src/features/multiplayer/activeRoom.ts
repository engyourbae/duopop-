/** Ruang yang sedang diikuti pemain ini (tetap tercatat walau layar ruang diminimalkan). */
const KEY = 'duopop:active-room';
const EV = 'duopop:active-room';
export function getActiveRoom(): string {
  try { return (localStorage.getItem(KEY) ?? '').toUpperCase(); } catch { return ''; }
}
export function setActiveRoom(code: string) {
  const c = code.toUpperCase();
  if (getActiveRoom() === c) return;
  try { if (c) localStorage.setItem(KEY, c); else localStorage.removeItem(KEY); } catch { /* abaikan */ }
  window.dispatchEvent(new Event(EV));
}
export const clearActiveRoom = () => setActiveRoom('');
export function onActiveRoom(cb: () => void): () => void {
  window.addEventListener(EV, cb);
  return () => window.removeEventListener(EV, cb);
}
