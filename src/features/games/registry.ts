import type { GameDef, GameVariant } from '../../types';

export const QUIZ_VARIANTS: GameVariant[] = [
  { id: 'semua', label: 'Semua topik' }, { id: 'sejarah', label: 'Sejarah Indonesia', categories: ['sejarah-id', 'kemerdekaan', 'kerajaan'] }, { id: 'dunia', label: 'Sejarah Dunia', categories: ['sejarah-dunia'] },
  { id: 'fakta', label: 'Fakta Indonesia', categories: ['fakta-id'] }, { id: 'geografi', label: 'Geografi', categories: ['geo-id', 'geo-dunia'] }, { id: 'budaya', label: 'Budaya & Sastra', categories: ['budaya'] },
  { id: 'tokoh', label: 'Tokoh & Teknologi', categories: ['tokoh', 'teknologi'] }, { id: 'sains', label: 'Sains & Alam', categories: ['sains', 'antariksa', 'hewan'] }, { id: 'logika', label: 'Logika', categories: ['logika'] },
  { id: 'ekonomi', label: 'Ekonomi & Keuangan', categories: ['ekonomi'] }, { id: 'kesehatan', label: 'Tubuh & Kesehatan', categories: ['kesehatan'] }, { id: 'bahasa', label: 'Bahasa Indonesia', categories: ['bahasa'] },
  { id: 'umum', label: 'Pengetahuan Umum', categories: ['umum'] }, { id: 'hitung', label: 'Hitung Cepat', bank: 'gen:math' }, { id: 'ibukota', label: 'Ibu Kota Dunia', bank: 'gen:capital' },
  { id: 'provinsi', label: 'Provinsi Indonesia', bank: 'gen:provinsi' }, { id: 'unsur', label: 'Tabel Periodik', bank: 'gen:unsur' },
];

const g = (d: Omit<GameDef, 'minPlayers' | 'maxPlayers' | 'offline'> & Partial<Pick<GameDef, 'minPlayers' | 'maxPlayers'>>): GameDef =>
  ({ minPlayers: 1, maxPlayers: 4, offline: true, multiplayer: true, ...d });
const P = (d: Parameters<typeof g>[0]) => g({ minPlayers: 2, maxPlayers: 2, ...d });

