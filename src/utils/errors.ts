/** Pesan galat yang bisa ditindaklanjuti (bukan sekadar "gagal"). */
export function explainError(e: unknown): string {
  const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '';
  if (code === 'permission-denied') return 'Ditolak aturan keamanan. Pastikan firestore.rules terbaru sudah di-Publish.';
  if (code === 'unavailable' || code === 'auth/network-request-failed') return 'Tidak ada koneksi ke server. Periksa internetmu.';
  if (code === 'failed-precondition') return 'Layanan database belum siap (butuh indeks/konfigurasi).';
  if (code === 'unauthenticated') return 'Sesi berakhir. Masuk lagi.';
  return code ? `Aksi gagal (${code}).` : 'Aksi gagal. Coba lagi.';
}
