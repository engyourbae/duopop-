import { sfx } from './sound';
/** Pemberitahuan undangan: bunyi, getar, dan notifikasi sistem bila tab sedang di latar belakang dan izin sudah diberikan. */
export function alertInvite(text: string) {
  try { sfx.win(); } catch { /* abaikan */ }
  try { navigator.vibrate?.([120, 60, 120]); } catch { /* abaikan */ }
  try { if (typeof document !== 'undefined' && document.hidden && 'Notification' in window && Notification.permission === 'granted') new Notification('DUOPOP', { body: text, tag: 'duopop-invite', icon: './icon-192.png' }); } catch { /* abaikan */ }
}
export async function askNotifyPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}