export const GAMES: GameDef[] = [
  P({ id: 'howwell', title: 'How Well Do You Know Me?', group: 'pasangan', mechanic: 'predict', bank: 'knowMe', icon: 'heart', color: '#ff5c8a', core: true,
    tagline: 'Seberapa dalam kamu mengenal pasanganmu?', rules: ['Pemain A menjawab tentang dirinya tanpa terlihat.', 'Pemain B menebak jawaban A.', 'Tebakan benar = 1 poin. Peran bertukar tiap ronde.'], variants: [{ id: 'kenal', label: 'Tentang Diriku', bank: 'knowMe' }, { id: 'pilih', label: 'Pilihan Sulit', bank: 'predictBank' }] }),
  g({ id: 'thisorthat', minPlayers: 2, maxPlayers: 8, title: 'This or That', group: 'pasangan', mechanic: 'pair', bank: 'thisOrThat', icon: 'swap', color: '#ffb020', core: true,
    tagline: 'Pilih satu dari dua — pilihan ringan atau Would You Rather.', rules: ['Setiap pemain memilih diam-diam secara bergantian.', 'Pilihan sama = cocok.', 'Lihat persentase kecocokan di akhir.'], variants: [{ id: 'tot', label: 'This or That', bank: 'thisOrThat' }, { id: 'wyr', label: 'Would You Rather', bank: 'wouldYouRather' }] }),
  g({ id: 'likely', title: 'Who’s More Likely To?', group: 'pasangan', mechanic: 'likely', bank: 'likelyBank', icon: 'who', color: '#12b886', minPlayers: 2, maxPlayers: 8,
    tagline: 'Tebak siapa yang paling mungkin melakukannya.', rules: ['Setiap pemain menunjuk satu nama.', 'Nama dengan suara terbanyak “menang”.', 'Cocok untuk berdua atau ramai-ramai.'] }),
  g({ id: 'memory', minPlayers: 2, maxPlayers: 8, title: 'Kartu Obrolan', group: 'pasangan', mechanic: 'deck', bank: 'memoryLane', icon: 'album', color: '#f06595',
    tagline: 'Kenangan, obrolan dalam, atau Jujur-Tantangan.', rules: ['Ambil kartu pertanyaan kenangan.', 'Bergantian menjawab dengan jujur.', 'Tandai kartu yang sudah dibahas.'], variants: [{ id: 'mem', label: 'Memory Lane', bank: 'memoryLane' }, { id: 'deep', label: 'Obrolan Dalam', bank: 'deepTalk' }, { id: 'td', label: 'Jujur atau Tantangan', bank: 'truthDare' }, { id: 'tim', label: 'Tantangan Tim', bank: 'challenges' }] }),
  P({ id: 'lovelang', title: 'Love Language Quiz', group: 'pasangan', mechanic: 'lovelang', bank: 'loveQuiz', icon: 'sparkle', color: '#e64980',
    tagline: 'Kenali cara kalian menerima kasih sayang.', rules: ['Pilih pernyataan yang paling sesuai denganmu.', 'Hasilnya refleksi ringan, bukan diagnosis psikologis.', 'Bandingkan hasil berdua.'] }),
  // ===== Pengetahuan =====
  g({ id: 'duel', title: 'Duel Pengetahuan', group: 'pengetahuan', mechanic: 'mcq', icon: 'swords', color: '#7c4dff', core: true, multiplayer: true, minPlayers: 1, maxPlayers: 4,
    tagline: 'Pilih topik, lalu adu cepat dan tepat.', rules: ['Jawab sebelum waktu habis.', 'Jawaban cepat memberi poin bonus.', 'Mode bergiliran 1–4 pemain atau ruang online.'], variants: QUIZ_VARIANTS }),
  g({ id: 'fakta-mitos', title: 'Fakta atau Mitos', group: 'pengetahuan', mechanic: 'tf', categories: ['mitos'], icon: 'scale', color: '#f08c00', core: true, multiplayer: true,
    tagline: 'Fakta, mitos, atau belum cukup bukti?', rules: ['Tentukan status setiap pernyataan.', 'Ada opsi “Belum cukup bukti”.', 'Penjelasan membantu membedakan klaim.'] }),
  g({ id: 'tebak-era', title: 'Tebak Era', group: 'pengetahuan', mechanic: 'era', icon: 'hourglass', color: '#9c36b5', multiplayer: true,
    tagline: 'Peristiwa ini terjadi di era apa?', rules: ['Pilih periode waktu yang tepat.', 'Lima periode, satu jawaban benar.', 'Latih rasa sejarahmu.'] }),
  g({ id: 'kronologi', title: 'Susun Kronologi', group: 'pengetahuan', mechanic: 'order', icon: 'list', color: '#2f9e44', core: true,
    tagline: 'Urutkan peristiwa dari yang paling awal.', rules: ['Ketuk peristiwa sesuai urutan waktu.', 'Skor sesuai posisi yang tepat.', 'Tahun ditampilkan setelah menjawab.'] }),
  g({ id: 'misteri', title: 'Tebak Petunjuk', group: 'pengetahuan', mechanic: 'clues', bank: 'misteri', icon: 'search', color: '#5f3dc4',
    tagline: 'Misteri benda atau tokoh — tebak lebih awal, poin lebih besar.', rules: ['Setiap petunjuk membuka poin yang lebih kecil.', 'Tebak kapan saja.', 'Salah tebak mengurangi poin.'], variants: [{ id: 'misteri', label: 'Misteri Benda & Tempat', bank: 'misteri' }, { id: 'tokoh', label: 'Tebak Tokoh', bank: 'tokoh' }] }),
  g({ id: 'berantai', title: 'Benar atau Salah Berantai', group: 'pengetahuan', mechanic: 'chain-tf', categories: ['mitos'], icon: 'chain', color: '#d6336c',
    tagline: 'Rantai jawaban benar — satu salah, selesai!', rules: ['Jawab benar untuk menambah rantai.', 'Satu jawaban salah mengakhiri permainan.', 'Pengali poin naik tiap 3 jawaban benar.'] }),
  g({ id: 'bendera', title: 'Tebak Bendera & Negara', group: 'pengetahuan', mechanic: 'flag', icon: 'flagpole', color: '#c92a2a', multiplayer: true,
    tagline: 'Kenali negara dari benderanya.', rules: ['Lihat bendera, pilih nama negara.', 'Ada 40 negara.', 'Jika bendera tidak tampil di perangkatmu, kode huruf ditampilkan.'] }),
  g({ id: 'estimasi', title: 'Estimasi Cerdas', group: 'pengetahuan', mechanic: 'estimate', icon: 'target', color: '#e67700',
    tagline: 'Tebak angkanya — makin dekat, makin tinggi poin.', rules: ['Ketik perkiraan angka.', 'Skor berdasarkan selisih relatif.', 'Tidak perlu tepat, cukup dekat.'] }),
  g({ id: 'harian', title: 'Tantangan Harian', group: 'pengetahuan', mechanic: 'mcq', bank: 'daily', icon: 'sun', color: '#f76707',
    tagline: 'Enam soal baru setiap hari — jaga streak-mu.', rules: ['Soal sama untuk semua orang di hari yang sama.', 'XP harian hanya sekali per hari.', 'Mainkan tiap hari untuk menambah streak.'] }),
  // ===== Grup & pesta =====
  g({ id: 'rapidfire', title: 'Rapid Fire', group: 'grup', mechanic: 'deck', bank: 'rapidFire', icon: 'bolt', color: '#fa5252', core: true, minPlayers: 2, maxPlayers: 8,
    tagline: 'Jawab cepat sebelum 8 detik habis!', rules: ['Kartu muncul dengan timer 8 detik.', 'Pemain giliran menjawab lantang.', 'Tekan “Berhasil” atau “Gagal” untuk mencatat skor.'] }),
  g({ id: 'wordassoc', title: 'Word Association', group: 'grup', mechanic: 'wordchain', icon: 'chain', color: '#5c7cfa', minPlayers: 2, maxPlayers: 8,
    tagline: 'Sambung kata secepat mungkin.', rules: ['Ketik kata yang berhubungan dengan kata sebelumnya.', 'Kata tidak boleh diulang.', 'Waktu habis = tersingkir. Yang terakhir menang.'] }),
  g({ id: 'story', title: 'Story Builder', group: 'grup', mechanic: 'story', bank: 'storyStarters', icon: 'book', color: '#be4bdb', minPlayers: 2, maxPlayers: 8,
    tagline: 'Bangun cerita bersama, satu kalimat tiap giliran.', rules: ['Mulai dari kalimat pembuka.', 'Tiap pemain menambah satu kalimat.', 'Baca cerita utuh di akhir.'] }),
  g({ id: 'spin', title: 'Spin the Challenge', group: 'grup', mechanic: 'wheel', bank: 'wheel', icon: 'dice', color: '#f59f00', minPlayers: 2, maxPlayers: 8,
    tagline: 'Putar roda dan terima tantangannya!', rules: ['Putar roda.', 'Lakukan tantangan yang keluar.', 'Selesai = 1 poin.'] }),
  g({ id: 'tebakkata', title: 'Tebak Kata', group: 'grup', mechanic: 'wordguess', bank: 'words', icon: 'chat', color: '#20c997', minPlayers: 2, maxPlayers: 8,
    tagline: 'Jelaskan kata tanpa menyebutnya, timmu menebak!', rules: ['Satu pemain melihat kata, lainnya menebak.', 'Waktu 60 detik per giliran.', 'Tekan Benar atau Lewati.'] }),
  P({ id: 'chemistry', title: 'Chemistry Meter', group: 'pasangan', mechanic: 'match', bank: 'chemistryBank', icon: 'heart', color: '#e64980',
    tagline: 'Seberapa sejalan pandangan kalian? Lihat persentasenya.', rules: ['Pernyataan muncul, kalian menjawab diam-diam.', 'Jawaban sama = kecocokan bertambah.', 'Lihat persentase chemistry di akhir lalu ngobrol soal bedanya.'], variants: [{ id: 'chem', label: 'Chemistry Meter', bank: 'chemistryBank' }, { id: 'match', label: 'Cocokkan Jawaban', bank: 'matchBank' }] }),
  g({ id: 'memorymatch', title: 'Pasangan Kartu', group: 'arkade', mechanic: 'memorymatch', icon: 'album', color: '#e03131',
    tagline: 'Balik kartu, cari pasangannya. Bergiliran!', rules: ['Balik dua kartu per giliran.', 'Kalau cocok, kamu dapat poin dan jalan lagi.', 'Pemain dengan pasangan terbanyak menang.'] }),
  P({ id: 'reflex', title: 'Adu Refleks', group: 'arkade', mechanic: 'reflex', icon: 'bolt', color: '#fab005',
    tagline: 'Siapa yang menyentuh layar paling cepat?', rules: ['Taruh ponsel di tengah, masing-masing satu sisi.', 'Tunggu layar berubah hijau, lalu sentuh sisimu secepatnya.', 'Menyentuh sebelum hijau = kalah ronde itu.'] }),
  P({ id: 'tictactoe', title: 'Tic-Tac-Toe', group: 'arkade', mechanic: 'tictactoe', icon: 'x', color: '#1c7ed6',
    tagline: 'Tiga sejajar menang. Klasik untuk berdua.', rules: ['Bergantian menaruh X dan O.', 'Tiga sejajar mendatar, menurun, atau miring menang.', 'Pemula giliran bertukar tiap ronde.'] }),
  P({ id: 'connect4', title: 'Empat Sejajar', group: 'arkade', mechanic: 'connect4', icon: 'grid', color: '#d9480f',
    tagline: 'Jatuhkan cakram, buat empat sejajar.', rules: ['Pilih kolom untuk menjatuhkan cakram.', 'Empat sejajar ke arah mana pun menang.', 'Papan penuh = seri.'] }),
  g({ id: 'whack', title: 'Pukul Tikus', group: 'arkade', mechanic: 'whack', icon: 'hammer', color: '#8a5a2b',
    tagline: 'Ketuk tikus yang muncul sebelum kabur!', rules: ['Tikus muncul acak di 9 lubang.', 'Ketuk secepatnya untuk dapat poin.', 'Makin lama makin cepat.'] }),
  g({ id: 'stroop', title: 'Tebak Warna', group: 'arkade', mechanic: 'stroop', icon: 'sparkle', color: '#7048e8',
    tagline: 'Pilih WARNA tinta, bukan tulisannya!', rules: ['Sebuah kata warna tampil dengan tinta berbeda.', 'Pilih warna tintanya, bukan arti katanya.', 'Salah mengurangi 1 poin.'] }),
  g({ id: 'simon', title: 'Ikuti Urutan', group: 'arkade', mechanic: 'simon', icon: 'bell', color: '#0ca678',
    tagline: 'Hafalkan nyala warna dan ulangi urutannya.', rules: ['Perhatikan urutan pad yang menyala.', 'Ulangi urutan yang sama.', 'Urutan bertambah satu tiap ronde.'] }),
  g({ id: 'snake', title: 'Ular Lapar', group: 'arkade', mechanic: 'snake', icon: 'chain', color: '#2f9e44',
    tagline: 'Makan sebanyak mungkin tanpa menabrak.', rules: ['Geser jari atau pakai tombol arah.', 'Makan apel agar memanjang.', 'Menabrak dinding atau badan sendiri = selesai.'] }),
  g({ id: 'flappy', title: 'Terbang Melewati Pipa', group: 'arkade', mechanic: 'flappy', icon: 'bird', color: '#f08c00',
    tagline: 'Ketuk untuk mengepak, lolos dari pipa.', rules: ['Ketuk layar untuk melompat.', 'Lewati celah di antara pipa.', 'Menabrak = selesai.'] }),
  g({ id: 'catch', title: 'Tangkap Bintang', group: 'arkade', mechanic: 'catch', icon: 'star', color: '#e8590c',
    tagline: 'Geser keranjang, tangkap bintang, hindari bom.', rules: ['Geser jari kiri-kanan untuk menggerakkan keranjang.', 'Bintang +1, bom mengurangi nyawa.', 'Kamu punya 3 nyawa.'] }),

  g({ id: 'uno', title: 'UNO', group: 'kartu', mechanic: 'uno', icon: 'dice', color: '#e03131', minPlayers: 2, maxPlayers: 4,
    tagline: 'Habiskan kartumu duluan! Warna atau angka harus cocok.', rules: ['Tiap pemain mendapat 7 kartu.', 'Mainkan kartu yang warna atau angkanya sama dengan kartu teratas.', 'Lewati, Balik, +2, dan Liar mengubah permainan.', 'Tidak ada kartu cocok? Ambil satu kartu. Yang pertama menghabiskan kartu menang.'] }),
  g({ id: 'gaple', title: 'Gaple', group: 'kartu', mechanic: 'gaple', icon: 'puzzle', color: '#1c7ed6', minPlayers: 2, maxPlayers: 4,
    tagline: 'Domino khas Indonesia: sambung angka di kedua ujung.', rules: ['28 kartu domino, 7 untuk tiap pemain.', 'Pemegang balak tertinggi jalan lebih dulu.', 'Pasang kartu yang angkanya cocok dengan ujung kiri atau kanan.', 'Tidak punya kartu cocok? Lewati. Habis duluan atau titik paling sedikit saat buntu menang.'] }),
  g({ id: 'ulartangga', title: 'Ular Tangga', group: 'kartu', mechanic: 'ladder', icon: 'chain', color: '#2f9e44', minPlayers: 2, maxPlayers: 4,
    tagline: 'Lempar dadu, naik tangga, hindari ular.', rules: ['Lempar dadu bergantian.', 'Tangga membawamu naik, ular menurunkanmu.', 'Dadu 6 memberi giliran lagi.', 'Harus tepat di kotak 100 untuk menang.'] }),
  g({ id: 'suit', title: 'Suit Batu Gunting Kertas', group: 'kartu', mechanic: 'rps', icon: 'swords', color: '#d9480f', minPlayers: 2, maxPlayers: 8,
    tagline: 'Pilih serentak, kalahkan lawan. Terbaik dari beberapa ronde.', rules: ['Semua pemain memilih diam-diam.', 'Batu > Gunting > Kertas > Batu.', 'Poin = jumlah lawan yang kamu kalahkan.'] }),
  g({ id: 'wordle', title: 'Tebak Kata Rahasia', group: 'arkade', mechanic: 'wordle', icon: 'abc', color: '#2f9e44',
    tagline: 'Tebak kata 5 huruf dalam 6 percobaan.', rules: ['Ketik kata 5 huruf lalu kirim.', 'Hijau = huruf dan tempat benar, kuning = huruf ada tapi salah tempat, abu = tidak ada.', 'Makin sedikit percobaan, makin tinggi skor.'] }),
  g({ id: 'ngetik', title: 'Adu Mengetik', group: 'arkade', mechanic: 'typing', icon: 'chat', color: '#7048e8',
    tagline: 'Ketik kalimat secepat dan seakurat mungkin.', rules: ['Waktu dihitung sejak ketikan pertama.', 'Skor = kecepatan × ketepatan.', 'Kalimat sama untuk semua pemain.'] }),
  g({ id: 'ketuk', title: 'Adu Ketuk', group: 'arkade', mechanic: 'tapbattle', icon: 'bolt', color: '#f08c00',
    tagline: 'Ketuk sebanyak-banyaknya sebelum waktu habis!', rules: ['Tekan tombol besar secepat mungkin.', 'Waktu terbatas.', 'Jumlah ketukan terbanyak menang.'] }),
  g({ id: 'anagram', title: 'Susun Huruf', group: 'arkade', mechanic: 'anagram', icon: 'abc', color: '#e64980',
    tagline: 'Susun huruf acak menjadi kata sebanyak-banyaknya.', rules: ['Ketuk huruf untuk menyusun kata.', 'Ada petunjuk kategori.', 'Kata benar menambah poin, lewati mengurangi.'] }),
  g({ id: 'buzzer', title: 'Kuis Rebutan', group: 'pengetahuan', mechanic: 'buzzer', icon: 'bell', color: '#c2255c', minPlayers: 2, maxPlayers: 4,
    tagline: 'Siapa cepat menekan bel, dia yang menjawab!', rules: ['Pertanyaan muncul kata demi kata.', 'Tekan bel milikmu untuk menjawab lebih dulu.', 'Benar +2, menekan sebelum selesai dibaca bonus +1, salah −1.'], variants: QUIZ_VARIANTS }),
];
export const gameById = (id: string) => GAMES.find((x) => x.id === id);
export const GROUP_LABEL = { pasangan: 'Pasangan', pengetahuan: 'Pengetahuan', grup: 'Grup & Pesta', arkade: 'Arkade & Aksi', kartu: 'Kartu & Papan' } as const;
/** Menerapkan varian (bank/kategori) ke salinan definisi game. */
export function withVariant(g: GameDef, variantId?: string | null): GameDef {
  const v = g.variants?.find((x) => x.id === variantId) ?? g.variants?.[0];
  return v ? { ...g, bank: v.bank ?? (v.categories ? undefined : g.bank), categories: v.categories, title: g.title } : g;
}
export const isRoomGame = (g: GameDef) => !!g.multiplayer;
