/** Membersihkan service worker + cache lalu memuat ulang (data permainan di localStorage tidak dihapus). */
export async function resetApp(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); }
    if ('caches' in window) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); }
  } catch { /* abaikan */ }
  location.reload();
}
export const markBooted = () => { (window as unknown as { __duopopBooted?: boolean }).__duopopBooted = true; };
