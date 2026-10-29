# DUOPOP — Play Closer, Know More

Aplikasi PWA game untuk pasangan, teman, dan grup, berbahasa Indonesia.
Stack: React + TypeScript (strict) + Vite, CSS buatan sendiri, Firebase (Auth + Firestore), service worker kustom, Vitest.

## Isi aplikasi
- **39 game** dengan mekanik berbeda (tanpa game kembar; topik/varian dipilih di layar pengaturan): pasangan, pengetahuan (Duel Pengetahuan dengan 17+ topik, Kuis Rebutan, Fakta atau Mitos, Kronologi, Estimasi, dll.), grup & pesta, arkade (Pasangan Kartu, Adu Refleks, Pukul Tikus, Ular Lapar, Terbang, Tangkap Bintang, Tebak Kata Rahasia, Adu Mengetik, Adu Ketuk, Susun Huruf), serta **kartu & papan: UNO, Gaple, Ular Tangga, Suit, Tic-Tac-Toe, Empat Sejajar**. Semuanya bisa dimainkan online.
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

## Main online (Mabar) untuk semua game
Setiap game bisa dimainkan online lewat **Lobi → Main Online**:
- **Cari lawan acak**: masuk antrean `matchQueue` dan dipertemukan otomatis dengan pemain online yang mencari game yang sama (tanpa kode). Penjodohan memakai transaksi Firestore agar dua pencari tidak bentrok.
- **Ajak teman online**: buat ruang, lalu undang teman yang sedang online (presensi `presence`, detak 30 detik); undangan muncul langsung sebagai pop-up di layar teman. Anggota grup juga bisa diajak bermain sekaligus dari halaman Grup, dan undangan grup juga muncul langsung.
- Kode ruang tetap ada sebagai cara ketiga.
Tiga cara bermain online (`src/features/multiplayer/rounds.ts`): **ronde sinkron** (kuis, pilih bersama, Siapa Paling Mungkin, tebak jawaban, kartu, roda, tebak kata, cerita, sambung kata), **papan bergiliran** (Tic-Tac-Toe, Empat Sejajar), dan **adu skor** (semua game arkade, kronologi, estimasi, petunjuk, dll.: semua bermain bersamaan lalu skor dibandingkan).

## Level, soal tak terbatas, dan jeda penjelasan
Game kuis punya mode **Santai**, **Level 1–10** (komposisi dan tingkat kesulitan naik, waktu per soal turun, lulus bila benar ≥ 70% untuk membuka level berikutnya), dan **Tanpa batas** (3 nyawa). Soal yang belum pernah dilihat selalu didahulukan. Selain bank soal, ada generator tak terbatas (hitungan, ibu kota dunia, provinsi, unsur kimia). Setelah menjawab ada jeda penjelasan 4/6/10 detik atau manual (Pengaturan).

## Privasi nama
Hanya **@username** yang terlihat pengguna lain. Nama Google/akun tidak disimpan di profil publik, daftar teman, grup, maupun ruang; profil lama dimigrasi otomatis saat login.

## Musik
Musik latar disintesis dengan WebAudio (tanpa berkas audio): satu lagu untuk lobi, satu untuk game, satu untuk arkade. Bisa dimatikan di Pengaturan.

## Chat, reaksi, dan stiker (sementara, tidak menumpuk di database)
Chat ruang, grup, dan antarteman hanya **numpang lewat** di Firestore: dokumen dihapus pengirim dalam ±55 detik (anggota mana pun ikut membersihkan sisa yang lebih dari 60 detik), dan riwayat disimpan **di perangkat** (localStorage, maks. 150 pesan per percakapan, bisa dihapus). Reaksi emote dan stiker kustom di dalam ruang muncul sebagai animasi sementara bagi semua pemain. Host juga menghapus seluruh data ruang (jawaban, skor, chat) 45 detik setelah game selesai. Konsekuensi: pesan tidak tersimpan untuk pemain yang offline lebih dari ±1 menit.

## Paket upgrade soal (tanpa mengubah kode)
`public/packs/upgrade-1.js` dipanggil lewat tag `<script src="./packs/upgrade-1.js"></script>` di `index.html` (sebelum skrip utama). Isinya memakai `window.DUOPOP_PACKS.push({...})` dan boleh berisi: `questions` (soal tertulis), `myths` (fakta/mitos), `datasets` (baris data + templat yang menghasilkan ribuan soal unik, termasuk perbandingan "mana yang lebih…"), `variants` (topik baru di Duel Pengetahuan & Kuis Rebutan), dan `categoryLabels`. Paket baru cukup ditambah sebagai file `.js` baru + satu tag script. Soal yang belum pernah kamu lihat selalu didahulukan, jadi permainan tidak mengulang-ulang. Catatan: di ruang online semua pemain harus memuat paket yang sama (otomatis bila memakai versi situs yang sama).

## Status online, volume musik, dan Security Rules
- Status **Online/Offline** teman memakai detak presensi tiap 30 detik dengan **jam server** (bukan jam HP), jadi tidak terpengaruh jam perangkat yang meleset. Agar terbaca, **kedua** pengguna harus memakai versi terbaru dan `firestore.rules` terbaru harus sudah di-**Publish**; bila ditolak, ruang tunggu menampilkan petunjuknya.
- Musik dibuat prosedural (piano elektrik, pad, petikan, bass, drum berayun, gaung, dan melodi yang berubah tiap putaran), lewat kompresor + saturasi lembut agar tidak pecah. Volume: Pelan / Sedang / Keras di Pengaturan.

