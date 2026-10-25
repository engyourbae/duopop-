# DUOPOP — Play Closer, Know More

Aplikasi PWA game untuk pasangan, teman, dan grup, berbahasa Indonesia.
Stack: React + TypeScript (strict) + Vite, CSS buatan sendiri, Firebase (Auth + Firestore), service worker kustom, Vitest.

## Isi aplikasi
- **36 game** dengan mekanik berbeda (lihat `src/features/games/registry.ts`): 8 game pasangan, 20 game pengetahuan, 8 game grup/pesta.
- **Bank soal**: 283 butir (pilihan ganda, fakta/mitos, kronologi, tebak era, estimasi) + 16 teka-teki bertahap + 40 bendera. Semua berstatus `perlu-tinjauan` (belum diverifikasi ke sumber primer; `sourceUrl` sengaja kosong, tidak ada URL karangan). Lihat bagian *Konten*.
- **Solo/bergiliran** (1–8 pemain di satu perangkat): bisa offline setelah aplikasi dibuka sekali.
- **Online** (butuh Firebase): akun, teman, grup + undangan (kode/tautan), ruang multiplayer real-time untuk game berbasis soal.
- XP, level, lencana, streak tantangan harian, riwayat, statistik, tema profil, pengaturan suara/animasi/tema.

## Menjalankan lokal
```bash
npm ci
cp .env.example .env.local   # opsional; tanpa ini mode solo saja
npm run dev
```
Pemeriksaan: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run preview`.

## Konfigurasi Firebase (untuk fitur online)
1. Buat proyek di https://console.firebase.google.com, tambahkan **Web app**, salin nilai konfigurasinya ke `.env.local` (lihat `.env.example`).
2. Aktifkan **Authentication → Sign-in method → Google** (dan opsional Email/Password).
3. Buat database **Cloud Firestore** (mode produksi).
4. Terapkan aturan keamanan: `firebase deploy --only firestore:rules` (file `firestore.rules`), atau tempel isinya di Console → Firestore → Rules.
5. Di Authentication → Settings → **Authorized domains**, tambahkan `USERNAME.github.io`.
6. Query pencarian teman memakai indeks bawaan satu-field (`handleLower`); tidak perlu indeks komposit.

Tanpa konfigurasi, aplikasi **tidak** memalsukan login/multiplayer: layar fitur online menjelaskan bahwa Firebase belum aktif, dan semua game solo tetap berjalan.

## Deploy ke GitHub Pages
1. Push proyek ke repository GitHub (branch `main`).
2. Settings → Pages → **Source: GitHub Actions**.
3. Konfigurasi Firebase sudah tertanam di `.env.production` (nilai publik, bukan rahasia), jadi tidak perlu mengisi Variables GitHub. Untuk proyek Firebase lain, ubah isi file itu.
4. Workflow `.github/workflows/deploy.yml` otomatis lint → test → build → deploy tiap push ke `main`.

**Base path**: workflow mengisi `VITE_BASE=/<nama-repo>/` otomatis. Satu-satunya tempat pengaturan manual adalah variabel `VITE_BASE` (atau `base` di `vite.config.ts`). Default `./` (relatif) dan routing memakai `HashRouter`, sehingga aplikasi tidak rusak di subpath repository maupun saat di-refresh.

## Arsitektur singkat
| Folder | Isi |
|---|---|
| `src/features/games` | registry 36 game, `engine.ts` (skor, reducer kuis, level), `mechanics/` (18 mekanik) |
| `src/data` | bank soal bertipe + validator, konten pasangan/pesta, daftar negara |
| `src/features/progression` | XP/level/lencana/streak (localStorage, dedupe sesi, batas XP harian) |
| `src/features/{auth,friends,groups,multiplayer}` | UI fitur online |
| `src/services` | akses Firebase (dimuat lazy lewat `import()`), `src/lib/firebase` konfigurasi |
| `public/sw.js` | service worker: cache shell + runtime, halaman offline, pembersihan cache versi lama |

### Multiplayer real-time (Firestore)
Dipilih Firestore `onSnapshot` (bukan Realtime Database) agar satu layanan dan satu set rules. Dokumen `rooms/{kode}` menyimpan host, seed, status, ronde, dan pemain. Jawaban ditulis ke `rooms/{kode}/answers/{ronde_uid}` (create-only). **Skor tidak disimpan**: dihitung ulang di tiap klien dari jawaban + timestamp server (`src/features/multiplayer/scoring.ts`), sehingga tidak ada field skor yang bisa dipalsukan. Host memajukan ronde; pemain yang terputus dapat bergabung kembali dengan kode yang sama.

### Keterbatasan keamanan yang jujur
- Bank soal dikirim ke browser (bundel statis GitHub Pages), jadi pemain yang membuka DevTools bisa melihat kunci jawaban. Memperbaikinya membutuhkan Cloud Functions + penyimpanan kunci di server (belum dibuat; tidak ada Cloud Functions di proyek ini).
- Rules membatasi tiap pemain hanya menulis jawabannya sendiri, sekali per ronde, tetapi batas waktu jawaban ditegakkan di sisi klien dan saat penghitungan skor, bukan di rules.
- Kedaluwarsa kode grup dicek di klien; rules menegakkan kapasitas dan "hanya menambah diri sendiri".
- XP/level bersifat lokal (per perangkat) dan hanya memengaruhi kosmetik; tidak ada papan peringkat global yang bisa dicurangi.

## Konten
Setiap soal punya `id, language, category, subcategory, difficulty, type, question, options, correctAnswer, explanation, sourceTitle, sourceUrl, verifiedAt, contentVersion, status`. Pada data, `options[0]` adalah jawaban benar dan diacak saat dimainkan. Status `terverifikasi` hanya boleh dipakai bila `sourceUrl` dan `verifiedAt` terisi (divalidasi oleh `validateQuestions` dan tes). Sebelum dipublikasikan luas, tinjau soal dan isi sumber (mis. ANRI, BPS, Badan Bahasa, BMKG, BRIN).

## Lisensi aset
Ikon SVG dan logo dibuat khusus untuk proyek ini; tidak memakai aset pihak ketiga selain paket npm (lihat `package.json`).