## Layar loading, meta tag, dan layar putih
- **Layar loading**: logo beranimasi (dua lingkaran bertemu, irisan merah muncul, huruf melompat), bilah kemajuan, tips, dan **jingle pembuka + musik latar**. Browser hanya mengizinkan suara setelah sentuhan pertama, jadi bila audio belum diizinkan muncul tombol **Ketuk untuk mulai**. Tampil sekali per sesi; layar statis di `index.html` muncul seketika sebelum JavaScript siap.
- **Meta tag** (judul, deskripsi, Open Graph, Twitter Card, JSON-LD, ikon, tema) ada di `index.html`; gambar pratinjau `public/og-image.png` (1200×630). Catatan: bagian `#/game` pada tautan tidak dibaca oleh WhatsApp/Facebook, jadi semua tautan DUOPOP menampilkan kartu pratinjau yang sama.
- **Bila muncul layar putih**: `index.html` kini menampilkan panel "Aplikasi belum bisa dibuka" dengan tombol *Bersihkan cache & muat ulang* jika aplikasi gagal start dalam 10 detik atau ada berkas yang gagal dimuat; galat render ditangkap `ErrorBoundary`. Service worker mengambil HTML terbaru langsung dari jaringan agar tidak merujuk berkas lama yang sudah dihapus. Cek manual: tab Actions harus hijau, Settings → Pages → Source = GitHub Actions, dan buka `/duopop-/assets/` lewat tab Network (F12) untuk melihat berkas mana yang 404.

## Tampilan
Desain datar bergaya stiker (krem + tinta, garis tebal, bayangan bergeser, **tanpa gradasi**), font Bricolage Grotesque dan Figtree yang dibundel lokal (jalan offline). Semua popup, daftar pilihan, saklar, konfirmasi, dan lembar berbagi adalah komponen kustom (`src/components/ui.tsx`, `Share.tsx`), bukan dialog bawaan browser. Logo merek (Google, Gmail, WhatsApp, Telegram, Facebook, X) ada di `src/components/Brand.tsx`.

## Arsitektur singkat
| Folder | Isi |
|---|---|
| `src/features/games` | registry 36 game, `engine.ts` (skor, reducer kuis, level), `mechanics/` (28 mekanik), `logic.ts` (logika papan) |
| `src/data` | bank soal bertipe + validator, konten pasangan/pesta, daftar negara |
| `src/features/progression` | XP/level/lencana/streak (localStorage, dedupe sesi, batas XP harian) |
| `src/features/{auth,friends,groups,multiplayer}` | UI fitur online |
| `src/services` | akses Firebase (dimuat lazy lewat `import()`), `src/lib/firebase` konfigurasi |
| `public/sw.js` | service worker: cache shell + runtime, halaman offline, pembersihan cache versi lama |

### Multiplayer real-time (Firestore)
Dipilih Firestore `onSnapshot` (bukan Realtime Database) agar satu layanan dan satu set rules. Dokumen `rooms/{kode}` menyimpan host, seed, status, ronde, dan pemain. Jawaban ditulis ke `rooms/{kode}/answers/{ronde_uid}` (create-only). **Skor tidak disimpan**: dihitung ulang di tiap klien dari jawaban + timestamp server (`src/features/multiplayer/scoring.ts`), sehingga tidak ada field skor yang bisa dipalsukan. Host memajukan ronde; pemain yang terputus dapat bergabung kembali dengan kode yang sama.

### Keterbatasan keamanan yang jujur
- Bank soal dikirim ke browser (bundel statis GitHub Pages), jadi pemain yang membuka DevTools bisa melihat kunci jawaban. Memperbaikinya membutuhkan Cloud Functions + penyimpanan kunci di server (belum dibuat; tidak ada Cloud Functions di proyek ini).
- Undangan bermain (`roomInvites`) hanya mensyaratkan pengirim adalah host ruang tersebut, sehingga undangan ke non-teman (misalnya sesama anggota grup) mungkin; rules tidak bisa memeriksa keanggotaan grup bersama.
- Game adu-skor dimainkan di perangkat masing-masing dan skor akhir dikirim oleh klien (dibatasi 0–1.000.000, satu kali per pemain); pemain yang memodifikasi klien bisa memalsukan skor di ruang online.
- Rules membatasi tiap pemain hanya menulis jawabannya sendiri, sekali per ronde, tetapi batas waktu jawaban ditegakkan di sisi klien dan saat penghitungan skor, bukan di rules.
- Kedaluwarsa kode grup dicek di klien; rules menegakkan kapasitas dan "hanya menambah diri sendiri".
- XP/level bersifat lokal (per perangkat) dan hanya memengaruhi kosmetik; tidak ada papan peringkat global yang bisa dicurangi.

## Konten
Setiap soal punya `id, language, category, subcategory, difficulty, type, question, options, correctAnswer, explanation, sourceTitle, sourceUrl, verifiedAt, contentVersion, status`. Pada data, `options[0]` adalah jawaban benar dan diacak saat dimainkan. Status `terverifikasi` hanya boleh dipakai bila `sourceUrl` dan `verifiedAt` terisi (divalidasi oleh `validateQuestions` dan tes). Sebelum dipublikasikan luas, tinjau soal dan isi sumber (mis. ANRI, BPS, Badan Bahasa, BMKG, BRIN).

## Lisensi aset
Ikon SVG dan logo dibuat khusus untuk proyek ini; tidak memakai aset pihak ketiga selain paket npm (lihat `package.json`).
